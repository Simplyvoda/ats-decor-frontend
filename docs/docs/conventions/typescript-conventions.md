---
sidebar_position: 2
---

# TypeScript Conventions

`fe/tsconfig.json` extends `@react-native/typescript-config`, which is strict by default — this project hasn't loosened it. Source is included from `src`, `types`, and `assets`; there's a custom types directory at `fe/types/` for any ambient/module declarations.

## Where types live

- **Domain types** (the shapes services return/consume): `fe/interface/*.ts` — one file per domain (`auth_user`, `blog`, `design`, `design-template`, `furniture`, `note`). See [API & Services Layer](/docs/architecture/api-and-services-layer) for how these map to services.
- **Component prop types**: declared inline/co-located with each component, not centralized.

:::note Worth verifying before treating as settled convention
This page reflects what was observed during a research pass, not an exhaustive audit of every file's typing patterns. If you're establishing a stricter convention (e.g. always centralizing prop types, naming conventions for interfaces vs. types), that's a decision this documentation hasn't made for you — verify current patterns against a broader sample of the codebase first.
:::
