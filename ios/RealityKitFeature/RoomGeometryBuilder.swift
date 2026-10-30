//
//  RoomGeometryBuilder.swift
//
//  Turns typed-in room measurements (the guided room builder in
//  RoomBuilderScreen) into a .usdz room the AR viewer can load, the same
//  way it loads a RoomPlan scan.
//
//  What gets built:
//    - a floor slab in the room's outline, its top surface at y = 0
//    - walls standing on the OUTSIDE of the outline, so the room's inside
//      measurements are exactly what the person entered
//    - real gaps in the walls for doors and windows (windows get a pane of
//      glass)
//    - no ceiling, like a scan, so the camera can look in from above
//
//  Units are metres. The plan (what JS sends) uses x to the right and y
//  DOWN the screen; that maps to 3D as x → x and y → z, with 3D y as up.
//
//  This file imports only SceneKit/Foundation (no React), so it also
//  compiles on macOS for testing outside the app.
//

import Foundation
import SceneKit
#if canImport(UIKit)
import UIKit
typealias RoomBuilderColor = UIColor
#else
import AppKit
typealias RoomBuilderColor = NSColor
#endif

// The JSON JS sends (see buildRoomModel in src/screens/room_builder/roomGeometry.ts)
struct RoomSpec: Decodable {
    struct Point: Decodable {
        let x: Double
        let y: Double
    }

    struct Opening: Decodable {
        // "door" or "window"
        let type: String
        // Index into the walls; wall i runs from points[i] to points[i + 1]
        let wall: Int
        // Distance from the wall's start corner to the opening's near edge
        let offset: Double
        let width: Double
        // Height of the bottom of the opening above the floor (0 for doors)
        let sill: Double
        let height: Double
    }

    // The room's inside outline, corner by corner, in wall order
    let points: [Point]
    let ceilingHeight: Double
    let openings: [Opening]
}

enum RoomBuilderError: LocalizedError {
    case invalid(String)
    case exportFailed

    var errorDescription: String? {
        switch self {
        case .invalid(let reason): return "Invalid room: \(reason)"
        case .exportFailed: return "Couldn't save the room model"
        }
    }
}

enum RoomGeometryBuilder {
    static let wallThickness: Double = 0.12
    static let floorThickness: Double = 0.05

    static func writeUSDZ(_ spec: RoomSpec, to url: URL) throws {
        let scene = try buildScene(spec)
        try? FileManager.default.removeItem(at: url)
        guard scene.write(to: url, options: nil, delegate: nil, progressHandler: nil),
              FileManager.default.fileExists(atPath: url.path) else {
            throw RoomBuilderError.exportFailed
        }
    }

    static func buildScene(_ spec: RoomSpec) throws -> SCNScene {
        try validate(spec)

        let points = spec.points.map { SIMD2<Double>($0.x, $0.y) }
        let height = spec.ceilingHeight
        let root = SCNNode()
        root.name = "BuiltRoom"

        root.addChildNode(floorNode(points))

        // Outline winding decides which side of each wall is "outside".
        // Positive shoelace area here = clockwise on screen (y down).
        let clockwise = signedArea(points) > 0
        let count = points.count

        for i in 0..<count {
            let prev = points[(i - 1 + count) % count]
            let start = points[i]
            let end = points[(i + 1) % count]
            let next = points[(i + 2) % count]

            // At an outward-pointing corner the two walls leave a square gap
            // at the outside corner, so each wall reaches one thickness past
            // it. At an inward corner (the inside bend of an L) they already
            // overlap, and reaching further would poke into the room.
            let startConvex = isConvexCorner(prev, start, end, clockwise: clockwise)
            let endConvex = isConvexCorner(start, end, next, clockwise: clockwise)

            let wallOpenings = spec.openings
                .filter { $0.wall == i }
                .sorted { $0.offset < $1.offset }

            root.addChildNode(wallNode(
                index: i,
                from: start,
                to: end,
                clockwise: clockwise,
                height: height,
                extendStart: startConvex ? wallThickness : 0,
                extendEnd: endConvex ? wallThickness : 0,
                openings: wallOpenings
            ))
        }

        let scene = SCNScene()
        scene.rootNode.addChildNode(root)
        return scene
    }

    // MARK: - Validation

    private static func validate(_ spec: RoomSpec) throws {
        guard spec.points.count >= 3 else {
            throw RoomBuilderError.invalid("needs at least 3 corners")
        }
        guard spec.ceilingHeight >= 1.5, spec.ceilingHeight <= 10 else {
            throw RoomBuilderError.invalid("ceiling height out of range")
        }
        let points = spec.points.map { SIMD2<Double>($0.x, $0.y) }
        for i in 0..<points.count {
            let length = simd_length(points[(i + 1) % points.count] - points[i])
            guard length >= 0.3 else {
                throw RoomBuilderError.invalid("wall \(i + 1) is too short")
            }
        }
        for opening in spec.openings {
            guard opening.wall >= 0, opening.wall < points.count else {
                throw RoomBuilderError.invalid("opening on a missing wall")
            }
            let length = simd_length(points[(opening.wall + 1) % points.count] - points[opening.wall])
            guard opening.width > 0, opening.offset >= 0,
                  opening.offset + opening.width <= length + 0.001,
                  opening.sill >= 0, opening.height > 0 else {
                throw RoomBuilderError.invalid("an opening doesn't fit its wall")
            }
        }
    }

    // MARK: - Floor

    private static func floorNode(_ points: [SIMD2<Double>]) -> SCNNode {
        var mesh = MeshBuilder()
        let top = 0.0
        let bottom = -floorThickness
        let corner = { (p: SIMD2<Double>, y: Double) in SCNVector3(p.x, y, p.y) }

        // Top and bottom faces from the triangulated outline. Each triangle
        // is added with an up/down normal; addTriangle flips the winding if
        // needed so the face points the way the normal says.
        for (a, b, c) in triangulate(points) {
            mesh.addTriangle(corner(points[a], top), corner(points[b], top), corner(points[c], top),
                             normal: SCNVector3(0, 1, 0))
            mesh.addTriangle(corner(points[a], bottom), corner(points[b], bottom), corner(points[c], bottom),
                             normal: SCNVector3(0, -1, 0))
        }

        let node = SCNNode(geometry: mesh.geometry(material: material(
            color: RoomBuilderColor(red: 0.72, green: 0.55, blue: 0.38, alpha: 1),
            roughness: 0.75
        )))
        node.name = "Floor"
        return node
    }

    // MARK: - Walls

    private static func wallNode(
        index: Int,
        from start: SIMD2<Double>,
        to end: SIMD2<Double>,
        clockwise: Bool,
        height: Double,
        extendStart: Double,
        extendEnd: Double,
        openings: [RoomSpec.Opening]
    ) -> SCNNode {
        let length = simd_length(end - start)
        let dir = (end - start) / length
        let outward = clockwise ? SIMD2(dir.y, -dir.x) : SIMD2(-dir.y, dir.x)

        let wall = SCNNode()
        wall.name = "Wall_\(index + 1)"

        let wallMaterial = material(
            color: RoomBuilderColor(red: 0.94, green: 0.92, blue: 0.89, alpha: 1),
            roughness: 0.9
        )
        let glassMaterial = material(
            color: RoomBuilderColor(red: 0.75, green: 0.86, blue: 0.93, alpha: 1),
            roughness: 0.1,
            transparency: 0.35
        )
        let bottom = -floorThickness

        // One box covering [u0, u1] along the wall and [y0, y1] in height.
        // u is measured from the wall's start corner along its length.
        func addPiece(_ u0: Double, _ u1: Double, _ y0: Double, _ y1: Double,
                      depth: Double = wallThickness, mat: SCNMaterial) {
            guard u1 - u0 > 0.001, y1 - y0 > 0.001 else { return }
            let box = SCNBox(width: CGFloat(u1 - u0), height: CGFloat(y1 - y0),
                             length: CGFloat(depth), chamferRadius: 0)
            box.materials = [mat]
            let node = SCNNode(geometry: box)
            let center = start + dir * ((u0 + u1) / 2) + outward * (wallThickness / 2)
            node.position = SCNVector3(center.x, (y0 + y1) / 2, center.y)
            // Turn the box's length (its local x) to run along the wall
            node.eulerAngles.y = .init(atan2(-dir.y, dir.x))
            wall.addChildNode(node)
        }

        // Solid wall up to each opening, then the pieces below and above it
        var cursor = -extendStart
        for opening in openings {
            let o0 = opening.offset
            let o1 = opening.offset + opening.width
            let top = min(opening.sill + opening.height, height)
            addPiece(cursor, o0, bottom, height, mat: wallMaterial)
            addPiece(o0, o1, bottom, opening.sill, mat: wallMaterial)
            addPiece(o0, o1, top, height, mat: wallMaterial)
            if opening.type == "window" {
                addPiece(o0, o1, opening.sill, top, depth: 0.02, mat: glassMaterial)
            }
            cursor = max(cursor, o1)
        }
        addPiece(cursor, length + extendEnd, bottom, height, mat: wallMaterial)

        return wall
    }

    // MARK: - Helpers

    private static func material(color: RoomBuilderColor, roughness: CGFloat,
                                 transparency: CGFloat = 1) -> SCNMaterial {
        let m = SCNMaterial()
        m.lightingModel = .physicallyBased
        m.diffuse.contents = color
        m.roughness.contents = roughness
        m.metalness.contents = 0.0
        m.isDoubleSided = true
        if transparency < 1 {
            m.transparency = transparency
            m.blendMode = .alpha
        }
        return m
    }

    // Shoelace formula: twice the outline's area, signed by winding
    static func signedArea(_ p: [SIMD2<Double>]) -> Double {
        var sum = 0.0
        for i in 0..<p.count {
            let a = p[i], b = p[(i + 1) % p.count]
            sum += a.x * b.y - b.x * a.y
        }
        return sum / 2
    }

    private static func cross(_ a: SIMD2<Double>, _ b: SIMD2<Double>) -> Double {
        a.x * b.y - a.y * b.x
    }

    // Does the outline turn "outward" at corner b (a → b → c)?
    private static func isConvexCorner(_ a: SIMD2<Double>, _ b: SIMD2<Double>, _ c: SIMD2<Double>,
                                       clockwise: Bool) -> Bool {
        let turn = cross(b - a, c - b)
        return clockwise ? turn > 0 : turn < 0
    }

    // Ear clipping: splits a simple outline (convex or not, e.g. an L) into
    // triangles, returned as index triples into `points`.
    static func triangulate(_ points: [SIMD2<Double>]) -> [(Int, Int, Int)] {
        var remaining = Array(points.indices)
        var triangles: [(Int, Int, Int)] = []
        let clockwise = signedArea(points) > 0

        func isEar(_ i: Int) -> Bool {
            let n = remaining.count
            let ia = remaining[(i - 1 + n) % n], ib = remaining[i], ic = remaining[(i + 1) % n]
            let a = points[ia], b = points[ib], c = points[ic]
            guard isConvexCorner(a, b, c, clockwise: clockwise) else { return false }
            // No other corner may sit inside the candidate triangle
            for j in remaining where j != ia && j != ib && j != ic {
                let p = points[j]
                let d1 = cross(b - a, p - a), d2 = cross(c - b, p - b), d3 = cross(a - c, p - c)
                let hasNeg = d1 < 0 || d2 < 0 || d3 < 0
                let hasPos = d1 > 0 || d2 > 0 || d3 > 0
                if !(hasNeg && hasPos) { return false }
            }
            return true
        }

        var guardCount = 0
        while remaining.count > 3 && guardCount < 1000 {
            guardCount += 1
            guard let ear = remaining.indices.first(where: isEar) else { break }
            let n = remaining.count
            triangles.append((remaining[(ear - 1 + n) % n], remaining[ear], remaining[(ear + 1) % n]))
            remaining.remove(at: ear)
        }
        if remaining.count == 3 {
            triangles.append((remaining[0], remaining[1], remaining[2]))
        }
        return triangles
    }
}

// Collects flat-shaded triangles into one SceneKit geometry
private struct MeshBuilder {
    private var vertices: [SCNVector3] = []
    private var normals: [SCNVector3] = []
    private var indices: [Int32] = []

    mutating func addTriangle(_ a: SCNVector3, _ b: SCNVector3, _ c: SCNVector3, normal: SCNVector3) {
        // Counter-clockwise when seen from the side the normal points to
        let ab = SIMD3<Double>(Double(b.x - a.x), Double(b.y - a.y), Double(b.z - a.z))
        let ac = SIMD3<Double>(Double(c.x - a.x), Double(c.y - a.y), Double(c.z - a.z))
        let facing = simd_dot(simd_cross(ab, ac),
                              SIMD3<Double>(Double(normal.x), Double(normal.y), Double(normal.z)))
        let ordered = facing >= 0 ? [a, b, c] : [a, c, b]
        for v in ordered {
            indices.append(Int32(vertices.count))
            vertices.append(v)
            normals.append(normal)
        }
    }

    func geometry(material: SCNMaterial) -> SCNGeometry {
        let geometry = SCNGeometry(
            sources: [SCNGeometrySource(vertices: vertices), SCNGeometrySource(normals: normals)],
            elements: [SCNGeometryElement(indices: indices, primitiveType: .triangles)]
        )
        geometry.materials = [material]
        return geometry
    }
}
