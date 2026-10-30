//
//  RoomBuilderModule.swift
//
//  A plain NativeModule (not a view) for the guided room builder. JS calls
//  NativeModules.RoomBuilderModule.buildRoom(specJson) and gets back the
//  file:// URL of a freshly built .usdz room, which ARViewerScreen loads
//  exactly like a scan. The geometry itself lives in RoomGeometryBuilder.
//
//  Registered by RoomBuilderModule.m — keep the two signatures in sync.
//

import Foundation
import React

@objc(RoomBuilderModule)
class RoomBuilderModule: NSObject {

    // Built rooms kept on the phone. Each build gets a new file name (the
    // viewer may still have an older one open), and only the newest few
    // are kept. Saving a design uploads the file, so nothing here needs to
    // last long.
    private static let keepCount = 5

    @objc static func requiresMainQueueSetup() -> Bool { false }

    @objc func buildRoom(
        _ specJson: String,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        DispatchQueue.global(qos: .userInitiated).async {
            do {
                let spec = try JSONDecoder().decode(RoomSpec.self, from: Data(specJson.utf8))
                let folder = try Self.roomsFolder()
                let url = folder.appendingPathComponent("built-room-\(UUID().uuidString).usdz")
                try RoomGeometryBuilder.writeUSDZ(spec, to: url)
                Self.removeOldRooms(in: folder)
                resolve(url.absoluteString)
            } catch {
                NSLog("❌ buildRoom failed: \(error)")
                reject("BUILD_ROOM_FAILED", error.localizedDescription, error)
            }
        }
    }

    private static func roomsFolder() throws -> URL {
        let documents = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let folder = documents.appendingPathComponent("builtRooms", isDirectory: true)
        try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
        return folder
    }

    private static func removeOldRooms(in folder: URL) {
        let fm = FileManager.default
        guard let files = try? fm.contentsOfDirectory(
            at: folder, includingPropertiesForKeys: [.contentModificationDateKey]
        ) else { return }
        let newestFirst = files.sorted {
            let a = (try? $0.resourceValues(forKeys: [.contentModificationDateKey]).contentModificationDate) ?? .distantPast
            let b = (try? $1.resourceValues(forKeys: [.contentModificationDateKey]).contentModificationDate) ?? .distantPast
            return a > b
        }
        for old in newestFirst.dropFirst(keepCount) {
            try? fm.removeItem(at: old)
        }
    }
}
