import UIKit
import RealityKit

@objc(RealityKitView)
class RealityKitView: UIView {

    private var arView: ARView!

    private var yaw: Float = 0
    private var pitch: Float = 0
    private var cameraRadius: Float = 5.0
    private var cameraPivot: Entity?
    private var camera: PerspectiveCamera?

    private var pendingFurniture: Entity?
    private var placedFurniture: [Entity] = []

    // Prop set by React Native
    @objc var modelUrl: NSString? {
        didSet {
            guard let urlStr = modelUrl as String?, let url = URL(string: urlStr) else { return }
            loadRoom(from: url)
        }
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

                // Generate collision shapes so raycasting hits the floor
                entity.generateCollisionShapes(recursive: true)

                let anchor = AnchorEntity(world: .zero)
                anchor.addChild(entity)
                arView.scene.addAnchor(anchor)

                setupOrbitCamera(bounds: bounds)
                print("✅ Room loaded from:", url.lastPathComponent)
            } catch {
                print("❌ loadRoom failed:", error)
            }
        }
    }

    private func setupOrbitCamera(bounds: BoundingBox) {
        let cam = PerspectiveCamera()
        cam.camera.fieldOfViewInDegrees = 65

        let pivot = Entity()
        pivot.position = bounds.center

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
    }

    // MARK: - Furniture

    func loadFurniture(urlString: String) {
        let url: URL?

        if urlString.hasPrefix("bundle://") {
            // Resolve from app bundle: "bundle://chair.usdz" → Bundle.main/.../chair.usdz
            let filename = String(urlString.dropFirst("bundle://".count))
            let name = (filename as NSString).deletingPathExtension
            let ext = (filename as NSString).pathExtension
            url = Bundle.main.url(forResource: name, withExtension: ext.isEmpty ? nil : ext)
        } else {
            url = URL(string: urlString)
        }

        guard let resolvedURL = url else {
            print("❌ Could not resolve furniture URL:", urlString)
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
            }
        }
    }

    // MARK: - Gestures

    private func setupGestures() {
        let pan = UIPanGestureRecognizer(target: self, action: #selector(handlePan(_:)))
        arView.addGestureRecognizer(pan)

        let pinch = UIPinchGestureRecognizer(target: self, action: #selector(handlePinch(_:)))
        arView.addGestureRecognizer(pinch)

        // Tap to place furniture on the floor
        let tap = UITapGestureRecognizer(target: self, action: #selector(handleTap(_:)))
        arView.addGestureRecognizer(tap)
    }

    @objc private func handleTap(_ gesture: UITapGestureRecognizer) {
        guard let pending = pendingFurniture else { return }

        let location = gesture.location(in: arView)
        guard let ray = arView.ray(through: location) else { return }

        let results = arView.scene.raycast(
            from: ray.origin,
            to: ray.origin + ray.direction * 100,
            query: .nearest,
            mask: .all,
            relativeTo: nil
        )

        guard let hit = results.first(where: { $0.normal.y > 0.7 }) else {
            print("👆 No floor hit — try tapping the floor")
            return
        }

        let placed = pending.clone(recursive: true)
        placed.position = hit.position

        let anchor = AnchorEntity(world: hit.position)
        anchor.addChild(placed)
        arView.scene.addAnchor(anchor)
        placedFurniture.append(placed)

        print("🪑 Placed furniture — total:", placedFurniture.count)
    }

    @objc private func handlePan(_ gesture: UIPanGestureRecognizer) {
        guard camera != nil, cameraPivot != nil else { return }
        let t = gesture.translation(in: arView)
        let s: Float = 0.005
        yaw -= Float(t.x) * s
        pitch = max(-.pi / 2.5, min(.pi / 2.5, pitch - Float(t.y) * s))
        applyOrbit()
        gesture.setTranslation(.zero, in: arView)
    }

    @objc private func handlePinch(_ gesture: UIPinchGestureRecognizer) {
        guard gesture.state == .changed else { return }
        cameraRadius = max(0.1, min(20.0, cameraRadius / Float(gesture.scale)))
        applyOrbit()
        gesture.scale = 1.0
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
