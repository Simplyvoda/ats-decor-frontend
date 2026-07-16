import UIKit
import RealityKit

@objc(RealityKitView)
class RealityKitView: UIView, UIGestureRecognizerDelegate {

    private var arView: ARView!

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

    // MARK: - Room Loading

    func loadRoom(from url: URL) {
        Task { @MainActor in
            do {
                let entity = try await Entity.load(contentsOf: url)
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
    private func furnitureHit(at location: CGPoint) -> Entity? {
        guard let ray = arView.ray(through: location) else { return nil }
        let hits = arView.scene.raycast(
            from: ray.origin,
            to: ray.origin + ray.direction * 100,
            query: .nearest,
            mask: .all,
            relativeTo: nil
        )
        guard let hit = hits.first else { return nil }
        for furniture in placedFurniture {
            if isDescendant(hit.entity, of: furniture) { return furniture }
        }
        return nil
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
        selectedFurniture = nil
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
                let item = try await Entity.load(contentsOf: resolvedURL)
                self.pendingFurniture = item
                self.showToast("Tap the floor to place")
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
                selectedFurniture = furniture
                showToast("Drag to move · Pinch to resize · Twist to rotate")
            } else {
                selectedFurniture = nil
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
        let worldBounds = placed.visualBounds(relativeTo: nil)
        if worldBounds.extents.y > 0.001 {
            placed.position.y = hitPosition.y - worldBounds.min.y
        }

        placed.generateCollisionShapes(recursive: true)
        placedFurniture.append(placed)
        selectedFurniture = placed

        // Clear pending so next tap doesn't place again
        pendingFurniture = nil

        showToast("Drag to move · Pinch to resize · Twist to rotate")
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
                selectedFurniture = dragging
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
            // Keep the bottom on the floor while resizing
            if let anchor = selected.parent {
                let floorWorldY = anchor.position(relativeTo: nil).y
                let worldBounds = selected.visualBounds(relativeTo: nil)
                if worldBounds.extents.y > 0.001 {
                    selected.position.y += floorWorldY - worldBounds.min.y
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
        let x = cameraRadius * cos(pitch) * sin(yaw)
        let z = cameraRadius * cos(pitch) * cos(yaw)
        cam.position = [x, cam.position.y, z]
        pivot.orientation =
            simd_quatf(angle: yaw, axis: [0, 1, 0]) *
            simd_quatf(angle: pitch, axis: [1, 0, 0])
    }

    // MARK: - Toast

    private func showToast(_ message: String) {
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

        NSLayoutConstraint.activate([
            label.bottomAnchor.constraint(equalTo: safeAreaLayoutGuide.bottomAnchor, constant: -80),
            label.centerXAnchor.constraint(equalTo: centerXAnchor),
            label.heightAnchor.constraint(equalToConstant: 40),
            label.widthAnchor.constraint(lessThanOrEqualTo: widthAnchor, constant: -40),
        ])

        UIView.animate(withDuration: 0.3, delay: 2.0, options: []) {
            label.alpha = 0
        } completion: { _ in
            label.removeFromSuperview()
        }
    }
}
