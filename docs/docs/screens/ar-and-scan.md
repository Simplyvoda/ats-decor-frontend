---
sidebar_position: 3
---

# AR & Scan

The three screens that make up the app's core feature: scan a room, pick a starting model, place furniture in AR. This page covers them at the **screen level** — what each one does and which services it calls. For how the native Swift code underneath them actually works, see the [Native Bridge Deep-Dive](/docs/native-bridge/overview-and-mental-model), specifically the [RealityKitView](/docs/native-bridge/realitykitview-walkthrough) and [RoomplanView](/docs/native-bridge/roomplanview-walkthrough) walkthroughs — this page won't repeat that material.

## `ScanScreen`

Wraps the native `RoomPlanView` component to drive a room scan via Apple's RoomPlan framework. Dispatches native commands (start/stop/reset/abort scanning) and receives the exported room model back from native code.

## `ChooseModelScreen`

A grid of starting models — bundled local templates plus backend-fetched ones via `DesignTemplateService.getTemplates()` (`GET /design-templates`). Selecting one navigates to `ARViewer` with the chosen model's URL.

## `ARViewerScreen`

The largest screen in the app. Wraps the native `RealityKitView` component: furniture catalogue/picker (via `FurnitureService`), tap-to-place, drag/pinch/rotate gestures, top-view toggle, camera reset, snapshot capture, and the save/publish-design flow (`DesignService`). If you're looking for how placement, floor-snapping, or the gesture handling actually works, that's native Swift code — head to the [RealityKitView walkthrough](/docs/native-bridge/realitykitview-walkthrough) rather than looking for it here.
