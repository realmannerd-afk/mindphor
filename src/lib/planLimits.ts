import { getSupabaseClient } from './supabase';

export const PLAN_LIMITS = {
  starter: { apps: 1, competitors: 1, appStoreReviewsPerMonth: 200 },
  growth: { apps: 3, competitors: 5, appStoreReviewsPerMonth: 1000 },
  pro: { apps: 10, competitors: 15, appStoreReviewsPerMonth: 3000 },
};

export async function getUserPlanLimits(cookies: any, overrideSupabase?: any, overrideUserId?: string) {
  try {
    const supabase = overrideSupabase || getSupabaseClient(cookies);
    let userId = overrideUserId;
    
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id;
    }
    
    if (!userId) {
      return { plan: 'starter', limits: PLAN_LIMITS.starter };
    }

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('plan, status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (sub && sub.plan && PLAN_LIMITS[sub.plan as keyof typeof PLAN_LIMITS]) {
      return { plan: sub.plan, limits: PLAN_LIMITS[sub.plan as keyof typeof PLAN_LIMITS] };
    }

    return { plan: 'starter', limits: PLAN_LIMITS.starter };
  } catch (error) {
    console.error("Error fetching user plan limits:", error);
    return { plan: 'starter', limits: PLAN_LIMITS.starter }; // Default fallback
  }
}
