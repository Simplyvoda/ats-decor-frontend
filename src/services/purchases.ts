import {Linking, Platform} from 'react-native';
import Purchases, {PurchasesPackage} from 'react-native-purchases';
import {REVENUECAT_IOS_KEY} from '@env';

// In-app purchases through RevenueCat, which wraps Apple's StoreKit and
// tells our server (webhook) about every subscription change.
//
// The RevenueCat user is our Supabase user id, so purchases follow the
// account across devices. After a purchase or restore, call the server's
// POST /billing/sync (PlanService.syncPurchases) so the plan applies now.

export const purchasesAvailable = Platform.OS === 'ios' && !!REVENUECAT_IOS_KEY;

let configured = false;
let currentUser: string | null = null;

// Connects RevenueCat to this user. Safe to call repeatedly.
export async function connectPurchases(appUserId: string) {
  if (!purchasesAvailable || currentUser === appUserId) {
    return;
  }
  try {
    if (!configured) {
      Purchases.configure({apiKey: REVENUECAT_IOS_KEY as string, appUserID: appUserId});
      configured = true;
    } else {
      await Purchases.logIn(appUserId);
    }
    currentUser = appUserId;
  } catch (err) {
    console.warn('RevenueCat connect failed:', err);
  }
}

// On sign-out, so the next person on this phone doesn't inherit purchases.
export async function disconnectPurchases() {
  if (!configured || !currentUser) {
    return;
  }
  currentUser = null;
  try {
    await Purchases.logOut();
  } catch {
    // Already anonymous
  }
}

// The Hobbyist monthly package from the current offering, with Apple's
// price in the user's own currency (package.product.priceString).
export async function getHobbyistPackage(): Promise<PurchasesPackage | null> {
  if (!configured) {
    return null;
  }
  try {
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;
    return current?.monthly ?? current?.availablePackages[0] ?? null;
  } catch {
    return null;
  }
}

export type PurchaseOutcome = 'purchased' | 'cancelled';

export async function buy(pkg: PurchasesPackage): Promise<PurchaseOutcome> {
  try {
    await Purchases.purchasePackage(pkg);
    return 'purchased';
  } catch (err: any) {
    if (err?.userCancelled) {
      return 'cancelled';
    }
    throw err;
  }
}

export async function restore() {
  await Purchases.restorePurchases();
}

// Apple's own subscription page (change or cancel).
export async function manageSubscription() {
  try {
    await Purchases.showManageSubscriptions();
  } catch {
    await Linking.openURL('https://apps.apple.com/account/subscriptions');
  }
}
