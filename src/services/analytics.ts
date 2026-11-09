// Product analytics (GA4, via Firebase Analytics).
//
// Every call here is safe to make anywhere: it does nothing if Firebase
// isn't set up (no GoogleService-Info.plist in the build) and never throws.
// Event names follow GA4's: recommended names (sign_up, login, screen_view)
// where they exist, short snake_case otherwise.
//
// Return visits need no code: GA4 records first_open, session_start and
// user_engagement itself, and its Retention report is built from those.
// setAnalyticsUser below links one person's visits across devices.
import AsyncStorage from '@react-native-async-storage/async-storage';
import {getApps} from '@react-native-firebase/app';
import {
  getAnalytics,
  logEvent,
  logLogin,
  logScreenView,
  logSignUp,
  setAnalyticsCollectionEnabled,
  setUserId,
} from '@react-native-firebase/analytics';

const ENABLED_KEY = 'analyticsEnabled';

// Firebase only starts when the config file is in the app (AppDelegate).
const analytics = () => (getApps().length > 0 ? getAnalytics() : null);

// Runs a call without letting analytics problems reach the user.
function safely(run: (a: ReturnType<typeof getAnalytics>) => Promise<void>) {
  const a = analytics();
  if (!a) {
    return;
  }
  run(a).catch(err => console.log('Analytics error:', err?.message ?? err));
}

// ── The user's choice (Settings → Security & Privacy) ──

export async function isAnalyticsEnabled(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(ENABLED_KEY)) !== 'false';
  } catch {
    return true;
  }
}

export async function setAnalyticsEnabled(enabled: boolean) {
  await AsyncStorage.setItem(ENABLED_KEY, String(enabled)).catch(() => {});
  safely(a => setAnalyticsCollectionEnabled(a, enabled));
}

// Call once at launch so a saved "off" is applied before anything is sent.
export async function applyAnalyticsPreference() {
  const enabled = await isAnalyticsEnabled();
  safely(a => setAnalyticsCollectionEnabled(a, enabled));
}

// ── Who's using the app ──

// Our user id (not email/name) so GA4 can count one person across devices.
// null on log out.
export function setAnalyticsUser(userId: string | null) {
  safely(a => setUserId(a, userId));
}

// ── Events ──

export type SignInMethod = 'email' | 'apple';

export const track = {
  screen(name: string) {
    safely(a => logScreenView(a, {screen_name: name, screen_class: name}));
  },

  signUp(method: SignInMethod) {
    safely(a => logSignUp(a, {method}));
  },

  login(method: SignInMethod) {
    safely(a => logLogin(a, {method}));
  },

  scanStarted() {
    safely(a => logEvent(a, 'scan_started'));
  },

  scanCompleted(durationSeconds: number) {
    safely(a =>
      logEvent(a, 'scan_completed', {
        duration_sec: Math.round(durationSeconds),
      }),
    );
  },

  scanFailed(reason: string) {
    // GA4 caps parameter values at 100 characters.
    safely(a => logEvent(a, 'scan_failed', {reason: reason.slice(0, 100)}));
  },

  // source: where the room came from. isUpdate: re-saving a saved design.
  roomSaved(source: RoomSource, isUpdate: boolean, isPublic: boolean) {
    safely(a =>
      logEvent(a, 'room_saved', {
        source,
        is_update: isUpdate ? 1 : 0,
        is_public: isPublic ? 1 : 0,
      }),
    );
  },

  // Every placement, plus first_product_placed the first time this user
  // places anything (remembered on this device).
  productPlaced(userId: string | undefined, category: string, itemId: string) {
    safely(a =>
      logEvent(a, 'product_placed', {category, item_id: itemId.slice(0, 100)}),
    );
    if (!userId) {
      return;
    }
    const key = `analytics:firstProductPlaced:${userId}`;
    AsyncStorage.getItem(key)
      .then(done => {
        if (done) {
          return;
        }
        AsyncStorage.setItem(key, '1').catch(() => {});
        safely(a => logEvent(a, 'first_product_placed', {category}));
      })
      .catch(() => {});
  },

  // Someone hit a plan limit (the upgrade sheet opened).
  limitHit(feature: string) {
    safely(a => logEvent(a, 'limit_hit', {feature: feature.slice(0, 100)}));
  },

  paywallViewed() {
    safely(a => logEvent(a, 'paywall_viewed'));
  },

  purchaseStarted(plan: string) {
    safely(a => logEvent(a, 'purchase_started', {plan}));
  },

  purchaseCompleted(plan: string) {
    safely(a => logEvent(a, 'purchase_completed', {plan}));
  },

  // from: saving a design as public, or switching an existing one to public.
  publishedToExplore(from: 'save' | 'visibility_toggle') {
    safely(a => logEvent(a, 'publish_to_explore', {from}));
  },
};

export type RoomSource = 'scan' | 'room_builder' | 'house_model';
