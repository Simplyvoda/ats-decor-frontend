---
sidebar_position: 4
---

# Home & Design

## Home tab

**`InitialScreen`** (`screens/home_screens/InitialScreen.tsx`) is the Home tab's dashboard. It composes three feature components:

- **`StudioComponent`** — design tips + recent designs (`DesignService`).
- **`MoodBoardComponent`** — a preview card for saved/liked moodboard designs.
- **`BlogHeader`/`BlogPostRow`** (from `BlogComponent.tsx`) — search/sort header and list rows for blog content, backed by the `useBlogFeed` hook.

## Blog content and Portable Text

Blog posts are authored in Sanity CMS and delivered as **Portable Text** — a JSON format for rich text that isn't plain HTML or Markdown, designed to be renderable into whatever native components a given platform needs (as opposed to embedding raw HTML, which doesn't map cleanly onto React Native views). `BlogRenderer.tsx` uses `@portabletext/react-native` (plus `@sanity/image-url` for image references) to turn that JSON into actual React Native components. `BlogPostScreen` is the detail view — full content render, like, comment, share — backed by `BlogService`.

## Design tab

**`DesignScreen`** (`components/(design)/DesignScreen.tsx`) is the entry point into creating a design — links into the Scan/Camera flow and template selection covered in [AR & Scan](/docs/screens/ar-and-scan).

## Explore tab

**`ExploreScreen`** (`components/(explore)/ExploreScreen.tsx`) is a public feed of explorable designs, fetched via `DesignService.getExplore()`, with like/moodboard actions.

## Moodboards

**`ViewMoodboards`** (`screens/home_screens/moodboards/ViewMoodboards.tsx`) — a grid/list of saved or liked designs, backed by `MoodboardService`.
