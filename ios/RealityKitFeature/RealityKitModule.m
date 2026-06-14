#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(RealityKitModule, NSObject)
RCT_EXTERN_METHOD(openARView:(NSString *)urlString)
RCT_EXTERN_METHOD(openRoomViewer)
RCT_EXTERN_METHOD(getSavedRoomUrl:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
@end
