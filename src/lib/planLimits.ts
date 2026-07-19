import { getSupabaseClient } from './supabase';

export const PLAN_LIMITS = {
  starter: { apps: 1, competitors: 1 },
  growth: { apps: 3, competitors: 5 },
  pro: { apps: 10, competitors: 15 },
};

export async function getUserPlanLimits(cookies: any) {
  try {
    const supabase = getSupabaseClient(cookies);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { plan: 'starter', limits: PLAN_LIMITS.starter };
    }

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('plan, status')
      .eq('user_id', user.id)
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
