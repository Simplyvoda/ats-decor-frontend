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
//  Also lets JS check and ask for camera access, so the app can explain
//  why before iOS shows its one-time "Allow camera?" prompt, and help
//  people who said no.
//

import AVFoundation
import Foundation
import React
import RoomPlan

@objc(RoomPlanSupport)
class RoomPlanSupport: NSObject {
    @objc static func requiresMainQueueSetup() -> Bool {
        return false
    }

    @objc func constantsToExport() -> [String: Any] {
        return ["isSupported": RoomCaptureSession.isSupported]
    }

    // "notDetermined" (never asked), "authorized", "denied" or "restricted"
    // (blocked by Screen Time / device management).
    @objc func cameraStatus(_ resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
        resolve(Self.describe(AVCaptureDevice.authorizationStatus(for: .video)))
    }

    // Shows iOS's camera prompt if it hasn't been answered yet, then
    // resolves with the resulting status. iOS only ever shows it once;
    // after that this just reports the answer.
    @objc func requestCameraAccess(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
        AVCaptureDevice.requestAccess(for: .video) { _ in
            resolve(Self.describe(AVCaptureDevice.authorizationStatus(for: .video)))
        }
    }

    private static func describe(_ status: AVAuthorizationStatus) -> String {
        switch status {
        case .authorized: return "authorized"
        case .denied: return "denied"
        case .restricted: return "restricted"
        case .notDetermined: return "notDetermined"
        @unknown default: return "denied"
        }
    }
}
