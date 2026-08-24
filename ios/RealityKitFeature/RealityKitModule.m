//
//  RealityKitModule.m
//
//  Registers RealityKitModule — a plain NativeModule, NOT a view. Unlike the
//  view managers, this has no UI component: JS reaches it directly as
//  NativeModules.RealityKitModule.someMethod(...). Same string-matching
//  rules as the view managers: the class name and method signatures here
//  must mirror the Swift side (RealityKitModule.swift).
//
//  getSavedRoomUrl shows the promise pattern: declaring the last two args
//  as RCTPromiseResolveBlock/RCTPromiseRejectBlock makes RN hand JS a
//  Promise, resolved/rejected by whichever block Swift calls.
//

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(RealityKitModule, NSObject)
RCT_EXTERN_METHOD(openARView:(NSString *)urlString)
RCT_EXTERN_METHOD(openRoomViewer)
RCT_EXTERN_METHOD(getSavedRoomUrl:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
@end
