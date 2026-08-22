---
sidebar_position: 1
---

# Glossary

Domain terms used throughout this app and this documentation.

| Term | Meaning | Owned by |
|---|---|---|
| **Design** | A saved AR scene — a room (scanned or template) with furniture placed in it. Can be published/made public. | `DesignService`, `design` interface |
| **Design template** | A starting-point model offered on `ChooseModelScreen` — either bundled locally or fetched from the backend. Not the same as a *design* (a template is a starting point; a design is what a user actually saves). | `DesignTemplateService`, `design-template` interface |
| **Furniture** | A placeable catalog item shown in `ARViewerScreen`'s furniture picker. | `FurnitureService`, `furniture` interface |
| **Room scan** | The `.usdz` + metadata output of a RoomPlan capture session, produced by `ScanScreen`/`RoomplanView`. See [RoomplanView Walkthrough](/docs/native-bridge/roomplanview-walkthrough). | native bridge (`RoomplanView`) |
| **Moodboard** | A user's collection of saved/liked designs. | `MoodboardService` |
| **Studio** | The Home-tab card surfacing design tips and recent designs (`StudioComponent`). | — |
| **Blog post** | Content authored in Sanity CMS, delivered as Portable Text and rendered via `BlogRenderer`. | `BlogService` |
| **Portable Text** | A JSON-based rich-text format (used by Sanity) designed to be rendered into whatever native components a given platform needs, rather than embedding raw HTML. See [Home & Design](/docs/screens/home-and-design). | — |
