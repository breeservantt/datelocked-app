import { supabase } from "@/lib/supabase";

export const FEATURE_KEYS = {
  MEMORY_POST: "memory_post",
  DATING_WALL_POST: "dating_wall_post",
  VERIFY_STATUS: "verify_status",
  NIGHTIN_BONUS: "nightin_bonus",
  GOAL_CREATED: "goal_created",
};

export const FREE_LIMITS = {
  [FEATURE_KEYS.MEMORY_POST]: 2,
  [FEATURE_KEYS.DATING_WALL_POST]: 2,
  [FEATURE_KEYS.VERIFY_STATUS]: 2,
  [FEATURE_KEYS.NIGHTIN_BONUS]: 2,
  [FEATURE_KEYS.GOAL_CREATED]: 3,
};

export const POINTS = {
  [FEATURE_KEYS.MEMORY_POST]: 10,
  [FEATURE_KEYS.DATING_WALL_POST]: 15,
  [FEATURE_KEYS.VERIFY_STATUS]: 20,
  [FEATURE_KEYS.NIGHTIN_BONUS]: 10,
  [FEATURE_KEYS.GOAL_CREATED]: 10,
};

export async function checkDailyLimit(featureKey) {
  const freeLimit = FREE_LIMITS[featureKey];

  if (!freeLimit) {
    throw new Error(`Missing free limit for ${featureKey}`);
  }

  const { data, error } = await supabase.rpc("check_daily_limit", {
    p_feature_key: featureKey,
    p_free_limit: freeLimit,
  });

  if (error) throw error;
  return data;
}

export async function consumeDailyLimit(featureKey) {
  const freeLimit = FREE_LIMITS[featureKey];

  if (!freeLimit) {
    throw new Error(`Missing free limit for ${featureKey}`);
  }

  const { data, error } = await supabase.rpc("consume_daily_limit", {
    p_feature_key: featureKey,
    p_free_limit: freeLimit,
  });

  if (error) throw error;
  return data;
}

export async function awardCouplePoints(featureKey, reason = "") {
  const points = POINTS[featureKey] || 0;

  if (!points) {
    return {
      success: false,
      reason: "no_points_configured",
    };
  }

  const { data, error } = await supabase.rpc("award_couple_points", {
    p_feature_key: featureKey,
    p_points: points,
    p_reason: reason,
  });

  if (error) throw error;
  return data;
}

export async function getMonetizationProfile() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("subscription_tier, premium_until, couple_points, badge_level")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;

  return {
    subscription_tier: data?.subscription_tier || "free",
    premium_until: data?.premium_until || null,
    couple_points: data?.couple_points || 0,
    badge_level: data?.badge_level || "Starter",
    isPremium:
      data?.subscription_tier === "premium" &&
      (!data?.premium_until || new Date(data.premium_until) > new Date()),
  };
}