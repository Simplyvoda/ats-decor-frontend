---
sidebar_position: 3
---

# Environment & Secrets

:::caution Needs a pass before treating as complete
This page reflects only what was confirmed by inspecting `fe/babel.config.js` and the *names* of keys present in `fe/.env` (not their values) during this documentation pass. It has not been checked against an actual `.env.example` (none exists in the repo at the time of writing) or the CI/deployment configuration. Add a `.env.example` and update this page from it.
:::

## How env vars are loaded

`react-native-dotenv` is configured in `fe/babel.config.js`:

```js
[
  'module:react-native-dotenv',
  {
    moduleName: '@env',
    path: '.env',
    safe: false,
    allowUndefined: true,
  },
],
```

This means env values are imported like:

```ts
import {API_URL} from '@env';
```

`safe: false` and `allowUndefined: true` mean there's no build-time enforcement that required variables are actually set — a missing variable resolves to `undefined` at runtime rather than failing the build. Worth knowing if something is silently not working and the cause turns out to be a missing `.env` entry.

## Known variables

| Variable | Consumed by | Purpose |
|---|---|---|
| `API_URL` | `fe/src/config/api.ts` | Base URL for the shared axios instance — every backend request goes through this |
| `SENTRY_DSN` | Sentry initialization (exact call site not traced in this pass) | Error-reporting endpoint |

Ask a teammate for actual values — none are reproduced here.
