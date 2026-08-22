---
sidebar_position: 3
---

# Project Structure

A map of `fe/`, annotated. Every path here is referenced from elsewhere in this site — this page is meant to be the thing you come back to when you're lost.

```
fe/
├── App.tsx                     # Root component: providers, navigation container, deep-link handling
├── index.js                    # RN entry point, registers App
├── interface/                  # Shared TypeScript types (domain models, not component props)
│   ├── auth_user.interface.ts
│   ├── blog.interface.ts
│   ├── design.interface.ts
│   ├── design-template.interface.ts
│   ├── furniture.interface.ts
│   └── note.interface.ts
├── src/
│   ├── navigation/              # AppNavigator, HomeTabNavigator — see Architecture → Navigation
│   ├── context/                 # UserContext — the app's only React Context
│   ├── config/
│   │   └── api.ts                # Shared axios instance + interceptors
│   ├── services/                 # One file per backend domain (AuthService, NoteService, etc.)
│   ├── utils/                    # authEvents.ts, deepLinking.ts, navigation.ts
│   ├── hooks/
│   │   └── useBlogFeed.ts         # The one custom data-fetching hook in the app
│   ├── screens/                   # Most screens live here, grouped into subfolders by area
│   │   ├── auth_screens/
│   │   ├── home_screens/
│   │   ├── settings_screens/
│   │   └── legal_screens/
│   ├── components/
│   │   ├── (notes)/                # NotesScreen + CreateNoteScreen — screens, despite the folder name
│   │   ├── (design)/, (explore)/, (home)/  # Tab-level feature components
│   │   ├── RoomScanner/             # The JS-side native bridge wrappers — see below
│   │   ├── molecules/, shared/      # Shared UI (buttons, avatars, header)
│   │   └── ...
│   ├── styles/common.ts           # Legacy shared StyleSheet objects (most screens now use NativeWind)
│   └── data/legal/                # Raw privacy policy / terms of service text
├── assets/constants/images.ts     # Central image asset registry
├── ios/                            # Xcode project + the native Swift/ObjC bridge — see below
├── android/                         # Exists, but the app's core AR features have no Android implementation
└── docs/                            # This documentation site (Docusaurus)
```

## The native bridge, specifically

The Swift/Objective-C source for the two native bridges lives in `fe/ios/`, not under `src/`:

```
fe/ios/
├── RealityKitFeature/
│   ├── RealityKitView.swift            # The furniture-placement/AR viewer (~636 lines)
│   ├── RealityKitViewManager.swift/.m    # Its RCTViewManager
│   ├── RealityKitModule.m                 # Plain NativeModule export shim
│   └── RealityKitViewController.swift      # Contains RealityKitModule's Swift implementation
│                                              # (misleadingly named — see Native Bridge → Native Modules)
├── RoomplanViewManager.swift              # Room-scanning manager + view class (one file)
├── RoomplanViewManager.m                    # Its RCTViewManager export shim
├── fe/AppDelegate.swift                      # App bootstrap
├── fe/fe-Bridging-Header.h                    # Deliberately empty — see Native Bridge → Registration
└── Podfile
```

The JS-side wrappers for these live alongside the RN screens, in `fe/src/components/RoomScanner/`:

- `RealityKitView.native.tsx` — `requireNativeComponent` wrapper + command dispatchers for `RealityKitView`
- `RoomPlanView.native.js` — the equivalent thin wrapper for `RoomplanView`

The full mechanics of how these two sides talk to each other are in [Native Bridge Deep-Dive](/docs/native-bridge/overview-and-mental-model).
