//
//  fe-Bridging-Header.h
//
//  Deliberately empty — and that emptiness is instructive.
//
//  A bridging header exposes Objective-C declarations TO Swift. Many older
//  RN/Swift tutorials tell you to fill this with React imports, but this
//  project's Swift files get React types via module import ("import React")
//  instead, so nothing is needed here.
//
//  Note what this proves about the bridge: the .m registration files
//  (RCT_EXTERN_MODULE etc.) need no visibility into the Swift code and the
//  Swift code needs none into them — the two sides find each other purely
//  by class-name strings in the Objective-C runtime, not through any header.
//
//  The file itself must stay: the target's SWIFT_OBJC_BRIDGING_HEADER build
//  setting points at it, so deleting it (without also clearing that
//  setting) breaks the build.
//

#ifndef fe_Bridging_Header_h
#define fe_Bridging_Header_h

#endif /* fe_Bridging_Header_h */
