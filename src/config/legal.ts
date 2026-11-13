// Where the app's legal documents (and credits) live. They're web pages (ats-website,
// src/pages/app/) so they can be updated without an app release; the app
// opens them in an in-app browser (see utils/openLegal.ts).
//
// The same URLs go in App Store Connect (Privacy Policy URL, and the Terms
// of Use link required for subscriptions).
export const LEGAL_URLS = {
  privacy: 'https://www.pladomus.com/app/privacy-policy',
  terms: 'https://www.pladomus.com/app/terms-of-use',
  // Third-party 3D models, fonts and open-source software
  credits: 'https://www.pladomus.com/app/credits',
} as const;

export type LegalDoc = keyof typeof LEGAL_URLS;
