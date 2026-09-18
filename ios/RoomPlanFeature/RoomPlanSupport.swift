//
//  RoomPlanSupport.swift
//
//  A plain NativeModule — NOT a view. JS reaches this directly as
//  NativeModules.RoomPlanSupport.someProperty, same runtime string-matching
//  as the rest of the bridge: RoomPlanSupport.m declares
//  RCT_EXTERN_MODULE(RoomPlanSupport, NSObject), and the @objc(RoomPlanSupport)
//  attribute below publishes this class under that exact name.
//
//  Exposes RoomPlan's LiDAR capability check to JS as a constant, since
//  hardware support never changes at runtime — no async call needed.
//

import Foundation
import RoomPlan

@objc(RoomPlanSupport)
class RoomPlanSupport: NSObject {
    @objc static func requiresMainQueueSetup() -> Bool {
        return false
    }

    @objc func constantsToExport() -> [String: Any] {
        return ["isSupported": RoomCaptureSession.isSupported]
    }
}
