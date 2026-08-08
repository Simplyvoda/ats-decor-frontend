//
//  RoomplanView.m
//  fe
//
//  Created by Vodina Efem on 15/11/2025.
//

#import <Foundation/Foundation.h>
#import <React/RCTViewManager.h>

@interface RCT_EXTERN_REMAP_MODULE(RoomplanView, RoomplanView, UIView)

RCT_EXPORT_VIEW_PROPERTY(onScanFinished, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onExportComplete, RCTDirectEventBlock)

@end

