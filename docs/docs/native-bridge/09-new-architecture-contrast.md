---
sidebar_position: 9
---

# Contrast: What New Architecture Would Change

Everything in this section describes the **classic bridge**, which [page 01](/docs/native-bridge/overview-and-mental-model) confirmed is what this app actually uses on iOS. React Native's newer "New Architecture" — Fabric for views, TurboModules for native modules, both built on JSI (a direct C++ binding, no batched JSON-serialized bridge messages) — solves the exact class of problem this section kept running into. Worth understanding what specifically would change, now that the classic-bridge mental model is solid.

## The core difference: codegen instead of runtime name-matching

[Page 02](/docs/native-bridge/registration-and-runtime-matching) established the crux mechanism of the classic bridge: `RCT_EXTERN_MODULE`/`RCT_EXTERN_REMAP_MODULE` connect JS-facing names to native classes by **Objective-C runtime string matching**, with nothing checked at compile time. That single fact is the root cause of both real bugs documented on the [RoomplanView walkthrough](/docs/native-bridge/roomplanview-walkthrough) — the contradicting duplicate `.m` file wasn't caught by any compiler, only by a human reading two files side by side.

Under the New Architecture, you write a **JS spec file** (a `.ts` file with a very specific, restricted shape) declaring a native component's or module's props, commands, events, and methods with real TypeScript types. RN's codegen tooling reads that spec at build time and **generates** the native-side interfaces (Swift/ObjC protocol conformances, C++ shadow node definitions) from it — the native implementation then has to satisfy a generated, compiler-checked contract, instead of a hand-written `.m` file's declarations being trusted to match a hand-written Swift class by name alone.

Concretely, this closes exactly the gap flagged repeatedly across this section:

- **No compile-time contract today**: `RealityKitViewProps` in `RealityKitView.native.tsx` is a hand-written TypeScript interface, manually kept in sync with `RealityKitViewManager.m`'s `RCT_EXPORT_VIEW_PROPERTY` list. If a native prop name changed in the `.m` file and nobody updated the `.tsx` interface, JS would silently stop receiving that prop — no error, no warning, just a value that's quietly always `undefined`.
- **Under codegen**: the spec file *is* the single source of truth for both sides. A native prop name change either updates the generated native interface (forcing the Swift/ObjC implementation to be updated to match, as a build error if it isn't) or it doesn't happen at all, because there's only one place the name is written down.

The same logic applies to the `RoomplanView.m` duplicate-declaration bug: under codegen, there's exactly one spec per component, so "two files disagree about what type an event is" isn't a category of bug that can exist — there's nothing to disagree, since there's only one declaration site.

## What stays conceptually the same

Props/commands/events as *categories* of interaction don't go away under Fabric/TurboModules — a native view still receives declarative prop updates, still exposes imperative commands, still fires events back to JS. What changes is the transport (JSI direct calls instead of a batched, JSON-serialized, asynchronous bridge queue) and the safety net (generated, typed contracts instead of hand-matched runtime names). If you already understand *why* each of the three mechanisms in this section exists, understanding their New Architecture equivalents is a transport-and-tooling upgrade, not a new mental model.

## Why this app isn't on it (as far as this documentation can tell)

Not independently investigated as part of this pass — the `Podfile`'s `RCT_NEW_ARCH_ENABLED = '0'` is a deliberate, explicit setting, and the two native modules this section documents were both written entirely with classic-bridge macros, with no partial migration in progress anywhere in the codebase. If a New Architecture migration is ever undertaken, this entire section (registration mechanism, KVC-based prop application, `addUIBlock` command dispatch, `RCTDirectEventBlock`/`RCTBubblingEventBlock`) would need a substantial rewrite, not just an update — worth knowing before treating that as a small task.
