//
//  RoomplanViewManager.m
//  fe
//
//  Created by Vodina Efem on 15/11/2025.
//

#import <Foundation/Foundation.h>

#import <React/RCTViewManager.h>

@interface RCT_EXTERN_MODULE(RoomplanViewManager, RCTViewManager)

RCT_EXTERN_METHOD(startScanning:(nonnull NSNumber *)reactTag)
RCT_EXTERN_METHOD(stopScanning:(nonnull NSNumber *)reactTag)
RCT_EXTERN_METHOD(exportScanResults:(nonnull NSNumber *)reactTag)

@end

