---
sidebar_position: 3
---

# State Management

There is exactly one React Context in this app: `UserContext` (`fe/src/context/UserContext.tsx`). Everything else is `AsyncStorage`, local component state, and `react-hook-form` for form-local state.

## `UserContext`

Exposes:

```ts
{
  user: IUser | null;
  isLoadingUser: boolean;
  signInUser: (data: ISignInResponse) => Promise<void>;
  logoutUser: () => Promise<void>;
  updateUser: (partial: Partial<IUser>) => Promise<void>;
}
```

### Restore-then-validate, not just restore

On mount, `UserContext` doesn't just trust whatever's cached in `AsyncStorage`. The restore flow is:

1. Read `user` from `AsyncStorage`.
2. If the cached record is missing `first_name`/`last_name`, treat it as stale and clear `user`/`token`/`session` entirely — the user has to re-authenticate.
3. Otherwise, call `UserService.getProfile()` (`GET /user`) to confirm the backend still honors the cached token **before** trusting it and setting `user` in state.
4. If that call fails, clear the cached auth data instead of silently logging the user in with a token the backend has already rejected.

This is the detail that makes [Navigation](/docs/architecture/navigation)'s auth gate actually trustworthy — if it were "cached user exists → treat as logged in," a revoked or expired token would still render the full authenticated screen set until the first API call happened to fail somewhere unrelated.

### The 401 pub/sub

`UserContext` also subscribes to an `onUnauthorized` event (from `fe/src/utils/authEvents.ts`) and calls `logoutUser()` whenever it fires. See [API & Services Layer](/docs/architecture/api-and-services-layer) and [Data Flow](/docs/architecture/data-flow) for where that event actually gets emitted — the short version is: any API call anywhere in the app that comes back `401` forces an immediate logout, not just the initial launch check.

### Sign-in ordering matters

`signInUser` persists `token`, `user`, and `session` to `AsyncStorage` **before** calling `setUser(...)`. This order is deliberate, not incidental — flipping `user` from `null` to a real value is what causes `AppNavigator` to swap to the authenticated screen set, and those screens can fire API calls immediately on mount. If the token write hadn't landed in `AsyncStorage` yet, those first requests would go out with no (or a stale) `Authorization` header.

## Why no Redux/Zustand

The app's actual cross-cutting state is small: "who's logged in" and "what does the shared axios client need." A single Context handles that cleanly. Everything screen-specific (form fields, list filters, loading flags) is local `useState`, which is the right default until there's real evidence of state that needs to be shared across distant parts of the tree.
