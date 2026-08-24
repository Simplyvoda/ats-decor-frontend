//
//  RealityKitViewManager.m
//
//  The ObjC "registration" half of the RealityKit bridge. RN's registration
//  macros are C preprocessor macros Swift can't use, so this file declares —
//  in macro form — exactly what RealityKitViewManager.swift and
//  RealityKitView.swift expose. Everything is matched BY STRING at runtime:
//
//  • RCT_EXTERN_MODULE — "a class named RealityKitViewManager exists"; the
//    Swift @objc(RealityKitViewManager) attribute is what makes that true.
//  • RCT_EXTERN_METHOD — one line per command method on the Swift manager;
//    signatures must mirror the Swift @objc signatures exactly.
//  • RCT_EXPORT_VIEW_PROPERTY — props JS may pass to the view. For plain
//    props (modelUrl) RN sets them via KVC (setValue:forKey:), which lands
//    in the Swift var's didSet. For event props (the RCTDirectEventBlock
//    lines) RN synthesizes a callback block and injects it into the view's
//    matching @objc var — calling that block from Swift IS emitting the
//    event to JS.
//

#import <React/RCTViewManager.h>

@interface RCT_EXTERN_MODULE(RealityKitViewManager, RCTViewManager)

RCT_EXTERN_METHOD(loadFurniture:(nonnull NSNumber *)reactTag urlString:(NSString *)urlString)
RCT_EXTERN_METHOD(toggleTopView:(nonnull NSNumber *)reactTag)
RCT_EXTERN_METHOD(resetCamera:(nonnull NSNumber *)reactTag)
RCT_EXTERN_METHOD(captureSnapshot:(nonnull NSNumber *)reactTag)
RCT_EXTERN_METHOD(removeSelectedFurniture:(nonnull NSNumber *)reactTag)
RCT_EXTERN_METHOD(exportFurnitureLayout:(nonnull NSNumber *)reactTag)
RCT_EXTERN_METHOD(placeFurnitureFromLayout:(nonnull NSNumber *)reactTag itemJson:(NSString *)itemJson)
RCT_EXTERN_METHOD(exportDesignPdf:(nonnull NSNumber *)reactTag name:(NSString *)name)
RCT_EXPORT_VIEW_PROPERTY(modelUrl, NSString)
RCT_EXPORT_VIEW_PROPERTY(onSnapshotReady, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onFurnitureSelectionChanged, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onFurnitureLayoutExported, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onDesignPdfExported, RCTDirectEventBlock)

@end
