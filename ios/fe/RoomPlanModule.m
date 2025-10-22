#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(RoomPlanModule, NSObject)
RCT_EXTERN_METHOD(startScan:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(stopScan)
@end
