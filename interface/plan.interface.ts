// Mirrors be/src/billing (features.ts, PlanService.usage / plans).
export type FeatureKey =
  | 'room.active'
  | 'design.create'
  | 'note.active'
  | 'community.save'
  | 'moodboard.active'
  | 'community.post'
  | 'export.watermark_free';

export type LimitPeriod = 'atOnce' | 'lifetime' | 'month' | 'flag';

export interface IFeatureUsage {
  used: number;
  limit: number | null; // null = unlimited
  period: LimitPeriod | null;
  allowed: boolean;
}

export interface IUsage {
  plan: string;
  plan_expires_at: string | null;
  // false until launch: nothing is blocked yet
  enforced: boolean;
  features: Partial<Record<FeatureKey, IFeatureUsage>>;
  // Our id for this user in RevenueCat (their Supabase user id)
  app_user_id: string;
}

export interface IPlanRow {
  plan: string;
  features: Partial<
    Record<FeatureKey, {max: number | null; period: LimitPeriod}>
  >;
}
