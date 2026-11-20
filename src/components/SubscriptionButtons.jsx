import React, { useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { purchaseDateLockedPlus } from "@/lib/googlePlayBilling";

export default function SubscriptionButtons() {
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const isAndroid =
    Capacitor.isNativePlatform() &&
    Capacitor.getPlatform() === "android";

  async function handleSubscribe(plan) {
    if (loadingPlan) return;

    setLoadingPlan(plan);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      if (!isAndroid) {
        throw new Error(
          "Subscriptions are available in the Date-Locked Android app."
        );
      }

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        throw new Error(
          "Please sign in to Date-Locked before subscribing."
        );
      }

      // Open the native Google Play purchase flow.
      const purchase = await purchaseDateLockedPlus(plan);

      if (!purchase?.purchaseToken) {
        throw new Error(
          "Google Play did not return a purchase token."
        );
      }

      // Send the purchase token to the trusted backend.
      // Google Play verification and Premium activation
      // happen in the deployed Edge Function.
      const { data, error } = await supabase.functions.invoke(
        "verify-google-play-subscription",
        {
          body: {
            purchaseToken: purchase.purchaseToken,
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (error) {
        let message = "Subscription verification failed.";

        if (error.context?.json) {
          try {
            const details = await error.context.json();
            message = details?.error || message;
          } catch {
            // Keep the default message.
          }
        }

        throw new Error(message);
      }

      if (!data?.verified) {
        throw new Error(
          data?.error || "Google Play purchase was not verified."
        );
      }

      if (data.acknowledged === false) {
        throw new Error(
          "Payment was verified, but Google Play acknowledgement is pending. Please retry verification."
        );
      }

      setSuccessMessage(
        "Date-Locked Plus activated successfully."
      );

      // Notify the app that subscription data changed.
      window.dispatchEvent(
        new CustomEvent("datelocked:subscription-updated", {
          detail: {
            plan: data.plan,
            expiresAt: data.expiresAt,
            activatedPartnerCount:
              data.activatedPartnerCount,
          },
        })
      );
    } catch (error) {
      console.error("Subscription error:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to complete the subscription."
      );
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <div className="space-y-3">
      <Button
        type="button"
        disabled={loadingPlan !== null || !isAndroid}
        onClick={() => handleSubscribe("monthly")}
        className="h-11 w-full rounded-[14px] bg-gradient-to-r from-purple-600 to-pink-600 text-white"
      >
        {loadingPlan === "monthly"
          ? "Processing monthly subscription..."
          : "Subscribe Monthly - R39"}
      </Button>

      <Button
        type="button"
        disabled={loadingPlan !== null || !isAndroid}
        onClick={() => handleSubscribe("yearly")}
        variant="outline"
        className="h-11 w-full rounded-[14px] border-purple-200 bg-white"
      >
        {loadingPlan === "yearly"
          ? "Processing yearly subscription..."
          : "Subscribe Yearly - R397.80"}
      </Button>

      {!isAndroid && (
        <p className="text-center text-xs text-gray-500">
          Google Play subscriptions are available in the
          Android app.
        </p>
      )}

      {errorMessage && (
        <p role="alert" className="text-sm text-red-600">
          {errorMessage}
        </p>
      )}

      {successMessage && (
        <p role="status" className="text-sm text-green-700">
          {successMessage}
        </p>
      )}
    </div>
  );
}
