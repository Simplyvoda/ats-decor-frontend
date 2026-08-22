import UIKit
import RealityKit
import CryptoKit
import React

@objc(RealityKitView)
class RealityKitView: UIView, UIGestureRecognizerDelegate {

    private var arView: ARView!

    // Fired with {path} after captureSnapshot(), or {error} on failure
    @objc var onSnapshotReady: RCTDirectEventBlock?

    // Fired with {selected: Bool} whenever furniture selection changes
    @objc var onFurnitureSelectionChanged: RCTDirectEventBlock?

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
    private var placedFurniture: [Entity] = []
    private var selectedFurniture: Entity?
    private var draggingFurniture: Entity?

    // Kept so the delegate can arbitrate between them (see shouldRequireFailureOf)
    private var panGesture: UIPanGestureRecognizer!
    private var twoFingerPanGesture: UIPanGestureRecognizer!
    private var pinchGesture: UIPinchGestureRecognizer!
    private var rotationGesture: UIRotationGestureRecognizer!

    // Prop set by React Native
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
                self.showToast("Tap the floor to place", position: .top, duration: 3.5)
                print("✅ Furniture ready:", resolvedURL.lastPathComponent)
            } catch {
                print("❌ loadFurniture failed:", error)
                self.showToast("Couldn't load this model")
            }
        }
    }

    // MARK: - Gestures

    private func setupGestures() {
        // One finger: drag furniture (when starting on it) or orbit the camera
        let pan = UIPanGestureRecognizer(target: self, action: #selector(handlePan(_:)))
        pan.maximumNumberOfTouches = 1
        pan.delegate = self
        arView.addGestureRecognizer(pan)
        panGesture = pan

        // Two fingers: move the camera through the room (room-to-room)
        let move = UIPanGestureRecognizer(target: self, action: #selector(handleTwoFingerPan(_:)))
        move.minimumNumberOfTouches = 2
        move.maximumNumberOfTouches = 2
        move.delegate = self
        arView.addGestureRecognizer(move)
        twoFingerPanGesture = move

        let pinch = UIPinchGestureRecognizer(target: self, action: #selector(handlePinch(_:)))
        pinch.delegate = self
        arView.addGestureRecognizer(pinch)
        pinchGesture = pinch

        let tap = UITapGestureRecognizer(target: self, action: #selector(handleTap(_:)))
        arView.addGestureRecognizer(tap)

        let rotation = UIRotationGestureRecognizer(target: self, action: #selector(handleRotation(_:)))
        rotation.delegate = self
        arView.addGestureRecognizer(rotation)
        rotationGesture = rotation
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

    // Two fingers never land in the exact same instant — the first one
    // touching down would otherwise let the 1-finger pan claim the whole
    // gesture before pinch/rotate/two-finger-pan get a chance to see the
    // second touch. Give those a beat to fail first before pan commits.
    func gestureRecognizer(_ gestureRecognizer: UIGestureRecognizer,
                           shouldRequireFailureOf otherGestureRecognizer: UIGestureRecognizer) -> Bool {
        guard gestureRecognizer === panGesture else { return false }
        return otherGestureRecognizer === pinchGesture ||
               otherGestureRecognizer === rotationGesture ||
               otherGestureRecognizer === twoFingerPanGesture
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
            // Tiny lift so a near-flat mesh doesn't sit exactly coplanar with
            // the floor, which z-fights and can render as invisible.
            placed.position.y += hitPosition.y - worldBounds.min.y + 0.001
        }

        placed.generateCollisionShapes(recursive: true)
        placedFurniture.append(placed)
        setSelectedFurniture(placed)

        // Clear pending so next tap doesn't place again
        pendingFurniture = nil

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
                    selected.position.y += floorWorldY - worldBounds.min.y + 0.001
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
