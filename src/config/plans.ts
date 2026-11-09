// How plans and limits are described in the app. The numbers come from the
// server (plan_limits table); only the wording lives here.
import {
  FeatureKey,
  IFeatureUsage,
  LimitPeriod,
} from '../../interface/plan.interface';

export const PLAN_DISPLAY: Record<
  string,
  {name: string; price: string; comingSoon: string[]; perks: string[]}
> = {
  casual: {
    name: 'Casual',
    price: '$0',
    perks: ['Browse and like community designs', 'Exports carry a watermark'],
    comingSoon: ['Basic AI decor assistant'],
  },
  hobbyist: {
    name: 'Hobbyist',
    // Placeholder until the App Store price shows (payments step)
    price: '$9.99/month',
    perks: ['Priority support badge'],
    comingSoon: [
      'Pro AI decor assistant',
      '360° panoramas & walk-throughs',
      'Automated shopping list',
      'Comment in the community gallery',
    ],
  },
  professional: {
    name: 'Professional',
    price: '',
    perks: [],
    comingSoon: [],
  },
};

export const planName = (plan: string) =>
  PLAN_DISPLAY[plan]?.name ?? plan.charAt(0).toUpperCase() + plan.slice(1);

// Singular / plural noun for counted features.
const NOUNS: Partial<Record<FeatureKey, [string, string]>> = {
  'room.active': ['room', 'rooms'],
  'design.create': ['design', 'designs'],
  'note.active': ['note', 'notes'],
  'community.save': ['saved community design', 'saved community designs'],
  'export.watermark_free': [
    'export without a watermark',
    'exports without a watermark',
  ],
};

const noun = (feature: FeatureKey, n: number) => {
  const [one, many] = NOUNS[feature] ?? ['use', 'uses'];
  return n === 1 ? one : many;
};

// One line on a plan card, e.g. "Up to 3 rooms", "10 designs a month".
export function featureLine(
  feature: FeatureKey,
  max: number | null,
  period: LimitPeriod,
): string | null {
  if (feature === 'community.post') {
    return max === 0 ? null : 'Post your designs to the community';
  }
  if (feature === 'export.watermark_free') {
    if (max === null) {
      return 'Export without watermarks';
    }
    return max === 0 ? null : `${max} ${noun(feature, max)}`;
  }
  if (max === null) {
    const [, many] = NOUNS[feature] ?? ['', 'uses'];
    return `Unlimited ${many}`;
  }
  const n = `${max} ${noun(feature, max)}`;
  switch (period) {
    case 'atOnce':
      return `Up to ${n}`;
    case 'month':
      return `${n} a month`;
    default:
      return n;
  }
}

// "2 of 3 rooms" (null when there's no number to show)
export function usageLine(
  feature: FeatureKey,
  usage: IFeatureUsage | undefined,
): string | null {
  if (!usage || usage.limit === null || usage.period === 'flag') {
    return null;
  }
  const suffix = usage.period === 'month' ? ' this month' : '';
  return `${usage.used} of ${usage.limit} ${noun(feature, usage.limit)}${suffix}`;
}

// The upgrade sheet's title and message when a limit is hit.
export function limitMessage(
  feature: string | undefined,
  usage?: {used?: number; limit?: number | null},
): {title: string; body: string} {
  const f = feature as FeatureKey | undefined;
  switch (f) {
    case 'room.active':
      return {
        title: 'You’ve used all your rooms',
        body: `Your plan has room for ${usage?.limit ?? 'a few'} rooms. Upgrade for more, or delete a room you no longer need.`,
      };
    case 'design.create':
      return {
        title: 'You’ve used your designs',
        body: `You’ve made ${usage?.used ?? 'all your'} of ${usage?.limit ?? ''} designs on your plan. Upgrade to keep designing.`,
      };
    case 'note.active':
      return {
        title: 'Notes are full',
        body: 'Upgrade for more notes, or delete one you no longer need.',
      };
    case 'community.save':
      return {
        title: 'Your mood board is full',
        body: 'Upgrade to save more community designs, or remove one first.',
      };
    case 'community.post':
      return {
        title: 'Share with the community',
        body: 'Posting your designs to Explore is part of the Hobbyist plan.',
      };
    case 'export.watermark_free':
      return {
        title: 'Export without the watermark',
        body: 'Upgrade to export all your designs without a watermark.',
      };
    default:
      return {
        title: 'Upgrade to open this room',
        body: 'This room was saved over your plan’s room limit. Upgrade, or delete another room to open it.',
      };
  }
}
