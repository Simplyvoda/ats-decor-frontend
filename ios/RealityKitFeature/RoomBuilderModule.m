//
//  RoomBuilderModule.m
//
//  Registers RoomBuilderModule (RoomBuilderModule.swift) with React Native.
//  JS reaches it as NativeModules.RoomBuilderModule.buildRoom(specJson),
//  which returns a Promise of the built room's file:// URL. The method
//  signature here must mirror the Swift one exactly.
//

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(RoomBuilderModule, NSObject)
RCT_EXTERN_METHOD(buildRoom:(NSString *)specJson resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
@end
