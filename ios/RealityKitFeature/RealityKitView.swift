//
//  RealityKitView.swift
//
//  The 3D design viewer: loads a scanned/template room model, lets the user
//  orbit a virtual camera through it, and place/move/scale/rotate furniture.
//
//  ── WHERE THIS SITS IN THE BRIDGE ────────────────────────────────────────
//  This class is pure UIKit/RealityKit — it knows almost nothing about React
//  Native. The bridge touches it in exactly three places:
//
//    props    JS sets modelUrl → RN applies it via KVC (setValue:forKey:),
//             which triggers the var's didSet → loadRoom() runs.
//    commands JS calls e.g. loadFurnitureCommand() → UIManager dispatch →
//             RealityKitViewManager resolves the reactTag to this instance →
//             plain Swift method call (loadFurniture, captureSnapshot, …).
//    events   The @objc RCTDirectEventBlock vars below are callback slots
//             RN injects when JS passes the matching prop; calling one IS
//             sending the event to JS as e.nativeEvent.
//
//  Registration lives in RealityKitViewManager.swift/.m — see the comments
//  there for how the runtime string-matching works.
//
//  ── SCENE STRUCTURE ──────────────────────────────────────────────────────
//  • The room model is loaded, then shifted so its center sits at the world
//    origin — all camera/furniture math assumes this.
//  • Camera rig: a pivot Entity at the origin with a PerspectiveCamera as
//    its child. Orbiting = rotating the pivot; zooming = changing the
//    camera's local distance (cameraRadius). See applyOrbit().
//  • cameraMode is .nonAR: this is a virtual 3D scene renderer, NOT a live
//    camera/AR passthrough — which is also why it works in the simulator.
//  • Each placed furniture piece hangs under its own AnchorEntity at the
//    floor point where it was placed.
//

import UIKit
import RealityKit
import CryptoKit
import React

// A second finger landing mid-drag would otherwise sit invisible to this
// recognizer (maximumNumberOfTouches just stops it tracking further
// touches, it doesn't yield them) — pinch/rotate/two-finger-pan would
// never get a look at that second touch since pan already claimed the
// sequence. Explicitly failing/cancelling as soon as a second touch
// arrives releases it immediately, letting those recognizers pick it up.
private final class SingleTouchPanGestureRecognizer: UIPanGestureRecognizer {
    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent) {
        super.touchesBegan(touches, with: event)
        guard numberOfTouches > 1 else { return }
        state = (state == .began || state == .changed) ? .cancelled : .failed
    }
}

@objc(RealityKitView)
class RealityKitView: UIView, UIGestureRecognizerDelegate {

    private var arView: ARView!

    // ── Event slots (native → JS) ─────────────────────────────────────────
    // These are NOT ordinary closures we assign ourselves: React Native
    // injects each block when JS passes the matching prop (declared in
    // RealityKitViewManager.m). Calling one IS emitting the event; the
    // dictionary arrives in JS as e.nativeEvent. If JS didn't pass the
    // prop, the var stays nil — hence the optional-chaining calls.

    // Fired with {path} after captureSnapshot(), or {error} on failure
    @objc var onSnapshotReady: RCTDirectEventBlock?

    // Fired with {selected: Bool} whenever furniture selection changes
    @objc var onFurnitureSelectionChanged: RCTDirectEventBlock?

    // Fired with {layout} (a JSON-encoded array) after exportFurnitureLayout(), or {error} on failure
    @objc var onFurnitureLayoutExported: RCTDirectEventBlock?

    // Fired with {path} after exportDesignPdf(), or {error} on failure
    @objc var onDesignPdfExported: RCTDirectEventBlock?

    private var yaw: Float = 0
    private var pitch: Float = 0
    private var cameraRadius: Float = 5.0
    private var cameraPivot: Entity?
    private var camera: PerspectiveCamera?
    private var roomBounds: BoundingBox?
    private var floorY: Float?
    private var initialCamPosition: SIMD3<Float> = .zero
    private var initialPivotPosition: SIMD3<Float> = .zero
    private var isTopView = false
    private var savedCamTransform: Transform?

    private var pendingFurniture: Entity?
    private var pendingFurnitureURL: String?
    private var placedFurniture: [Entity] = []
    // Entities carry no data of their own about where they were loaded from,
    // so the source URL of each placed piece is tracked here by identity —
    // needed to export/restore a design's furniture layout.
    private var furnitureURLs: [ObjectIdentifier: String] = [:]
    private var selectedFurniture: Entity?
    private var draggingFurniture: Entity?

    // ── Prop (JS → native) ────────────────────────────────────────────────
    // RN doesn't call a setter method for props — it applies them via
    // Key-Value Coding (setValue:forKey:"modelUrl"), which Swift routes
    // through this stored property. didSet is therefore the ONLY hook we
    // get, making it the de facto "prop changed" handler.
    @objc var modelUrl: NSString? {
        didSet {
            guard let urlStr = modelUrl as String?, let url = resolveURL(urlStr) else { return }
            loadRoom(from: url)
        }
    }

    // Resolves "bundle://name.usdz" (app bundle), "https://..." (remote), or "file://..." (local) into a loadable URL.
    private func resolveURL(_ urlString: String) -> URL? {
        if urlString.hasPrefix("bundle://") {
            let filename = String(urlString.dropFirst("bundle://".count))
            let name = (filename as NSString).deletingPathExtension
            let ext = (filename as NSString).pathExtension
            return Bundle.main.url(forResource: name, withExtension: ext.isEmpty ? nil : ext)
        }
        return URL(string: urlString)
    }

    override init(frame: CGRect) {
        super.init(frame: frame)
        setup()
    }

    // Required by UIView, but this view is only ever created in code (by the
    // manager's view() factory), never from a storyboard/nib.
    required init?(coder: NSCoder) { fatalError() }

    private func setup() {
        arView = ARView(frame: bounds)
        arView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        arView.cameraMode = .nonAR
        addSubview(arView)
        setupGestures()
    }

    // Remote https models are downloaded once and cached; local URLs pass through.
    private func localFileURL(for url: URL) async throws -> URL {
        guard url.scheme == "https" || url.scheme == "http" else { return url }

        let caches = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
        let modelsDir = caches.appendingPathComponent("models", isDirectory: true)
        try FileManager.default.createDirectory(at: modelsDir, withIntermediateDirectories: true)

        let digest = SHA256.hash(data: Data(url.absoluteString.utf8))
        let hex = digest.map { String(format: "%02x", $0) }.joined().prefix(16)
        let dest = modelsDir.appendingPathComponent("\(hex)_\(url.lastPathComponent)")

        if FileManager.default.fileExists(atPath: dest.path) { return dest }

        let (tmp, _) = try await URLSession.shared.download(from: url)
        try? FileManager.default.removeItem(at: dest)
        try FileManager.default.moveItem(at: tmp, to: dest)
        return dest
    }

    // MARK: - Room Loading

    func loadRoom(from url: URL) {
        Task { @MainActor in
            do {
                let localURL = try await self.localFileURL(for: url)
                let entity = try await Entity.load(contentsOf: localURL)
                let bounds = entity.visualBounds(relativeTo: nil)
                entity.position -= bounds.center

                // Room is shifted by -center, so the floor plane lands here in world space
                self.floorY = bounds.min.y - bounds.center.y

                // Generate collision shapes so raycasting hits the floor
                entity.generateCollisionShapes(recursive: true)

                let anchor = AnchorEntity(world: .zero)
                anchor.addChild(entity)
                arView.scene.addAnchor(anchor)

                setupOrbitCamera(bounds: bounds)
                addLighting()
                print("✅ Room loaded from:", url.lastPathComponent)
            } catch {
                print("❌ loadRoom failed:", error)
                self.showToast("Couldn't load this room")
            }
        }
    }

    private func setupOrbitCamera(bounds: BoundingBox) {
        let cam = PerspectiveCamera()
        cam.camera.fieldOfViewInDegrees = 65

        // The room was shifted so its center sits at the world origin
        let pivot = Entity()
        pivot.position = .zero

        let floorY = bounds.min.y
        let ceilingY = bounds.max.y
        let relativeY = (floorY + (ceilingY - floorY) * 0.5) - bounds.center.y
        let insideZ = bounds.extents.z * 0.3

        cam.position = [0, relativeY, insideZ]

        // Initialize radius from the actual starting camera position so pinch zoom works immediately
        let r = sqrt(cam.position.x * cam.position.x + cam.position.z * cam.position.z)
        cameraRadius = max(0.5, r)

        pivot.addChild(cam)
        let anchor = AnchorEntity(world: .zero)
        anchor.addChild(pivot)
        arView.scene.addAnchor(anchor)

        self.camera = cam
        self.cameraPivot = pivot
        self.roomBounds = bounds
        self.initialCamPosition = cam.position
        self.initialPivotPosition = pivot.position
    }

    // Furniture USDZs use PBR materials that render black without a light.
    // (Scan meshes have baked textures, so the room looks fine either way.)
    private func addLighting() {
        let key = DirectionalLight()
        key.light.intensity = 2500
        key.look(at: .zero, from: [1.5, 3, 2], relativeTo: nil)

        let fill = DirectionalLight()
        fill.light.intensity = 1000
        fill.look(at: .zero, from: [-2, 2.5, -1.5], relativeTo: nil)

        let anchor = AnchorEntity(world: .zero)
        anchor.addChild(key)
        anchor.addChild(fill)
        arView.scene.addAnchor(anchor)
    }

    // Where does a screen tap land on the floor?
    // Collision raycast first; if the scan mesh has no usable collision
    // geometry, fall back to intersecting the ray with the floor plane.
    private func floorHit(at location: CGPoint) -> SIMD3<Float>? {
        guard let ray = arView.ray(through: location) else { return nil }

        let results = arView.scene.raycast(
            from: ray.origin,
            to: ray.origin + ray.direction * 100,
            query: .nearest,
            mask: .all,
            relativeTo: nil
        )
        if let hit = results.first(where: { $0.normal.y > 0.7 }) {
            return hit.position
        }

        if let y = floorY, abs(ray.direction.y) > 0.0001 {
            let t = (y - ray.origin.y) / ray.direction.y
            if t > 0 {
                var p = ray.origin + ray.direction * t
                // The room is centered at the origin — keep the point inside it
                if let b = roomBounds {
                    p.x = max(-b.extents.x / 2, min(b.extents.x / 2, p.x))
                    p.z = max(-b.extents.z / 2, min(b.extents.z / 2, p.z))
                }
                return p
            }
        }
        return nil
    }

    // How far above the floor to lift a piece so its bottom doesn't sit
    // exactly coplanar with the floor mesh (which z-fights and can render
    // as invisible/buried). Flat pieces — rugs, mats — need a deliberately
    // bigger lift than everything else: their thickness relative to their
    // own footprint is tiny, so a fixed millimeter-scale epsilon that's
    // plenty for a chair or table's floor contact isn't reliably enough
    // for something that's essentially a decal lying on the ground.
    private func floorLift(for worldBounds: BoundingBox) -> Float {
        let footprint = max(worldBounds.extents.x, worldBounds.extents.z)
        let isFlat = footprint > 0 && worldBounds.extents.y < footprint * 0.03
        // 3cm for flat pieces — 1cm proved not enough in practice: scan meshes
        // have uneven floors, so a rug still dipped below the surface across
        // most of its area and was barely visible until enlarged.
        return isFlat ? 0.03 : 0.001
    }

    // Which placed furniture piece (if any) is under this screen point?
    // Uses .all (not .nearest) — the room mesh is often the closest hit
    // along the ray at a piece's edges, which would otherwise mask the
    // furniture entirely. Hits come back nearest-first, so the first one
    // that resolves to a placed piece is the one actually under the tap.
    private func furnitureHit(at location: CGPoint) -> Entity? {
        guard let ray = arView.ray(through: location) else { return nil }
        let hits = arView.scene.raycast(
            from: ray.origin,
            to: ray.origin + ray.direction * 100,
            query: .all,
            mask: .all,
            relativeTo: nil
        )
        for hit in hits {
            for furniture in placedFurniture {
                if isDescendant(hit.entity, of: furniture) { return furniture }
            }
        }
        return nil
    }

    // MARK: - Furniture Selection

    // All selection changes go through here so React Native can mirror the
    // state (e.g. show a delete button while something is selected).
    private func setSelectedFurniture(_ entity: Entity?) {
        let changed = selectedFurniture !== entity
        selectedFurniture = entity
        if changed {
            onFurnitureSelectionChanged?(["selected": entity != nil])
        }
    }

    func removeSelectedFurniture() {
        guard let selected = selectedFurniture else { return }
        if let anchor = selected.parent as? AnchorEntity {
            arView.scene.removeAnchor(anchor)
        } else {
            selected.removeFromParent()
        }
        placedFurniture.removeAll { $0 === selected }
        furnitureURLs.removeValue(forKey: ObjectIdentifier(selected))
        setSelectedFurniture(nil)
        showToast("Removed")
        print("🗑️ Furniture removed — remaining:", placedFurniture.count)
    }

    // MARK: - Snapshot

    // Captures the current scene to a PNG in the temp dir and reports the
    // file path back to React Native via onSnapshotReady.
    func captureSnapshot() {
        arView.snapshot(saveToHDR: false) { [weak self] image in
            guard let self = self else { return }
            guard let image = image, let data = image.pngData() else {
                self.onSnapshotReady?(["error": "Snapshot capture failed"])
                return
            }
            let filename = "design_snapshot_\(Int(Date().timeIntervalSince1970 * 1000)).png"
            let fileURL = URL(fileURLWithPath: NSTemporaryDirectory())
                .appendingPathComponent(filename)
            do {
                try data.write(to: fileURL)
                self.onSnapshotReady?(["path": fileURL.path])
            } catch {
                self.onSnapshotReady?(["error": error.localizedDescription])
            }
        }
    }

    // MARK: - PDF Export

    // Captures the design as a one-page PDF: room view on top, top-down view
    // below, PlaDomus logo bottom-left. Moves the camera programmatically for
    // each shot and restores the exact prior state afterwards, so the user's
    // viewpoint is untouched. Result path arrives via onDesignPdfExported.
    func exportDesignPdf(name: String) {
        guard let cam = camera, let pivot = cameraPivot else {
            onDesignPdfExported?(["error": "Scene not ready"])
            return
        }

        // Snapshot the full camera state so it can be restored exactly
        let savedCam = cam.transform
        let savedPivotOrientation = pivot.orientation
        let savedPivotPosition = pivot.position
        let restore = {
            cam.transform = savedCam
            pivot.orientation = savedPivotOrientation
            pivot.position = savedPivotPosition
        }

        // Shot 1 — room view. If the user is currently in top view, temporarily
        // recreate the room-view camera they'd get from toggling back.
        if isTopView, let saved = savedCamTransform {
            cam.transform = saved
            pivot.orientation =
                simd_quatf(angle: yaw, axis: [0, 1, 0]) *
                simd_quatf(angle: pitch, axis: [1, 0, 0])
        }

        // Camera moves need a beat before snapshotting — RealityKit renders
        // continuously, but grabbing the very next frame can race the move.
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) { [weak self] in
            guard let self = self else { return }
            self.arView.snapshot(saveToHDR: false) { roomImage in
                // Shot 2 — top-down view (same camera math as toggleTopView)
                pivot.orientation = simd_quatf(angle: 0, axis: [0, 1, 0])
                let extent = self.roomBounds.map { max($0.extents.x, $0.extents.z) } ?? 5.0
                let height = (self.roomBounds?.extents.y ?? 2.0) * 0.5 + extent * 1.1
                cam.position = [0, height, 0]
                cam.look(at: .zero, from: cam.position, upVector: [0, 0, -1], relativeTo: pivot)

                DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) {
                    self.arView.snapshot(saveToHDR: false) { topImage in
                        restore()

                        guard let roomImage = roomImage, let topImage = topImage else {
                            self.onDesignPdfExported?(["error": "Could not capture the scene"])
                            return
                        }
                        self.composeDesignPdf(name: name, roomView: roomImage, topView: topImage)
                    }
                }
            }
        }
    }

    private func composeDesignPdf(name: String, roomView: UIImage, topView: UIImage) {
        let pageRect = CGRect(x: 0, y: 0, width: 595.2, height: 841.8) // A4 portrait
        let margin: CGFloat = 40
        let contentWidth = pageRect.width - margin * 2

        let renderer = UIGraphicsPDFRenderer(bounds: pageRect)
        let data = renderer.pdfData { ctx in
            ctx.beginPage()

            let titleAttrs: [NSAttributedString.Key: Any] = [
                .font: UIFont.systemFont(ofSize: 24, weight: .semibold),
                .foregroundColor: UIColor.black,
            ]
            let labelAttrs: [NSAttributedString.Key: Any] = [
                .font: UIFont.systemFont(ofSize: 13, weight: .medium),
                .foregroundColor: UIColor.darkGray,
            ]

            (name as NSString).draw(at: CGPoint(x: margin, y: margin), withAttributes: titleAttrs)

            var y: CGFloat = margin + 44

            func drawSection(_ image: UIImage, label: String) {
                (label as NSString).draw(at: CGPoint(x: margin, y: y), withAttributes: labelAttrs)
                y += 20
                let maxHeight: CGFloat = 280
                let scale = min(contentWidth / image.size.width, maxHeight / image.size.height)
                let w = image.size.width * scale
                let h = image.size.height * scale
                // Center horizontally — device snapshots are tall portrait shots
                image.draw(in: CGRect(x: margin + (contentWidth - w) / 2, y: y, width: w, height: h))
                y += h + 24
            }

            drawSection(roomView, label: "Room view")
            drawSection(topView, label: "Top view")

            // Brand mark, bottom-left. The image lives in the app's asset
            // catalog (PladomusLogo.imageset); fall back to a wordmark so a
            // missing asset can never silently drop the branding.
            let logoHeight: CGFloat = 36
            if let logo = UIImage(named: "PladomusLogo") {
                let logoWidth = logo.size.width * (logoHeight / logo.size.height)
                logo.draw(in: CGRect(
                    x: margin,
                    y: pageRect.height - margin - logoHeight,
                    width: logoWidth,
                    height: logoHeight
                ))
            } else {
                let fallbackAttrs: [NSAttributedString.Key: Any] = [
                    .font: UIFont.systemFont(ofSize: 16, weight: .semibold),
                    .foregroundColor: UIColor(red: 0.77, green: 0.65, blue: 0.39, alpha: 1),
                ]
                ("PlaDomus" as NSString).draw(
                    at: CGPoint(x: margin, y: pageRect.height - margin - 20),
                    withAttributes: fallbackAttrs
                )
            }
        }

        let filename = "design_export_\(Int(Date().timeIntervalSince1970 * 1000)).pdf"
        let fileURL = URL(fileURLWithPath: NSTemporaryDirectory()).appendingPathComponent(filename)
        do {
            try data.write(to: fileURL)
            onDesignPdfExported?(["path": fileURL.path])
        } catch {
            onDesignPdfExported?(["error": error.localizedDescription])
        }
    }

    // MARK: - Camera Commands

    func toggleTopView() {
        guard let cam = camera, let pivot = cameraPivot else { return }

        if isTopView {
            // Restore the view we had before entering top view
            if let saved = savedCamTransform {
                cam.transform = saved
            }
            pivot.orientation =
                simd_quatf(angle: yaw, axis: [0, 1, 0]) *
                simd_quatf(angle: pitch, axis: [1, 0, 0])
            isTopView = false
            showToast("Room view")
        } else {
            savedCamTransform = cam.transform
            pivot.orientation = simd_quatf(angle: 0, axis: [0, 1, 0])

            // High enough to fit the whole room in a 65° FOV, with margin
            let extent = roomBounds.map { max($0.extents.x, $0.extents.z) } ?? 5.0
            let height = (roomBounds?.extents.y ?? 2.0) * 0.5 + extent * 1.1
            cam.position = [0, height, 0]
            cam.look(at: .zero, from: cam.position, upVector: [0, 0, -1], relativeTo: pivot)
            isTopView = true
            showToast("Top view")
        }
    }

    func resetCamera() {
        guard let cam = camera, let pivot = cameraPivot else { return }
        isTopView = false
        savedCamTransform = nil
        yaw = 0
        pitch = 0
        let r = sqrt(initialCamPosition.x * initialCamPosition.x +
                     initialCamPosition.z * initialCamPosition.z)
        cameraRadius = max(0.5, r)
        cam.transform = Transform(
            scale: .one,
            rotation: simd_quatf(angle: 0, axis: [0, 1, 0]),
            translation: initialCamPosition
        )
        pivot.orientation = simd_quatf(angle: 0, axis: [0, 1, 0])
        pivot.position = initialPivotPosition
        setSelectedFurniture(nil)
    }

    // MARK: - Furniture

    func loadFurniture(urlString: String) {
        guard let resolvedURL = resolveURL(urlString) else {
            print("❌ Could not resolve furniture URL:", urlString)
            DispatchQueue.main.async { self.showToast("Model not available yet") }
            return
        }

        Task { @MainActor in
            do {
                let localURL = try await self.localFileURL(for: resolvedURL)
                let item = try await Entity.load(contentsOf: localURL)
                self.pendingFurniture = item
                self.pendingFurnitureURL = urlString
                self.showToast("Tap the floor to place", position: .top, duration: 3.5)
                print("✅ Furniture ready:", resolvedURL.lastPathComponent)
            } catch {
                print("❌ loadFurniture failed:", error)
                self.showToast("Couldn't load this model")
            }
        }
    }

    // MARK: - Furniture Layout Persistence
    //
    // A placed piece only exists as a live RealityKit entity in this view —
    // nothing about it is saved anywhere by default. These two functions are
    // the save/restore pair that let React Native persist "what's placed,
    // where" as plain JSON and hand it back later to reconstruct the scene.

    // Encodes every placed piece as {modelUrl, position, rotation, scale} and
    // reports the JSON-encoded array back via onFurnitureLayoutExported.
    func exportFurnitureLayout() {
        let items: [[String: Any]] = placedFurniture.compactMap { entity -> [String: Any]? in
            guard let url = furnitureURLs[ObjectIdentifier(entity)] else { return nil }
            let pos = entity.position(relativeTo: nil)
            let rot = entity.transform.rotation.vector
            let scale = entity.scale
            return [
                "modelUrl": url,
                "position": [pos.x, pos.y, pos.z],
                "rotation": [rot.x, rot.y, rot.z, rot.w],
                "scale": [scale.x, scale.y, scale.z],
            ]
        }

        guard let data = try? JSONSerialization.data(withJSONObject: items),
              let json = String(data: data, encoding: .utf8) else {
            onFurnitureLayoutExported?(["error": "Could not encode furniture layout"])
            return
        }
        onFurnitureLayoutExported?(["layout": json])
    }

    // Re-places one piece from a layout item previously produced by
    // exportFurnitureLayout — called once per item by React Native. Skips
    // the tap-to-place flow entirely: the exact saved position/rotation/scale
    // are applied directly, and the piece is anchored to that world position
    // outright rather than a floor raycast, since it's already known-correct.
    func placeFurnitureFromLayout(_ itemJson: String) {
        guard
            let data = itemJson.data(using: .utf8),
            let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
            let urlString = obj["modelUrl"] as? String,
            let posArr = obj["position"] as? [Double], posArr.count == 3,
            let rotArr = obj["rotation"] as? [Double], rotArr.count == 4,
            let scaleArr = obj["scale"] as? [Double], scaleArr.count == 3,
            let resolvedURL = resolveURL(urlString)
        else {
            print("❌ Could not parse furniture layout item:", itemJson)
            return
        }

        Task { @MainActor in
            do {
                let localURL = try await self.localFileURL(for: resolvedURL)
                let item = try await Entity.load(contentsOf: localURL)
                let placed = item.clone(recursive: true)

                placed.transform.rotation = simd_quatf(
                    vector: SIMD4<Float>(Float(rotArr[0]), Float(rotArr[1]), Float(rotArr[2]), Float(rotArr[3]))
                )
                placed.scale = SIMD3<Float>(Float(scaleArr[0]), Float(scaleArr[1]), Float(scaleArr[2]))

                let worldPosition = SIMD3<Float>(Float(posArr[0]), Float(posArr[1]), Float(posArr[2]))
                let anchor = AnchorEntity(world: worldPosition)
                anchor.addChild(placed)
                self.arView.scene.addAnchor(anchor)

                placed.generateCollisionShapes(recursive: true)
                self.placedFurniture.append(placed)
                self.furnitureURLs[ObjectIdentifier(placed)] = urlString
                print("✅ Restored furniture:", resolvedURL.lastPathComponent)
            } catch {
                print("❌ placeFurnitureFromLayout failed:", error)
            }
        }
    }

    // MARK: - Gestures

    private func setupGestures() {
        // One finger: drag furniture (when starting on it) or orbit the camera
        let pan = SingleTouchPanGestureRecognizer(target: self, action: #selector(handlePan(_:)))
        pan.maximumNumberOfTouches = 1
        pan.delegate = self
        arView.addGestureRecognizer(pan)

        // Two fingers: move the camera through the room (room-to-room)
        let move = UIPanGestureRecognizer(target: self, action: #selector(handleTwoFingerPan(_:)))
        move.minimumNumberOfTouches = 2
        move.maximumNumberOfTouches = 2
        move.delegate = self
        arView.addGestureRecognizer(move)

        let pinch = UIPinchGestureRecognizer(target: self, action: #selector(handlePinch(_:)))
        pinch.delegate = self
        arView.addGestureRecognizer(pinch)

        let tap = UITapGestureRecognizer(target: self, action: #selector(handleTap(_:)))
        arView.addGestureRecognizer(tap)

        let rotation = UIRotationGestureRecognizer(target: self, action: #selector(handleRotation(_:)))
        rotation.delegate = self
        arView.addGestureRecognizer(rotation)
    }

    // Let the two-finger gestures (pinch / rotate / move) work together
    func gestureRecognizer(_ g: UIGestureRecognizer,
                           shouldRecognizeSimultaneouslyWith other: UIGestureRecognizer) -> Bool {
        let twoFinger: (UIGestureRecognizer) -> Bool = {
            $0 is UIPinchGestureRecognizer ||
            $0 is UIRotationGestureRecognizer ||
            ($0 is UIPanGestureRecognizer && ($0 as! UIPanGestureRecognizer).minimumNumberOfTouches == 2)
        }
        return twoFinger(g) && twoFinger(other)
    }

    @objc private func handleTap(_ gesture: UITapGestureRecognizer) {
        let location = gesture.location(in: arView)

        guard let pending = pendingFurniture else {
            // Nothing pending — try to select a placed piece
            if let furniture = furnitureHit(at: location) {
                setSelectedFurniture(furniture)
                showToast("Drag to move · Pinch · Rotate · Tap 🗑 to remove", duration: 3.5)
            } else if selectedFurniture != nil {
                setSelectedFurniture(nil)
                showToast("Deselected — tap a piece to select it")
            }
            return
        }

        // Top view is a straight-down look — there's no way to judge floor
        // contact from it (that's the whole reason floating pieces went
        // unnoticed there before). Keep the pending piece selected so
        // switching back to room view and tapping still places it.
        if isTopView {
            showToast("Switch to room view to place furniture")
            return
        }

        guard let hitPosition = floorHit(at: location) else {
            print("👆 No floor hit — try tapping the floor")
            showToast("Couldn't find the floor — try again")
            return
        }

        let placed = pending.clone(recursive: true)

        // Default size relative to the room (~15% of its larger side), so it
        // looks right no matter what units the scan or the model use.
        // User can pinch to fine-tune afterwards.
        let localBounds = placed.visualBounds(relativeTo: placed)
        let currentWidth = localBounds.extents.x
        if currentWidth > 0.001 {
            let roomSide = roomBounds.map { max($0.extents.x, $0.extents.z) } ?? 4.0
            let targetWidth = roomSide * 0.15
            let s = targetWidth / currentWidth
            placed.scale = SIMD3<Float>(repeating: s)
        }

        // Add to scene at the floor hit point first (no y offset yet).
        let anchor = AnchorEntity(world: hitPosition)
        anchor.addChild(placed)
        arView.scene.addAnchor(anchor)

        // Now compute world-space bounds to snap the bottom flush with the floor.
        // Adjust relative to the current position (not an absolute assignment) —
        // models can carry a nonzero baked-in local Y from their own USDZ root
        // transform, and overwriting it here would discard that offset instead
        // of correcting for it, leaving the piece floating or sunken.
        // Checking min.y (not extents.y) for finiteness — a flat piece (rug,
        // mat) has near-zero extents.y but is not degenerate, and skipping
        // the snap for it leaves it buried in the floor mesh, invisible.
        let worldBounds = placed.visualBounds(relativeTo: nil)
        if worldBounds.min.y.isFinite {
            placed.position.y += hitPosition.y - worldBounds.min.y + floorLift(for: worldBounds)
        }

        placed.generateCollisionShapes(recursive: true)
        placedFurniture.append(placed)
        if let url = pendingFurnitureURL {
            furnitureURLs[ObjectIdentifier(placed)] = url
        }
        setSelectedFurniture(placed)

        // Clear pending so next tap doesn't place again
        pendingFurniture = nil
        pendingFurnitureURL = nil

        showToast("Drag to move · Pinch · Rotate · Tap 🗑 to remove", duration: 3.5)
        print("🪑 Placed furniture — total:", placedFurniture.count)
    }

    @objc private func handleRotation(_ gesture: UIRotationGestureRecognizer) {
        guard let selected = selectedFurniture, gesture.state == .changed else { return }
        let delta = Float(gesture.rotation)
        selected.transform.rotation *= simd_quatf(angle: -delta, axis: [0, 1, 0])
        gesture.rotation = 0
    }

    private func isDescendant(_ entity: Entity, of ancestor: Entity) -> Bool {
        var current: Entity? = entity
        while let e = current {
            if e === ancestor { return true }
            current = e.parent
        }
        return false
    }

    @objc private func handlePan(_ gesture: UIPanGestureRecognizer) {
        let location = gesture.location(in: arView)

        switch gesture.state {
        case .began:
            // Drag only when the finger goes down ON a furniture piece,
            // so panning elsewhere never flings furniture around.
            draggingFurniture = furnitureHit(at: location)
            if let dragging = draggingFurniture {
                setSelectedFurniture(dragging)
            }
        case .changed:
            if let dragging = draggingFurniture {
                if let hit = floorHit(at: location), let anchor = dragging.parent {
                    // Move anchor on the floor plane; preserve the y offset for floor-snap.
                    let anchorWorldY = anchor.position(relativeTo: nil).y
                    anchor.setPosition(
                        SIMD3<Float>(hit.x, anchorWorldY, hit.z),
                        relativeTo: nil
                    )
                }
                return
            }

            // Not dragging furniture — orbit the camera (disabled in top view).
            guard !isTopView, camera != nil, cameraPivot != nil else { return }
            let t = gesture.translation(in: arView)
            let s: Float = 0.005
            yaw -= Float(t.x) * s
            pitch = max(-.pi / 2.5, min(.pi / 2.5, pitch - Float(t.y) * s))
            applyOrbit()
        default:
            draggingFurniture = nil
        }
        gesture.setTranslation(.zero, in: arView)
    }

    // Two-finger pan: translate the camera rig across the floor so you can
    // move from room to room. Directions follow where the camera is facing.
    @objc private func handleTwoFingerPan(_ gesture: UIPanGestureRecognizer) {
        guard gesture.state == .changed, let cam = camera, let pivot = cameraPivot else { return }
        let t = gesture.translation(in: arView)

        let m = cam.transformMatrix(relativeTo: nil)
        var right = SIMD3<Float>(m.columns.0.x, 0, m.columns.0.z)
        var forward = SIMD3<Float>(-m.columns.2.x, 0, -m.columns.2.z)
        // Looking straight down (top view): camera "up" is the on-screen forward
        if simd_length(forward) < 0.001 {
            forward = SIMD3<Float>(m.columns.1.x, 0, m.columns.1.z)
        }
        if simd_length(right) > 0.001 { right = simd_normalize(right) }
        if simd_length(forward) > 0.001 { forward = simd_normalize(forward) }

        let speed = max(cameraRadius, 1.0) * 0.002
        pivot.position += right * Float(-t.x) * speed + forward * Float(t.y) * speed
        gesture.setTranslation(.zero, in: arView)
    }

    @objc private func handlePinch(_ gesture: UIPinchGestureRecognizer) {
        guard gesture.state == .changed else { return }
        defer { gesture.scale = 1.0 }

        // Furniture selected → pinch resizes it (tap empty space to deselect
        // and get camera zoom back).
        if let selected = selectedFurniture {
            selected.scale *= Float(gesture.scale)
            // Keep the bottom on the floor while resizing.
            // See the matching note in handleTap: check min.y for finiteness,
            // not extents.y — a flat piece has near-zero thickness but valid
            // bounds, and skipping it here undoes the same fix on every pinch.
            if let anchor = selected.parent {
                let floorWorldY = anchor.position(relativeTo: nil).y
                let worldBounds = selected.visualBounds(relativeTo: nil)
                if worldBounds.min.y.isFinite {
                    selected.position.y += floorWorldY - worldBounds.min.y + floorLift(for: worldBounds)
                }
            }
            return
        }

        if isTopView, let cam = camera {
            // In top view, pinch moves the camera up/down instead of orbit zoom
            cam.position.y = max(1.0, min(30.0, cam.position.y / Float(gesture.scale)))
            return
        }

        cameraRadius = max(0.1, min(20.0, cameraRadius / Float(gesture.scale)))
        applyOrbit()
    }

    private func applyOrbit() {
        guard let cam = camera, let pivot = cameraPivot else { return }
        // cam is a child of pivot, so its position here is local, not world.
        // Keep that local offset fixed (only its distance from the pivot —
        // cameraRadius — changes, e.g. from pinch-zoom) and let the pivot's
        // rotation do the actual orbiting. Rotating yaw/pitch here AND
        // baking them into this offset would apply both angles twice.
        cam.position = SIMD3<Float>(0, initialCamPosition.y, cameraRadius)
        pivot.orientation =
            simd_quatf(angle: yaw, axis: [0, 1, 0]) *
            simd_quatf(angle: pitch, axis: [1, 0, 0])
    }

    // MARK: - Toast

    private enum ToastPosition {
        case top
        case bottom
    }

    private func showToast(_ message: String, position: ToastPosition = .bottom, duration: TimeInterval = 2.0) {
        let label = UILabel()
        label.text = message
        label.textColor = .white
        label.backgroundColor = UIColor.black.withAlphaComponent(0.7)
        label.textAlignment = .center
        label.layer.cornerRadius = 10
        label.clipsToBounds = true
        label.font = .systemFont(ofSize: 14, weight: .medium)
        label.translatesAutoresizingMaskIntoConstraints = false
        addSubview(label)

        var constraints = [
            label.centerXAnchor.constraint(equalTo: centerXAnchor),
            label.heightAnchor.constraint(equalToConstant: 40),
            label.widthAnchor.constraint(lessThanOrEqualTo: widthAnchor, constant: -40),
        ]
        switch position {
        case .bottom:
            constraints.append(label.bottomAnchor.constraint(equalTo: safeAreaLayoutGuide.bottomAnchor, constant: -80))
        case .top:
            constraints.append(label.topAnchor.constraint(equalTo: safeAreaLayoutGuide.topAnchor, constant: 16))
        }
        NSLayoutConstraint.activate(constraints)

        UIView.animate(withDuration: 0.3, delay: duration, options: []) {
            label.alpha = 0
        } completion: { _ in
            label.removeFromSuperview()
        }
    }
}
