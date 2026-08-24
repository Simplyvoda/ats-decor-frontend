//
//  RoomplanViewManager.m
//
//  The Objective-C "registration" half of the RoomPlan bridge. Swift classes
//  can't use React Native's registration macros directly (they're C
//  preprocessor macros), so this tiny .m file exists purely to declare, in a
//  language the macros understand, what the Swift side exposes.
//
//  Nothing here is compile-time linked to the Swift code. Every line below
//  is a STRING-MATCHED promise resolved at runtime:
//
//  • RCT_EXTERN_MODULE(RoomplanViewManager, RCTViewManager) tells RN
//    "a class named 'RoomplanViewManager' exists in the ObjC runtime and is
//    an RCTViewManager". The Swift class satisfies it via its
//    @objc(RoomplanViewManager) attribute. Misspell either side and the
//    component silently disappears — no build error, no crash.
//
//  • RCT_EXTERN_METHOD lines mirror the @objc command methods on the Swift
//    manager, selector by selector. The signatures here must match the
//    Swift signatures exactly (argument count, labels, types).
//
//  • RCT_EXPORT_VIEW_PROPERTY lines declare props JS may pass. For an
//    event prop, RN uses this declaration to know it must synthesize a
//    callback block and inject it into the Swift view's matching
//    @objc var when the JS side supplies that prop.
//

#import <Foundation/Foundation.h>

#import <React/RCTViewManager.h>

@interface RCT_EXTERN_MODULE(RoomplanViewManager, RCTViewManager)

RCT_EXTERN_METHOD(startScanning:(nonnull NSNumber *)reactTag)
RCT_EXTERN_METHOD(stopScanning:(nonnull NSNumber *)reactTag)
RCT_EXTERN_METHOD(resetScanning:(nonnull NSNumber *)reactTag)
RCT_EXTERN_METHOD(abortScanning:(nonnull NSNumber *)reactTag)

RCT_EXPORT_VIEW_PROPERTY(onExportComplete, RCTBubblingEventBlock)

@end
