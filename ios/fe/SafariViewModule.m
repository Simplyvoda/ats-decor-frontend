//
//  SafariViewModule.m
//
//  Registers SafariViewModule (SafariViewModule.swift) with React Native.
//  The class name and method signature must match the Swift side exactly.
//

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(SafariViewModule, NSObject)
RCT_EXTERN_METHOD(open:(NSString *)url
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
@end
