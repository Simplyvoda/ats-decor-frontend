//
//  RealityKitModule.swift
//
//  A plain NativeModule — NOT a view. Unlike RealityKitView (which JS mounts
//  as a component), JS reaches this directly as
//  NativeModules.RealityKitModule.someMethod(...).
//
//  Registration follows the same runtime string-matching as the view
//  managers: RealityKitModule.m declares RCT_EXTERN_MODULE(RealityKitModule,
//  NSObject), and the @objc(RealityKitModule) attribute below publishes this
//  class under that exact name. No compile-time link exists between the two.
//

import UIKit
import React

@objc(RealityKitModule)
class RealityKitModule: NSObject {

    // Returns the file:// URL of the last saved room scan (Documents/savedRoom.usdz).
    // Used by the dev button in ScanScreen to jump straight to ARViewerScreen.
    //
    // The promise pattern: the .m file declares the last two arguments as
    // RCTPromiseResolveBlock/RCTPromiseRejectBlock, so JS receives a Promise
    // that settles with whichever block this method calls.
    @objc func getSavedRoomUrl(
        _ resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        let documents = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let url = documents.appendingPathComponent("savedRoom.usdz")
        if FileManager.default.fileExists(atPath: url.path) {
            resolve(url.absoluteString)
        } else {
            reject("NO_SAVED_ROOM", "savedRoom.usdz not found — scan a room first", nil)
        }
    }
}
