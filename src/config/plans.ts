// How plans and limits are described in the app. The numbers come from the
// server (plan_limits table); only the wording lives here.
import {FeatureKey, IFeatureUsage} from '../../interface/plan.interface';

// One line on a plan card: a title and a short description under it.
export type CardLine = {
  // When set, the title's number is this feature's limit on the plan,
  // read from the server. A limit of 0 hides the line.
  feature?: FeatureKey;
  // Gets the limit (null = unlimited) when `feature` is set.
  title: string | ((max: number | null) => string);
  body: string;
  // Not built yet: shown muted with a "Soon" tag.
  soon?: boolean;
};

// "Up to 3 rooms", or the unlimited wording when there's no limit.
const upTo =
  (text: (n: number) => string, unlimited: string) =>
  (max: number | null) =>
    max === null ? unlimited : text(max);

export const PLAN_DISPLAY: Record<
  string,
  {name: string; price: string; lines: CardLine[]}
> = {
  casual: {
    name: 'Casual',
    price: '$0',
    lines: [
      {
        feature: 'room.active',
        title: upTo(n => `Add up to ${n} rooms`, 'Add unlimited rooms'),
        body: 'Scan Your Space, Or Enter Its Measurements By Hand.',
      },
      {
        feature: 'design.create',
        title: upTo(n => `Make up to ${n} designs`, 'Make unlimited designs'),
        body: 'Try Furniture And Layouts In Your Room Before You Commit.',
      },
      {
        feature: 'note.active',
        title: upTo(
          n => `Keep up to ${n} project notes`,
          'Keep unlimited project notes',
        ),
        body: 'Capture Your Measurements, Ideas, And Reminders.',
      },
      {
        feature: 'moodboard.active',
        title: upTo(
          n => `Create up to ${n} mood boards`,
          'Create unlimited mood boards',
        ),
        body: 'Organize Your Inspiration For Each Project.',
      },
      {
        feature: 'community.save',
        title: upTo(
          n => `Save up to ${n} community designs`,
          'Save unlimited community designs',
        ),
        body: 'Keep Your Favourite Ideas For Later.',
      },
      {
        title: 'Browse the Community Gallery',
        body: 'Find Ideas From Homeowners Planning Spaces Like Yours.',
      },
      {
        feature: 'export.watermark_free',
        title: upTo(
          n =>
            n === 1
              ? 'Export one design without watermark'
              : `Export ${n} designs without watermark`,
          'Export without watermarks',
        ),
        body: 'Download One Of Your Completed Designs Without A Watermark.',
      },
    ],
  },
  hobbyist: {
    name: 'Hobbyist',
    // Placeholder until the App Store price shows (payments step)
    price: '$9.99/month',
    lines: [
      {
        feature: 'room.active',
        title: upTo(
          n => `Add up to ${n} rooms in total`,
          'Add unlimited rooms',
        ),
        body: 'Scan Your Rooms, Or Enter Their Measurements By Hand.',
      },
      {
        feature: 'design.create',
        title: upTo(
          n => `Make up to ${n} designs each month`,
          'Make unlimited designs',
        ),
        body: 'Plan The Look Of Every Room Before You Spend Anything.',
      },
      {
        feature: 'note.active',
        title: upTo(
          n => `Keep up to ${n} project notes`,
          'Keep unlimited project notes',
        ),
        body: 'Store Your Measurements, Reminders, And Planning Decisions.',
      },
      {
        feature: 'moodboard.active',
        title: upTo(
          n => `Create up to ${n} mood boards`,
          'Create unlimited mood boards',
        ),
        body: 'Keep Your Inspiration Organized For Every Project.',
      },
      {
        title: 'Explore designs in 360°',
        body: 'See Your Room From Every Angle Before You Make Changes.',
        soon: true,
      },
      {
        feature: 'community.save',
        title: upTo(
          n => `Save up to ${n} community designs`,
          'Save unlimited community designs',
        ),
        body: 'Build Your Own Library Of Ideas.',
      },
      {
        title: 'Browse the Community Gallery',
        body: 'Learn From Projects Shared By Homeowners Like You.',
      },
      {
        title: 'Generate a shopping list from each design',
        body: 'Turn Your Design Into Items, Quantities, And Estimated Prices.',
        soon: true,
      },
      {
        title: 'Priority support',
        body: 'Get Help Sooner Whenever You Need It.',
      },
      {
        feature: 'export.watermark_free',
        title: upTo(
          n => `Export ${n} designs without watermarks`,
          'Export without watermarks',
        ),
        body: 'Download And Share Your Work Without PlaDomus Branding.',
      },
    ],
  },
  professional: {
    name: 'Professional',
    price: '',
    lines: [],
  },
};

// The card's lines for a plan, with numbers filled in from its limits.
// A feature with no limit row is unlimited; one limited to 0 is left out.
export function cardLines(
  plan: string,
  limits: Partial<Record<FeatureKey, {max: number | null}>>,
): {title: string; body: string; soon: boolean}[] {
  return (PLAN_DISPLAY[plan]?.lines ?? []).flatMap(line => {
    const max = line.feature ? limits[line.feature]?.max ?? null : null;
    if (line.feature && max === 0) {
      return [];
    }
    const title =
      typeof line.title === 'function' ? line.title(max) : line.title;
    return [{title, body: line.body, soon: !!line.soon}];
  });
}

export const planName = (plan: string) =>
  PLAN_DISPLAY[plan]?.name ?? plan.charAt(0).toUpperCase() + plan.slice(1);

// Singular / plural noun for counted features.
const NOUNS: Partial<Record<FeatureKey, [string, string]>> = {
  'room.active': ['room', 'rooms'],
  'design.create': ['design', 'designs'],
  'note.active': ['note', 'notes'],
  'community.save': ['saved community design', 'saved community designs'],
  'moodboard.active': ['mood board', 'mood boards'],
  'export.watermark_free': [
    'export without a watermark',
    'exports without a watermark',
  ],
};

const noun = (feature: FeatureKey, n: number) => {
  const [one, many] = NOUNS[feature] ?? ['use', 'uses'];
  return n === 1 ? one : many;
};

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
        title: 'You’ve saved all the designs you can',
        body: 'Upgrade to save more community designs, or remove one first.',
      };
    case 'moodboard.active':
      return {
        title: 'You’ve used all your mood boards',
        body: `Your plan has room for ${usage?.limit ?? 'a few'} mood boards. Upgrade for more, or delete a board you no longer need.`,
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
