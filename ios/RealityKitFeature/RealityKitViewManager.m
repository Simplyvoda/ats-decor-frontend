#import <React/RCTViewManager.h>

@interface RCT_EXTERN_MODULE(RealityKitViewManager, RCTViewManager)

RCT_EXTERN_METHOD(loadFurniture:(nonnull NSNumber *)reactTag urlString:(NSString *)urlString)
RCT_EXTERN_METHOD(toggleTopView:(nonnull NSNumber *)reactTag)
RCT_EXTERN_METHOD(resetCamera:(nonnull NSNumber *)reactTag)
RCT_EXPORT_VIEW_PROPERTY(modelUrl, NSString)

@end
