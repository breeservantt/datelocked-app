import React from "react";
import { useNavigate } from "react-router-dom";

export default function Terms() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f7f1f4] px-3 py-3 pb-24">
      <div className="mx-auto w-full max-w-[390px]">

        {/* Back */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-3 flex h-[44px] w-full items-center justify-center rounded-[14px] bg-white text-sm font-medium text-slate-700 shadow-[0_4px_12px_rgba(15,23,42,0.06)]"
        >
          Back
        </button>

        {/* Card */}
        <div className="rounded-[16px] border border-slate-200 bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.06)]">

          <h1 className="text-[20px] font-semibold text-slate-800">
            Terms of Use
          </h1>

          <p className="mt-1 text-xs text-slate-500">
            Last updated: January 16, 2026
          </p>

          <div className="mt-4 space-y-4 text-sm leading-6 text-slate-600">

            <p>
              These Terms of Use (“Terms”) govern your access to and use of the
              Date-Locked mobile application (“App”). By using the App, you agree
              to these Terms. If you do not agree, you must not use the App.
            </p>

            <h2 className="font-semibold text-slate-800">1. Eligibility</h2>
            <p>
              You must be at least 18 years old to use Date-Locked. By using the App,
              you confirm that you meet this requirement.
            </p>

            <h2 className="font-semibold text-slate-800">2. Account Responsibilities</h2>
            <ul className="list-disc pl-5">
              <li>You must provide accurate and current information.</li>
              <li>You are responsible for maintaining account security.</li>
              <li>You must not share login credentials, OTPs, or access codes.</li>
              <li>You are responsible for all activity under your account.</li>
            </ul>

            <h2 className="font-semibold text-slate-800">3. Relationship Features</h2>
            <p>
              Date-Locked enables relationship-based features such as partner linking,
              shared memories, goals, events, and chat. When connected to a partner,
              certain data becomes shared between both users.
            </p>

            <h2 className="font-semibold text-slate-800">4. User Content</h2>
            <p>
              You retain ownership of content you upload. By uploading content, you
              grant Date-Locked a limited license to store, display, process, and
              moderate such content to operate the App.
            </p>

            <h2 className="font-semibold text-slate-800">5. Data Collection and Use</h2>
            <p>
              The App collects and uses information necessary to provide services,
              including account data, relationship data, uploaded content, and usage
              data. This data is used for functionality, security, moderation, and
              performance improvements.
            </p>
            <p>
              Full details on how personal data is collected, processed, stored, and
              shared are described in the Privacy Policy.
            </p>

            <h2 className="font-semibold text-slate-800">6. Content Policy</h2>
            <p>You agree not to upload or share:</p>
            <ul className="list-disc pl-5">
              <li>Explicit or sexual content</li>
              <li>Content involving minors</li>
              <li>Harassment, threats, or abuse</li>
              <li>Violent or illegal content</li>
              <li>Misleading or harmful material</li>
            </ul>

            <h2 className="font-semibold text-slate-800">7. Moderation</h2>
            <p>
              Content may be reviewed using automated systems, AI moderation, and
              manual review. We may remove content or restrict accounts at our
              discretion.
            </p>

            <h2 className="font-semibold text-slate-800">8. Acceptable Use</h2>
            <ul className="list-disc pl-5">
              <li>No unlawful use of the App</li>
              <li>No attempts to hack or disrupt the system</li>
              <li>No impersonation or misuse</li>
            </ul>

            <h2 className="font-semibold text-slate-800">9. Payments</h2>
            <p>
              Paid features may be processed through Google Play or other approved
              payment systems. Subscription terms and refunds are governed by the
              Refund Policy.
            </p>

            <h2 className="font-semibold text-slate-800">10. Account Termination</h2>
            <p>
              We may suspend or terminate accounts for violations, abuse, or security
              risks. Users may deactivate their account at any time.
            </p>

            <h2 className="font-semibold text-slate-800">11. Security</h2>
            <p>
              We implement reasonable security measures including encryption,
              authentication, and access controls. Future updates may include
              biometric authentication supported by Android systems.
            </p>

            <h2 className="font-semibold text-slate-800">12. International Data Compliance</h2>
            <p>
              Date-Locked may process data globally. We aim to comply with applicable
              international data protection laws, including:
            </p>
            <ul className="list-disc pl-5">
              <li>GDPR (European Union)</li>
              <li>POPIA (South Africa)</li>
              <li>Other applicable regional data protection regulations</li>
            </ul>
            <p>
              By using the App, you consent to the transfer and processing of your
              data across jurisdictions where our services operate.
            </p>

            <h2 className="font-semibold text-slate-800">13. Intellectual Property</h2>
            <p>
              All app content, branding, design, and functionality belong to
              Date-Locked. You may not reproduce or distribute without permission.
            </p>

            <h2 className="font-semibold text-slate-800">14. Disclaimer</h2>
            <p>
              The App is provided “as is” without guarantees of availability,
              reliability, or performance.
            </p>

            <h2 className="font-semibold text-slate-800">15. Limitation of Liability</h2>
            <p>
              We are not liable for indirect damages, data loss, or user interactions.
            </p>

            <h2 className="font-semibold text-slate-800">16. Changes to Terms</h2>
            <p>
              We may update these Terms. Continued use means acceptance.
            </p>

            <h2 className="font-semibold text-slate-800">17. Governing Law</h2>
            <p>
              These Terms are governed by applicable laws in your jurisdiction.
            </p>

            <h2 className="font-semibold text-slate-800">18. Contact</h2>
            <p>
              For questions, contact us through the app support channels.
            </p>

          </div>
        </div>
      </div>
    </div>
  );
}