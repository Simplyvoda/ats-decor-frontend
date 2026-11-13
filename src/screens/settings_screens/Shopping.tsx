import React, {useCallback, useState} from 'react';
import {openLegal} from '../../utils/openLegal';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {Check, ChevronLeft, Clock, Crown} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import {goBack} from '../../utils/navigation';
import {makeStyles, useTheme} from '../../theme/useTheme';
import {usePlan} from '../../context/PlanContext';
import PlanService from '../../services/PlanService';
import {
  FeatureKey,
  IFeatureUsage,
  IPlanRow,
} from '../../../interface/plan.interface';
import {
  PLAN_DISPLAY,
  cardLines,
  planName,
  usageLine,
} from '../../config/plans';
import {
  buy,
  getHobbyistPackage,
  manageSubscription,
  purchasesAvailable,
  restore,
} from '../../services/purchases';
import {track} from '../../services/analytics';
import type {PurchasesPackage} from 'react-native-purchases';

// Usage meters for these.
const METERED: FeatureKey[] = [
  'room.active',
  'design.create',
  'note.active',
  'community.save',
  'moodboard.active',
];

const errorText = (err: any) =>
  err?.response?.data?.message || err?.message || 'Please try again';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

const ShoppingScreen = () => {
  const navigation = useNavigation();
  const styles = useStyles();
  const {colors} = useTheme();
  const {usage, refresh, syncPurchases} = usePlan();
  const [plans, setPlans] = useState<IPlanRow[] | null>(null);
  // Apple's Hobbyist product (with its local price), once loaded
  const [pkg, setPkg] = useState<PurchasesPackage | null>(null);
  const [busy, setBusy] = useState<'buy' | 'restore' | null>(null);

  // Before launch (limits not enforced) everyone has full access; show
  // the early-access note instead. Developers see the real screen.
  const showPlans = usage?.enforced || __DEV__;

  useFocusEffect(
    useCallback(() => {
      refresh();
      PlanService.getPlans()
        .then(setPlans)
        .catch(() => setPlans([]));
      getHobbyistPackage().then(setPkg);
    }, [refresh]),
  );

  useFocusEffect(
    useCallback(() => {
      if (showPlans) {
        track.paywallViewed();
      }
    }, [showPlans]),
  );

  const upgrade = async (plan: string) => {
    if (!purchasesAvailable || !pkg) {
      Toast.show({
        type: 'info',
        text1: 'Upgrades aren’t available yet',
        text2: 'Please try again later.',
      });
      return;
    }
    setBusy('buy');
    track.purchaseStarted(plan);
    try {
      if ((await buy(pkg)) === 'cancelled') {
        return;
      }
      const next = await syncPurchases();
      track.purchaseCompleted(plan);
      Toast.show({
        type: 'success',
        text1: `Welcome to ${planName(next.plan)}!`,
        text2: 'Your new limits are ready to use.',
      });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Purchase didn’t go through',
        text2: errorText(err),
      });
    } finally {
      setBusy(null);
    }
  };

  const restorePurchases = async () => {
    setBusy('restore');
    try {
      await restore();
      const next = await syncPurchases();
      Toast.show(
        next.plan === 'casual'
          ? {type: 'info', text1: 'No subscription found to restore'}
          : {type: 'success', text1: `${planName(next.plan)} restored`},
      );
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Could not restore purchases',
        text2: errorText(err),
      });
    } finally {
      setBusy(null);
    }
  };

  const hobbyistPrice = pkg ? `${pkg.product.priceString}/month` : null;
  const onPaidPlan = !!usage && usage.plan !== 'casual';

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => goBack(navigation)}
          accessibilityLabel="Back"
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
          <ChevronLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shopping</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {!usage || plans === null ? (
          <ActivityIndicator color={colors.brand} style={styles.loader} />
        ) : !showPlans ? (
          <EarlyAccessCard />
        ) : (
          <>
            <CurrentPlanCard
              plan={usage.plan}
              expiresAt={usage.plan_expires_at}
              features={usage.features}
            />

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Crown size={18} color={colors.brand} />
                <Text style={styles.sectionTitle}>Subscription Plans</Text>
              </View>
              {[...plans].reverse().map(row => (
                <PlanCard
                  key={row.plan}
                  row={row}
                  current={row.plan === usage.plan}
                  price={row.plan === 'hobbyist' ? hobbyistPrice : null}
                  busy={busy === 'buy'}
                  onUpgrade={() => upgrade(row.plan)}
                />
              ))}
            </View>

            {/* Required by Apple on any screen that sells a subscription */}
            <Text style={styles.legal}>
              Hobbyist is a monthly subscription
              {hobbyistPrice ? ` at ${hobbyistPrice}` : ''}. Payment is
              charged to your Apple ID. It renews automatically unless you
              cancel at least 24 hours before the end of the period, in your
              App Store account settings.
            </Text>
            <View style={styles.links}>
              <TouchableOpacity
                onPress={() => openLegal('terms')}>
                <Text style={styles.link}>Terms of Use</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => openLegal('privacy')}>
                <Text style={styles.link}>Privacy Policy</Text>
              </TouchableOpacity>
            </View>

            {purchasesAvailable && (
              <View style={styles.links}>
                {onPaidPlan && (
                  <TouchableOpacity onPress={manageSubscription}>
                    <Text style={styles.link}>Manage subscription</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={restorePurchases}
                  disabled={busy !== null}>
                  <Text style={styles.link}>
                    {busy === 'restore' ? 'Restoring…' : 'Restore purchases'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

function EarlyAccessCard() {
  const styles = useStyles();
  const {colors} = useTheme();
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Crown size={18} color={colors.brand} />
        <Text style={styles.sectionTitle}>Early Access</Text>
      </View>
      <Text style={styles.body}>
        PlaDomus is free for our first 250 users. As an early user you have
        full access while we’re in early access, plus a special benefit when
        paid plans launch.
      </Text>
    </View>
  );
}

function CurrentPlanCard({
  plan,
  expiresAt,
  features,
}: {
  plan: string;
  expiresAt: string | null;
  features: Partial<Record<FeatureKey, IFeatureUsage>>;
}) {
  const styles = useStyles();
  const meters = METERED.map(f => ({
    feature: f,
    usage: features[f],
    line: usageLine(f, features[f]),
  })).filter(m => m.line);

  return (
    <View style={styles.section}>
      <Text style={styles.label}>Your plan</Text>
      <Text style={styles.currentPlan}>{planName(plan)}</Text>
      {expiresAt && (
        <Text style={styles.muted}>Until {formatDate(expiresAt)}</Text>
      )}
      <View style={styles.meters}>
        {meters.map(({feature, usage, line}) => {
          const used = usage?.used ?? 0;
          const limit = usage?.limit ?? 1;
          const full = used >= limit;
          return (
            <View key={feature}>
              <Text style={[styles.meterText, full && styles.meterTextFull]}>
                {line}
              </Text>
              <View style={styles.track}>
                <View
                  style={[
                    styles.fill,
                    full && styles.fillFull,
                    {width: `${Math.min(100, (used / limit) * 100)}%`},
                  ]}
                />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function PlanCard({
  row,
  current,
  price,
  busy,
  onUpgrade,
}: {
  row: IPlanRow;
  current: boolean;
  // Apple's price, when known; otherwise the display price
  price: string | null;
  busy: boolean;
  onUpgrade: () => void;
}) {
  const styles = useStyles();
  const {colors} = useTheme();
  const display = PLAN_DISPLAY[row.plan];
  const paid = row.plan !== 'casual';
  const lines = cardLines(row.plan, row.features);

  return (
    <View style={[styles.planCard, paid && styles.planCardPaid]}>
      <View style={styles.planTop}>
        <Text style={styles.planName}>{planName(row.plan)} Plan</Text>
        {current ? (
          <Text style={styles.badge}>Current plan</Text>
        ) : paid ? (
          <Text style={styles.badge}>Recommended</Text>
        ) : null}
      </View>
      {!!(price ?? display?.price) && (
        <Text style={styles.price}>{price ?? display?.price}</Text>
      )}

      <View style={styles.lines}>
        {lines.map(line => (
          <View key={line.title} style={styles.line}>
            {line.soon ? (
              <Clock size={16} color={colors.textMuted} style={styles.lineIcon} />
            ) : (
              <Check size={16} color={colors.brand} style={styles.lineIcon} />
            )}
            <View style={styles.lineCopy}>
              <Text style={[styles.lineText, line.soon && styles.soonText]}>
                {line.title}
              </Text>
              <Text style={styles.lineBody}>{line.body}</Text>
            </View>
            {line.soon && <Text style={styles.soonTag}>Soon</Text>}
          </View>
        ))}
      </View>

      {paid && !current && (
        <TouchableOpacity
          style={styles.upgrade}
          onPress={onUpgrade}
          disabled={busy}>
          {busy ? (
            <ActivityIndicator color={colors.onBrand} />
          ) : (
            <Text style={styles.upgradeText}>
              Upgrade to {planName(row.plan)}
            </Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const useStyles = makeStyles(c => ({
  root: {flex: 1, backgroundColor: c.background},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontFamily: 'Cormorant Garamond',
    fontSize: 22,
    fontWeight: '600',
    color: c.textPrimary,
  },
  content: {paddingHorizontal: 20, paddingBottom: 40},
  loader: {marginTop: 40},
  section: {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 18,
    padding: 18,
    marginTop: 16,
  },
  sectionHeader: {flexDirection: 'row', alignItems: 'center', gap: 8},
  sectionTitle: {
    fontFamily: 'Cormorant Garamond',
    fontSize: 22,
    fontWeight: '600',
    color: c.textPrimary,
  },
  body: {
    fontFamily: 'DM Sans',
    fontSize: 14,
    lineHeight: 22,
    color: c.textSecondary,
    marginTop: 10,
  },
  label: {fontFamily: 'DM Sans', fontSize: 13, color: c.textMuted},
  currentPlan: {
    fontFamily: 'Cormorant Garamond',
    fontSize: 28,
    fontWeight: '600',
    color: c.textPrimary,
  },
  muted: {fontFamily: 'DM Sans', fontSize: 13, color: c.textMuted},
  meters: {gap: 14, marginTop: 16},
  meterText: {
    fontFamily: 'DM Sans',
    fontSize: 14,
    color: c.text,
    marginBottom: 6,
  },
  meterTextFull: {color: c.danger},
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: c.surfaceMuted,
    overflow: 'hidden',
  },
  fill: {height: 6, borderRadius: 3, backgroundColor: c.brand},
  fillFull: {backgroundColor: c.danger},
  planCard: {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 14,
    padding: 18,
    marginTop: 16,
  },
  planCardPaid: {borderColor: c.brand, backgroundColor: c.brandSoft},
  planTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planName: {
    fontFamily: 'Cormorant Garamond',
    fontSize: 22,
    fontWeight: '600',
    color: c.textPrimary,
  },
  badge: {
    fontFamily: 'DM Sans',
    fontSize: 12,
    color: c.onBrand,
    backgroundColor: c.brand,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    overflow: 'hidden',
  },
  price: {
    fontFamily: 'DM Sans',
    fontSize: 18,
    fontWeight: '700',
    color: c.brand,
    marginTop: 6,
  },
  lines: {gap: 14, marginTop: 14},
  line: {flexDirection: 'row', alignItems: 'flex-start', gap: 10},
  lineIcon: {marginTop: 2},
  lineCopy: {flex: 1, gap: 2},
  lineText: {
    fontFamily: 'DM Sans',
    fontSize: 14,
    fontWeight: '600',
    color: c.text,
  },
  lineBody: {
    fontFamily: 'DM Sans',
    fontSize: 13,
    lineHeight: 18,
    color: c.textSecondary,
  },
  soonText: {color: c.textMuted},
  soonTag: {
    fontFamily: 'DM Sans',
    fontSize: 11,
    color: c.textMuted,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  upgrade: {
    marginTop: 20,
    backgroundColor: c.brand,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  legal: {
    fontFamily: 'DM Sans',
    fontSize: 12,
    lineHeight: 18,
    color: c.textMuted,
    marginTop: 20,
  },
  links: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 14,
  },
  link: {
    fontFamily: 'DM Sans',
    fontSize: 14,
    color: c.brand,
    textDecorationLine: 'underline',
  },
  upgradeText: {
    fontFamily: 'DM Sans',
    fontSize: 16,
    fontWeight: '600',
    color: c.onBrand,
  },
}));

export default ShoppingScreen;
