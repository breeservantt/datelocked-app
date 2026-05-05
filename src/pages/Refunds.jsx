import React from "react";
import { useNavigate } from "react-router-dom";

export default function Refunds() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f7f1f4] px-3 py-3 pb-24">
      <div className="mx-auto w-full max-w-[390px]">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-3 flex h-[44px] w-full items-center justify-center rounded-[14px] bg-white text-sm font-medium text-slate-700 shadow-[0_4px_12px_rgba(15,23,42,0.06)]"
        >
          Back
        </button>

        <div className="rounded-[16px] border border-slate-200 bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.06)]">
          <h1 className="text-[20px] font-semibold text-slate-800">
            Refund Policy
          </h1>

          <p className="mt-1 text-xs text-slate-500">
            Last updated: January 16, 2026
          </p>

          <div className="mt-4 space-y-4 text-sm leading-6 text-slate-600">
            <p>
              This Refund Policy explains how refunds, cancellations, subscription
              payments, trial access, and billing disputes are handled for
              Date-Locked. This policy applies to paid features, subscriptions,
              premium access, or any future paid services offered through the app.
            </p>

            <h2 className="font-semibold text-slate-800">1. Billing Provider</h2>
            <p>
              If Date-Locked offers paid subscriptions or premium features through
              the Google Play Store, payments and refunds may be processed through
              Google Play Billing. Google Play may apply its own refund rules,
              timelines, and approval process.
            </p>

            <h2 className="font-semibold text-slate-800">2. Subscription Payments</h2>
            <p>
              Subscription payments may renew automatically unless cancelled before
              the renewal date. Users are responsible for managing subscriptions
              through the payment platform used at the time of purchase.
            </p>

            <h2 className="font-semibold text-slate-800">3. Trial Periods</h2>
            <p>
              Date-Locked may offer free trials or limited promotional access.
              If a trial converts into a paid subscription, the user is responsible
              for cancelling before the trial ends if they do not wish to be charged.
            </p>

            <h2 className="font-semibold text-slate-800">4. Refund Eligibility</h2>
            <p>
              Refunds may be considered where required by law, platform rules, or
              where a valid billing issue occurred. Refund eligibility may include:
            </p>

            <ul className="list-disc pl-5">
              <li>Duplicate payment caused by a technical error.</li>
              <li>Payment taken after confirmed cancellation.</li>
              <li>Material service failure preventing access to paid features.</li>
              <li>Unauthorized payment reported promptly.</li>
              <li>Billing error confirmed by the payment provider.</li>
            </ul>

            <h2 className="font-semibold text-slate-800">5. Non-Refundable Cases</h2>
            <p>
              Refunds may not be granted in the following cases, unless required
              by applicable law or platform rules:
            </p>

            <ul className="list-disc pl-5">
              <li>User changed their mind after purchase.</li>
              <li>User forgot to cancel a subscription before renewal.</li>
              <li>User did not use the app after payment.</li>
              <li>Account was restricted or terminated for policy violations.</li>
              <li>Technical issues caused by the user’s device, network, or storage.</li>
              <li>Partial use of a monthly subscription period.</li>
              <li>Failure to cancel before the next billing cycle.</li>
            </ul>

            <h2 className="font-semibold text-slate-800">6. Cancellation</h2>
            <p>
              Users may cancel a subscription at any time through the payment
              platform used to subscribe. Cancellation usually stops future billing
              but does not automatically refund previous charges.
            </p>

            <h2 className="font-semibold text-slate-800">7. Google Play Refunds</h2>
            <p>
              For purchases made through Google Play, users may need to request a
              refund directly through Google Play. Google may approve or deny refund
              requests based on its own policies and applicable consumer protection
              laws.
            </p>

            <h2 className="font-semibold text-slate-800">8. App Access After Cancellation</h2>
            <p>
              After cancellation, access to paid features may continue until the end
              of the active billing period, unless the payment provider or platform
              rules state otherwise.
            </p>

            <h2 className="font-semibold text-slate-800">9. Account Deactivation</h2>
            <p>
              Deactivating or deleting an account does not automatically cancel an
              active subscription. Users must cancel subscriptions through the
              billing provider or app store where the purchase was made.
            </p>

            <h2 className="font-semibold text-slate-800">10. Policy Violations</h2>
            <p>
              Refunds may be denied where access was restricted because of abuse,
              fraud, harassment, unsafe content, illegal activity, or violation of
              the Terms of Use or Content Policy.
            </p>

            <h2 className="font-semibold text-slate-800">11. Service Credits</h2>
            <p>
              In some cases, Date-Locked may offer service credits, extended access,
              or other remedies instead of a refund. This is at our discretion unless
              a refund is required by law or platform policy.
            </p>

            <h2 className="font-semibold text-slate-800">12. Refund Request Information</h2>
            <p>
              When requesting refund assistance, users may be asked to provide:
            </p>

            <ul className="list-disc pl-5">
              <li>Account email address.</li>
              <li>Payment date.</li>
              <li>Transaction reference or order number.</li>
              <li>Reason for refund request.</li>
              <li>Device or app issue details, if relevant.</li>
            </ul>

            <h2 className="font-semibold text-slate-800">13. Processing Times</h2>
            <p>
              Refund processing times depend on the payment provider, bank, and
              platform used. Approved refunds may take several business days to
              appear in the original payment method.
            </p>

            <h2 className="font-semibold text-slate-800">14. Consumer Protection Rights</h2>
            <p>
              Nothing in this policy limits rights that users may have under
              applicable consumer protection laws, including laws in South Africa,
              the European Union, the United Kingdom, or other applicable regions.
            </p>

            <h2 className="font-semibold text-slate-800">15. Fraud and Abuse</h2>
            <p>
              Date-Locked may refuse refunds, restrict accounts, or investigate
              activity where refund abuse, payment fraud, chargeback misuse, or
              suspicious billing behavior is detected.
            </p>

            <h2 className="font-semibold text-slate-800">16. Changes to This Policy</h2>
            <p>
              We may update this Refund Policy as the app changes, including when
              subscriptions, trial periods, premium features, or payment providers
              are updated.
            </p>

            <h2 className="font-semibold text-slate-800">17. Contact</h2>
            <p>
              Users can contact Date-Locked support through the app support channels
              or official support email once published.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}