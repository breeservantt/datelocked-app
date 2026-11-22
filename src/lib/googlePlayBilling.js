import { Capacitor } from "@capacitor/core";
import { NativePurchases } from "@capgo/native-purchases";

export const PLUS_PRODUCT_ID = "datelocked_plus";

export const PLUS_PLANS = {
  monthly: "monthly",
  yearly: "yearly",
};

export async function purchaseDateLockedPlus(plan) {
  if (!Capacitor.isNativePlatform() ||
      Capacitor.getPlatform() !== "android") {
    throw new Error(
      "Google Play subscriptions are available in the Android app."
    );
  }

  if (!Object.hasOwn(PLUS_PLANS, plan)) {
    throw new Error("Invalid subscription plan.");
  }

  const { products } = await NativePurchases.getProducts({
    productIdentifiers: [PLUS_PRODUCT_ID],
    productType: "subs",
  });

  const selectedProduct = products.find(
  (product) =>
    product.identifier === PLUS_PLANS[plan] &&
    product.planIdentifier === PLUS_PRODUCT_ID
);

  if (!selectedProduct) {
    throw new Error(
      "Subscription plan unavailable. Check Google Play Console configuration."
    );
  }

  const transaction = await NativePurchases.purchaseProduct({
    productIdentifier: PLUS_PRODUCT_ID,
    planIdentifier: PLUS_PLANS[plan],
    offerToken: selectedProduct.offerToken,
    productType: "subs",
    autoAcknowledgePurchases: false,
  });

  if (!transaction.purchaseToken) {
    throw new Error("Google Play did not return a purchase token.");
  }

  return {
    productId: PLUS_PRODUCT_ID,
    plan,
    purchaseToken: transaction.purchaseToken,
    purchaseState: transaction.purchaseState,
  };
}
