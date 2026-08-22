---
sidebar_position: 1
---

# Screens Overview

A quick-reference index of every screen and where it lives in the navigation tree. See [Navigation](/docs/architecture/navigation) for the full navigator structure this table refers to.

| Screen | File | Navigator |
|---|---|---|
| Welcome | `screens/WelcomeScreen.tsx` | Root (unauthenticated) |
| Steps | `screens/StepsScreen.tsx` | Root (unauthenticated) |
| Login | `screens/auth_screens/Login.tsx` | AuthNavigator |
| SignUp | `screens/auth_screens/SignUp.tsx` | AuthNavigator |
| GetReady | `screens/auth_screens/GetReady.tsx` | AuthNavigator |
| ForgotPassword | `screens/auth_screens/ForgotPassword.tsx` | AuthNavigator |
| SetPassword | `screens/auth_screens/SetPassword.tsx` | AuthNavigator |
| PrivacyPolicy | `screens/legal_screens/PrivacyPolicyScreen.tsx` | AuthNavigator *and* SettingsNavigator |
| TermsOfService | `screens/legal_screens/TermsOfServiceScreen.tsx` | AuthNavigator *and* SettingsNavigator |
| ScanScreen | `screens/ScanScreen.tsx` | Root (authenticated) |
| ChooseModel | `screens/ChooseModelScreen.tsx` | Root (authenticated) |
| ARViewer | `screens/ARViewerScreen.tsx` | Root (authenticated) |
| HomeTabs → Home | `screens/home_screens/InitialScreen.tsx` | HomeTabNavigator |
| HomeTabs → Design | `components/(design)/DesignScreen.tsx` | HomeTabNavigator |
| HomeTabs → Notes | `components/(notes)/NotesScreen.tsx` | HomeTabNavigator |
| HomeTabs → Explore | `components/(explore)/ExploreScreen.tsx` | HomeTabNavigator |
| BlogPost | `screens/home_screens/blog/BlogPostScreen.tsx` | Root (authenticated) |
| Moodboards | `screens/home_screens/moodboards/ViewMoodboards.tsx` | Root (authenticated) |
| Settings (menu) | `screens/settings_screens/InitialScreen.tsx` | SettingsNavigator |
| ProfilePreferences | `screens/settings_screens/ProfilePreference.tsx` | SettingsNavigator |
| SecurityPrivacy | `screens/settings_screens/SecurityPrivacy.tsx` | SettingsNavigator |
| Shopping | `screens/settings_screens/Shopping.tsx` | SettingsNavigator |
| HelpFeedback | `screens/settings_screens/HelpFeedback.tsx` | SettingsNavigator |
| CreateNote | `components/(notes)/CreateNoteScreen.tsx` | Root (authenticated) |

## Tab-level components that aren't in `screens/`

A few feature components that function as full tab-level screens live under `src/components/` instead of `src/screens/` — worth knowing about since they're documented alongside the screens they're part of, not separately:

- `components/(design)/DesignScreen.tsx` — the Design tab
- `components/(explore)/ExploreScreen.tsx` — the Explore tab
- `components/(home)/(blog)/BlogComponent.tsx` — `BlogHeader`/`BlogPostRow`, used on the Home tab
- `components/(home)/(blog)/BlogRenderer.tsx` — renders Sanity Portable Text blog content
- `components/(home)/(moodboard)/MoodBoardComponent.tsx` — Home tab moodboard preview card
- `components/(home)/(studio)/StudioComponent.tsx` — Home tab "studio"/recent-designs card
- `components/(notes)/NotesScreen.tsx` and `CreateNoteScreen.tsx` — full screens despite the folder name

The pages that follow group all of this by feature area rather than by which folder each file happens to sit in.
