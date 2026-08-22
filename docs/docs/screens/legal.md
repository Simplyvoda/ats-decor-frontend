---
sidebar_position: 7
---

# Legal

- **`PrivacyPolicyScreen`**
- **`TermsOfServiceScreen`**

Both render static content from `fe/src/data/legal/{privacyPolicy,termsOfService}.ts` via a shared `LegalDocRenderer` component — no service calls, no interactivity beyond scrolling. Notably, both are reachable from **two different places**: from the logged-out `AuthNavigator` (so a prospective user can read them before signing up) and from `Settings` (so an existing user can find them later). See [Navigation](/docs/architecture/navigation) for exactly where each registration lives.
