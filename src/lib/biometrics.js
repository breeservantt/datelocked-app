import { Capacitor } from "@capacitor/core";
import { NativeBiometric } from "capacitor-native-biometric";

export const isBiometricAvailable = async () => {
  if (!Capacitor.isNativePlatform()) return false;

  try {
    const result = await NativeBiometric.isAvailable();
    return result.isAvailable === true;
  } catch (error) {
    console.error("Biometric availability check failed:", error);
    return false;
  }
};

export const verifyBiometric = async () => {
  if (!Capacitor.isNativePlatform()) {
    throw new Error("Biometric authentication requires the Android app.");
  }

  const available = await isBiometricAvailable();

  if (!available) {
    throw new Error(
      "Biometric authentication is unavailable. Set up fingerprint or face authentication in your phone settings."
    );
  }

  await NativeBiometric.verifyIdentity({
    reason: "Unlock Date-Locked",
    title: "Date-Locked Security",
    subtitle: "Verify your identity",
    description: "Use your fingerprint or face to continue.",
    maxAttempts: 3,
    useFallback: false,
  });

  return true;
};