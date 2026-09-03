//
//  RoomPlanSupport.swift
//  fe
//
//  Created by Vodina Efem on 03/09/2026.
//
//  Exposes RoomPlan's LiDAR capability check to JS as a constant, since
//  hardware support never changes at runtime — no async call needed.

import Foundation
import RoomPlan

@objc(RoomPlanSupport)
class RoomPlanSupport: NSObject{
  @objc static func requiresMainQueueSetup() -> Bool{
    return false
  }
  
  @objc func constantsToExport() -> [String: Any] {
    return ["isSupported": RoomCaptureSession.isSupported]
  }
}
