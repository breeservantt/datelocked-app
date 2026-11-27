import { createClient } from "npm:@supabase/supabase-js@2";
import { GoogleAuth } from "npm:google-auth-library@9.15.1";

const PRODUCT_ID = "datelocked_plus";
const PACKAGE_NAME = "com.datelocked.app";

const ALLOWED_PLANS = ["monthly", "yearly"];

const ALLOWED_STATES = [
  "SUBSCRIPTION_STATE_ACTIVE",
  "SUBSCRIPTION_STATE_IN_GRACE_PERIOD",
  "SUBSCRIPTION_STATE_CANCELED",
];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function reply(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: corsHeaders,
  });
}

async function hashToken(value: string) {
  const encoded = new TextEncoder().encode(value);

  const digest = await crypto.subtle.digest(
    "SHA-256",
    encoded
  );

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return reply({ error: "Method not allowed" }, 405);
  }

  try {
    const authorization = req.headers.get("Authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return reply({ error: "Authentication required" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const googleCredentials = Deno.env.get(
      "GOOGLE_PLAY_SERVICE_ACCOUNT"
    );

    if (
      !supabaseUrl ||
      !anonKey ||
      !serviceKey ||
      !googleCredentials
    ) {
      return reply({ error: "Missing server configuration" }, 500);
    }

    // Authenticate the Date-Locked account.
    const jwt = authorization.substring(7);

    const supabase = createClient(supabaseUrl, anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: userData, error: userError } =
      await supabase.auth.getUser(jwt);

    if (userError || !userData.user) {
      return reply({ error: "Invalid user session" }, 401);
    }

    const userId = userData.user.id;

    // Validate the purchase token.
    const body = await req.json().catch(() => null);
    const purchaseToken = body?.purchaseToken;

    if (
      typeof purchaseToken !== "string" ||
      purchaseToken.length < 10 ||
      purchaseToken.length > 4096
    ) {
      return reply({ error: "Invalid purchase token" }, 400);
    }

    // Authenticate with Google Play Developer API.
    const credentials = JSON.parse(googleCredentials);

    const googleAuth = new GoogleAuth({
      credentials,
      scopes: [
        "https://www.googleapis.com/auth/androidpublisher",
      ],
    });

    const googleClient = await googleAuth.getClient();
    const accessToken = (
      await googleClient.getAccessToken()
    ).token;

    if (!accessToken) {
      return reply(
        { error: "Google Play authentication failed" },
        502
      );
    }

    const baseUrl =
      "https://androidpublisher.googleapis.com/androidpublisher/v3" +
      `/applications/${PACKAGE_NAME}`;

    // Verify purchase directly with Google Play.
    const verifyResponse = await fetch(
      `${baseUrl}/purchases/subscriptionsv2/tokens/` +
        encodeURIComponent(purchaseToken),
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!verifyResponse.ok) {
      console.error(
        "Google Play verification failed:",
        verifyResponse.status
      );

      return reply(
        { error: "Google Play could not verify this purchase" },
        400
      );
    }

    const subscription = await verifyResponse.json();

    if (!ALLOWED_STATES.includes(subscription.subscriptionState)) {
      return reply(
        { error: "Subscription is not active" },
        403
      );
    }

    const lineItem = subscription.lineItems?.find(
      (item: any) =>
        item.productId === PRODUCT_ID &&
        ALLOWED_PLANS.includes(
          item.offerDetails?.basePlanId
        ) &&
        typeof item.expiryTime === "string" &&
        new Date(item.expiryTime).getTime() > Date.now()
    );

    if (!lineItem) {
      return reply(
        { error: "Valid Date-Locked Plus plan not found" },
        403
      );
    }

    const expiresAt = new Date(lineItem.expiryTime);

    const acknowledged =
      subscription.acknowledgementState ===
      "ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED";

    const purchaseTokenHash = await hashToken(purchaseToken);

    // Service-role database access is server-side only.
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Atomic database operation:
    // register purchase and activate eligible profiles.
    const { data: activation, error: activationError } =
      await admin.rpc(
        "activate_google_play_couple_subscription",
        {
          p_user_id: userId,
          p_purchase_token_hash: purchaseTokenHash,
          p_product_id: PRODUCT_ID,
          p_base_plan_id: lineItem.offerDetails.basePlanId,
          p_subscription_status: subscription.subscriptionState,
          p_expires_at: expiresAt.toISOString(),
          p_acknowledged: acknowledged,
        }
      );

    if (activationError) {
      console.error(
        "Atomic subscription activation failed:",
        activationError.code,
        activationError.message
      );

      return reply(
        { error: "Unable to activate Date-Locked Plus" },
        409
      );
    }

    const activationResult = activation?.[0];

    if (
      !activationResult ||
      ![1, 2].includes(
        activationResult.activated_partner_count
      )
    ) {
      return reply(
        { error: "Subscription activation was not confirmed" },
        500
      );
    }

    // Acknowledge the verified purchase after database activation.
    // Never report successful acknowledgement unless Google confirms it.
    let finalAcknowledged = acknowledged;

    if (!acknowledged) {
      const ackResponse = await fetch(
        `${baseUrl}/purchases/subscriptions/` +
          `${PRODUCT_ID}/tokens/` +
          `${encodeURIComponent(purchaseToken)}:acknowledge`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        }
      );

      if (!ackResponse.ok) {
        console.error(
          "Google Play acknowledgement failed:",
          ackResponse.status,
          await ackResponse.text()
        );

        return reply(
          {
            verified: true,
            acknowledged: false,
            error: "Google Play acknowledgement failed",
          },
          502
        );
      }

      finalAcknowledged = true;

      const { error: ackUpdateError } = await admin
        .from("google_play_subscriptions")
        .update({
          acknowledged: true,
          updated_at: new Date().toISOString(),
        })
        .eq("purchase_token_hash", purchaseTokenHash)
        .eq("user_id", userId);

      if (ackUpdateError) {
        console.error(
          "Acknowledgement database update failed:",
          ackUpdateError.code
        );
      }
    }

    return reply({
      verified: true,
      acknowledged: finalAcknowledged,
      productId: PRODUCT_ID,
      plan: lineItem.offerDetails.basePlanId,
      expiresAt: expiresAt.toISOString(),
      subscriptionState: subscription.subscriptionState,
      coupleId: activationResult.activated_couple_id,
      activatedPartnerCount:
        activationResult.activated_partner_count,
    });
  } catch (error) {
    console.error(
      "Subscription verification error:",
      error instanceof Error
        ? error.message
        : "Unknown error"
    );

    return reply(
      { error: "Subscription verification failed" },
      500
    );
  }
});
