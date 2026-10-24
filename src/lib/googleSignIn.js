import { Capacitor } from "@capacitor/core";
import { SocialLogin } from "@capgo/capacitor-social-login";
import { supabase } from "./supabase";

const WEB_CLIENT_ID =
  "177801329068-bdu53t5lp4ejhionds7fln2ivqv35e0k.apps.googleusercontent.com";

let initializationPromise = null;

export async function loginWithGoogle() {
  // Preserve the existing browser-based login for the website.
  if (!Capacitor.isNativePlatform()) {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          prompt: "select_account",
        },
      },
    });

    if (error) throw error;
    return data;
  }

  // Initialize native Google Sign-In once.
  if (!initializationPromise) {
    initializationPromise = SocialLogin.initialize({
      google: {
        webClientId: WEB_CLIENT_ID,
        mode: "online",
      },
    }).catch((error) => {
      initializationPromise = null;
      throw error;
    });
  }

  await initializationPromise;

  // Android opens Google's native account chooser.
  const response = await SocialLogin.login({
    provider: "google",
    options: {},
  });

  const idToken =
  response?.result && "idToken" in response.result
    ? response.result.idToken
    : null;

  if (!idToken) {
    throw new Error("Google did not return an ID token.");
  }

  // Supabase verifies the Google token and creates a session.
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: "google",
    token: idToken,
  });

  if (error) throw error;

  return data;
}
