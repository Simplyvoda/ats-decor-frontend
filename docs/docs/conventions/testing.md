---
sidebar_position: 3
---

# Testing

This is the most important page in this section to read honestly, not skim.

## The current state

**One test file exists**: `fe/__tests__/App.test.tsx`, a smoke test that renders `<App />` and confirms it doesn't crash. Configured via `fe/jest.config.js` (`preset: 'react-native'`), run with `npm run test`.

That's it. There is essentially no test coverage of business logic, services, the auth flow, or the native bridge.

## Why that's a real risk, specifically here

This isn't a generic "you should have more tests" observation — a few areas in this codebase are genuinely risky to change without any safety net:

- **`UserContext`'s restore-and-validate logic** ([State Management](/docs/architecture/state-management)) — the difference between "trust a cached token" and "validate it against the backend first" is a real security property, and it's currently only verified by manual testing.
- **The 401 pub/sub** ([Data Flow](/docs/architecture/data-flow)) — a cross-cutting flow spanning three files (`api.ts`, `authEvents.ts`, `UserContext.tsx`) with no direct test exercising the full chain.
- **The native bridge** ([Native Bridge Deep-Dive](/docs/native-bridge/overview-and-mental-model)) — inherently the hardest thing in this codebase to unit test (it's UIKit/RealityKit/RoomPlan code, largely gesture- and hardware-driven), but that's exactly why the two real bugs documented on the [RoomplanView walkthrough](/docs/native-bridge/roomplanview-walkthrough) shipped and sat undetected until this documentation pass manually inspected the files.

## A prioritized starting point, if testing work begins

This is a recommendation, not a description of a plan that's already underway:

1. **Service-layer request/response mapping** — the easiest, highest-value tests to add first. Each service in `fe/src/services/` is a thin, pure-ish wrapper; mocking `api` and asserting the right endpoint/payload shape is low-effort and catches an entire class of "silently sends the wrong thing" bugs.
2. **`UserContext`'s restore flow** — mock `AsyncStorage` and `UserService.getProfile()`, assert the three branches (valid cache + valid token → logged in; stale/missing cache → logged out; valid-shaped cache + rejected token → logged out and cache cleared).
3. **The 401 pub/sub end-to-end** — mock an axios 401 response and assert `UserContext`'s `user` state actually flips to `null`.

Native bridge testing (native unit tests in Swift, or RN-side integration tests that mock `NativeModules`) is a reasonable eventual goal but a much bigger lift than the three items above — worth treating as a separate, later effort rather than blocking on it.
