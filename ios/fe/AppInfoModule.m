//
//  AppInfoModule.m
//
//  The app's real version, build number and build date, for Help &
//  Feedback → App Information, so nothing there is typed by hand.
//
//  JS: NativeModules.AppInfoModule.{version, build, buildDate}
//  (see src/utils/appInfo.ts).
//
//  - version / build: CFBundleShortVersionString / CFBundleVersion, set by
//    Xcode (MARKETING_VERSION / CURRENT_PROJECT_VERSION; Xcode Cloud sets
//    the build number itself).
//  - buildDate (YYYY-MM-DD): written into the built Info.plist as
//    PDBuildDate by the "Stamp build date" build phase on every build.
//    Falls back to when this file was compiled.
//

#import <React/RCTBridgeModule.h>

@interface AppInfoModule : NSObject <RCTBridgeModule>
@end

@implementation AppInfoModule

RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

// __DATE__ is "Nov 13 2026" (single-digit days padded with a space).
static NSString *CompiledDate(void)
{
  NSString *raw = [@(__DATE__) stringByReplacingOccurrencesOfString:@"  "
                                                         withString:@" "];
  NSDateFormatter *parser = [NSDateFormatter new];
  parser.locale = [NSLocale localeWithLocaleIdentifier:@"en_US_POSIX"];
  parser.dateFormat = @"MMM d yyyy";
  NSDate *date = [parser dateFromString:raw];
  if (!date) {
    return @"";
  }
  NSDateFormatter *printer = [NSDateFormatter new];
  printer.locale = [NSLocale localeWithLocaleIdentifier:@"en_US_POSIX"];
  printer.dateFormat = @"yyyy-MM-dd";
  return [printer stringFromDate:date];
}

- (NSDictionary *)constantsToExport
{
  NSDictionary *info = [[NSBundle mainBundle] infoDictionary];
  NSString *stamped = info[@"PDBuildDate"];
  return @{
    @"version" : info[@"CFBundleShortVersionString"] ?: @"",
    @"build" : info[@"CFBundleVersion"] ?: @"",
    @"buildDate" : stamped.length ? stamped : CompiledDate(),
  };
}

@end
