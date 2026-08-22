// Empty on purpose: this file's only job is to stop postcss-load-config's
// upward directory search from picking up the parent fe/ project's
// postcss.config.js (configured for NativeWind/React Native, not a web
// build) — that mismatch crashes Docusaurus's own CSS pipeline with
// "Cannot read properties of undefined (reading 'config')" from
// tailwindcss, since fe/docs is nested inside fe/.
module.exports = {};
