//
//  RoomPlanSupport.m
//
//  ObjC registration half — same pattern as RoomplanViewManager.m, but for
//  a plain NativeModule instead of a view manager.
//

#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(RoomPlanSupport, NSObject)

RCT_EXTERN_METHOD(cameraStatus:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(requestCameraAccess:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end

