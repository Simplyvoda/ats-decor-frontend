#import <React/RCTViewManager.h>

@interface RCT_EXTERN_MODULE(RealityKitViewManager, RCTViewManager)

RCT_EXTERN_METHOD(loadFurniture:(nonnull NSNumber *)reactTag urlString:(NSString *)urlString)
RCT_EXTERN_METHOD(toggleTopView:(nonnull NSNumber *)reactTag)
RCT_EXTERN_METHOD(resetCamera:(nonnull NSNumber *)reactTag)
RCT_EXTERN_METHOD(captureSnapshot:(nonnull NSNumber *)reactTag)
RCT_EXTERN_METHOD(removeSelectedFurniture:(nonnull NSNumber *)reactTag)
RCT_EXTERN_METHOD(exportFurnitureLayout:(nonnull NSNumber *)reactTag)
RCT_EXTERN_METHOD(placeFurnitureFromLayout:(nonnull NSNumber *)reactTag itemJson:(NSString *)itemJson)
RCT_EXPORT_VIEW_PROPERTY(modelUrl, NSString)
RCT_EXPORT_VIEW_PROPERTY(onSnapshotReady, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onFurnitureSelectionChanged, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onFurnitureLayoutExported, RCTDirectEventBlock)

@end
