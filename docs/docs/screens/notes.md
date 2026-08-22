---
sidebar_position: 6
---

# Notes

The smallest, most self-contained feature area — both screens live under `components/(notes)/` despite being full screens (see [Screens Overview](/docs/screens/overview) for why).

- **`NotesScreen`** — list of notes: search, tag filter, soft-delete/restore, share.
- **`CreateNoteScreen`** — create/edit form: title, description, tags, attachments, a privacy toggle. Also picks up a "pending AR note draft" — if a note was jotted from inside `ARViewerScreen` before its design had been saved, it's held as a single draft in `AsyncStorage` (via `NoteService.saveDraftNote`/`getDraftNote`, not a real API call) until a design ID exists to attach it to.

Both are backed by `NoteService` and the `note` interface — see [API & Services Layer](/docs/architecture/api-and-services-layer).
