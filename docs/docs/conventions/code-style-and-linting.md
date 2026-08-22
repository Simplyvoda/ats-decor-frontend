---
sidebar_position: 1
---

# Code Style & Linting

Kept intentionally brief, because there isn't much to document beyond the defaults:

- **ESLint** (`fe/.eslintrc.js`): `{root: true, extends: '@react-native'}`. That's the entire config — no custom rules layered on top. Run it with `npm run lint` (`eslint .`).
- **Prettier** (`fe/.prettierrc.js`): `singleQuote`, no bracket spacing, trailing commas, `bracketSameLine`, `arrowParens: 'avoid'`.

This project has not customized linting beyond the standard `@react-native` preset. If you're looking for a documented style guide beyond "what ESLint/Prettier enforce," it doesn't exist yet — code review is the current mechanism for anything not caught by these two tools.
