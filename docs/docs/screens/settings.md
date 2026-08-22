---
sidebar_position: 5
---

# Settings

All under the nested `SettingsNavigator` ([Navigation](/docs/architecture/navigation)).

- **`InitialScreen`** (`settings_screens/InitialScreen.tsx`) — the settings menu: search, a logout action (calls `UserContext.logoutUser`), and links into the sub-screens below.
- **`ProfilePreference`** — edit profile: name, bio, avatar, design-style preference. Backed by `UserService.updateProfile()`.
- **`SecurityPrivacy`** — password change and account deletion (both via `AuthService`), notification/marketing-email toggles.
- **`Shopping`** — **an unfinished subscription/plan placeholder**, not a shipped feature. Worth flagging honestly here rather than implying it's a working payment flow — it exists in the navigator and has UI (crown/credit-card iconography suggesting a premium upsell) but isn't hooked up to real billing as of this writing.
- **`HelpFeedback`** — an FAQ accordion plus a feedback form, backed by `FeedbackService.submit()` (`POST /feedback`).
