
import { Capacitor } from "@capacitor/core";
import { supabase } from "./supabase";

export async function startGoogleSignIn() {
  const isNative = Capacitor.isNativePlatform();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: isNative
        ? "com.datelocked.app://auth"
        : `${window.location.origin}/auth/callback`,
      queryParams: {
        prompt: "select_account",
      },
      ...(isNative ? { skipBrowserRedirect: true } : {}),
    },
  });

  if (error) throw error;

  if (isNative) {
    if (!data?.url) {
      throw new Error("Google sign-in did not return a login URL.");
    }

    const { Browser } = await import("@capacitor/browser");
    await Browser.open({ url: data.url });
  }

  return data;
}

export async function getAuthenticatedDestination(user) {
  if (!user?.id) {
    throw new Error("No authenticated user was found.");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(
      "full_name, date_of_birth, gender, location, account_status, deactivated_at"
    )
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;

  if (
    profile?.account_status === "deactivated" ||
    Boolean(profile?.deactivated_at)
  ) {
    await supabase.auth.signOut();
    throw new Error("This account has been deactivated.");
  }

  const profileComplete = Boolean(
    profile?.full_name?.trim() &&
    profile?.date_of_birth &&
    profile?.gender &&
    profile?.location
  );

  return profileComplete ? "/home" : "/onboarding";
}
