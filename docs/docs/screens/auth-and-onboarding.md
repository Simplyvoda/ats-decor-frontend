---
sidebar_position: 2
---

# Auth & Onboarding

## Onboarding

- **`WelcomeScreen`** — the very first screen an unauthenticated user sees. "Get Started" leads into `Steps`.
- **`StepsScreen`** — a swipeable onboarding carousel, leading into `GetReady`.

## Auth

All auth screens call into `AuthService` ([API & Services Layer](/docs/architecture/api-and-services-layer)) and, on success, `UserContext.signInUser` ([State Management](/docs/architecture/state-management)).

- **`Login`** — email/password sign-in, built with `react-hook-form`.
- **`SignUp`** — registration form; also supports Apple Sign-In via `@invertase/react-native-apple-authentication`.
- **`GetReady`** — a simple interstitial with "Sign Up" / "Log In" choices.
- **`ForgotPassword`** — requests a password-reset email.
- **`SetPassword`** — sets a new password. Reached two ways: normally from `ForgotPassword`'s flow, or directly via the Supabase password-recovery deep link handled in `App.tsx` (see [Navigation → Deep links](/docs/architecture/navigation#deep-links)), which passes an `accessToken` route param.

All of these live under the nested `AuthNavigator`, meaning none of them are reachable once `user` is set — see [Navigation](/docs/architecture/navigation) for why that's a hard guarantee, not just a UI convention.
