import React from "react";
import { useNavigate } from "react-router-dom";

export default function Security() {
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
            Security Policy
          </h1>

          <p className="mt-1 text-xs text-slate-500">
            Last updated: January 16, 2026
          </p>

          <div className="mt-4 space-y-4 text-sm leading-6 text-slate-600">
            <p>
              Date-Locked is designed to protect user accounts, private relationship
              data, uploaded memories, chat activity, goals, events, and shared
              couple experiences. This Security Policy explains the safeguards we
              use and the responsibilities users have when using the app.
            </p>

            <h2 className="font-semibold text-slate-800">1. Security Commitment</h2>
            <p>
              We apply reasonable technical, administrative, and organizational
              safeguards to protect user information against unauthorized access,
              loss, misuse, alteration, disclosure, or destruction.
            </p>

            <h2 className="font-semibold text-slate-800">2. Account Authentication</h2>
            <p>
              Date-Locked uses authenticated access to protect user accounts. Login
              and verification may include secure email OTP, session-based access,
              and account-level verification methods.
            </p>

            <h2 className="font-semibold text-slate-800">3. OTP Security</h2>
            <p>
              One-time passwords or verification codes are used only to confirm
              account access or relationship actions. Users must not share OTPs,
              login links, or verification codes with anyone.
            </p>

            <h2 className="font-semibold text-slate-800">4. PIN Protection</h2>
            <p>
              Users may enable PIN protection inside the app. PIN settings are used
              to add an extra access-control layer for sensitive app areas.
            </p>
            <p>
              PINs should be unique, private, and not reused from banking, email,
              or device lock credentials.
            </p>

            <h2 className="font-semibold text-slate-800">
              5. Planned Biometric Authentication
            </h2>
            <p>
              Date-Locked plans to support biometric authentication when deployed
              through native Android functionality. This may include fingerprint,
              facial recognition, or other Android-supported biometric methods.
            </p>
            <p>
              Date-Locked will not store raw biometric data. Biometric checks will
              be handled by the user’s device operating system. The app will only
              receive confirmation that the biometric authentication succeeded or
              failed.
            </p>

            <h2 className="font-semibold text-slate-800">6. Data Encryption</h2>
            <p>
              Data transmitted between the app and backend services is protected
              using secure encrypted connections such as HTTPS/TLS where supported.
              This helps protect information during login, uploads, profile updates,
              chat activity, and relationship actions.
            </p>

            <h2 className="font-semibold text-slate-800">7. Secure Data Storage</h2>
            <p>
              User profile data, relationship information, uploaded media, goals,
              events, and app activity are stored using secure backend services.
              Access is restricted based on authenticated user identity and app
              permissions.
            </p>

            <h2 className="font-semibold text-slate-800">
              8. Database Access Controls
            </h2>
            <p>
              Date-Locked uses user-based access controls to limit who can view,
              create, update, or delete information. Relationship-linked data should
              only be accessible to authorized users connected through the correct
              relationship or couple profile.
            </p>

            <h2 className="font-semibold text-slate-800">9. File Upload Security</h2>
            <p>
              Uploaded content, including profile photos, memories, videos, and chat
              media, is stored in controlled storage locations. Access may be limited
              by user ownership, relationship status, feature permissions, or app
              security rules.
            </p>

            <h2 className="font-semibold text-slate-800">
              10. Relationship Data Protection
            </h2>
            <p>
              Date-Locked uses relationship status and couple connection logic to
              control access to shared features. Partner-linked data should only be
              shared where a valid Date-Locked relationship connection exists.
            </p>

            <h2 className="font-semibold text-slate-800">11. Chat and Message Security</h2>
            <p>
              Chat features are intended for connected users. Messages and media
              should only be accessible according to account identity, relationship
              permissions, and app access rules.
            </p>

            <h2 className="font-semibold text-slate-800">12. Content Safety</h2>
            <p>
              Date-Locked may use automated systems, AI-supported checks, or manual
              review to detect unsafe, abusive, explicit, illegal, or policy-violating
              content. Content may be removed or restricted where necessary.
            </p>

            <h2 className="font-semibold text-slate-800">
              13. Abuse, Fraud, and Misuse Prevention
            </h2>
            <p>
              We may monitor for suspicious activity, unauthorized access attempts,
              spam, abuse, fraud, account misuse, policy violations, or attempts to
              interfere with app functionality.
            </p>

            <h2 className="font-semibold text-slate-800">14. Account Restrictions</h2>
            <p>
              Accounts may be restricted, suspended, or terminated if security risks,
              abuse, unauthorized access, harmful activity, or policy violations are
              detected.
            </p>

            <h2 className="font-semibold text-slate-800">15. Payment Security</h2>
            <p>
              If paid subscriptions or premium features are enabled, payments will
              be handled by approved payment providers such as Google Play Billing
              or other secure payment systems. Date-Locked does not store full card
              numbers or sensitive payment credentials.
            </p>

            <h2 className="font-semibold text-slate-800">16. Third-Party Providers</h2>
            <p>
              Date-Locked may rely on trusted providers for authentication, database
              hosting, file storage, email delivery, analytics, notifications, and
              payment processing. These providers are expected to apply appropriate
              security controls.
            </p>

            <h2 className="font-semibold text-slate-800">
              17. International Security Standards
            </h2>
            <p>
              Date-Locked aims to follow internationally recognized security
              principles, including data minimization, access limitation, secure
              transmission, user consent, incident response, and protection against
              unauthorized processing.
            </p>

            <h2 className="font-semibold text-slate-800">
              18. Privacy and Data Protection Laws
            </h2>
            <p>
              Where applicable, Date-Locked aims to align its security practices with
              data protection principles found in laws such as South Africa’s POPIA,
              the European Union GDPR, the UK GDPR, and other relevant privacy and
              consumer protection laws.
            </p>

            <h2 className="font-semibold text-slate-800">19. User Responsibilities</h2>
            <ul className="list-disc pl-5">
              <li>Keep your device locked and protected.</li>
              <li>Do not share OTPs, PINs, login links, or access credentials.</li>
              <li>Use strong email account security.</li>
              <li>Log out on shared or public devices.</li>
              <li>Report suspicious activity as soon as possible.</li>
              <li>Do not attempt to bypass app security features.</li>
            </ul>

            <h2 className="font-semibold text-slate-800">20. Security Updates</h2>
            <p>
              We may release updates to improve authentication, fix vulnerabilities,
              strengthen storage rules, improve access controls, support native
              biometrics, or improve overall app security.
            </p>

            <h2 className="font-semibold text-slate-800">21. Incident Response</h2>
            <p>
              If a security incident occurs, we will investigate, take corrective
              action, and notify affected users or authorities where required by
              applicable law or platform rules.
            </p>

            <h2 className="font-semibold text-slate-800">22. Data Retention Security</h2>
            <p>
              Data is retained only as needed for app functionality, account operation,
              legal compliance, safety, dispute handling, or platform requirements.
              Deleted or deactivated account data may be removed or anonymized
              according to applicable policies and legal obligations.
            </p>

            <h2 className="font-semibold text-slate-800">23. Limitations</h2>
            <p>
              No app, device, network, cloud system, or online service can be
              guaranteed to be completely secure. We use reasonable safeguards, but
              users should also take steps to protect their own accounts and devices.
            </p>

            <h2 className="font-semibold text-slate-800">
              24. Reporting Security Concerns
            </h2>
            <p>
              Users can report suspected unauthorized access, vulnerabilities, fraud,
              account misuse, or security concerns through the app support channels
              or official support email once published.
            </p>

            <h2 className="font-semibold text-slate-800">25. Changes to This Policy</h2>
            <p>
              We may update this Security Policy as the app evolves, including when
              native Android biometric authentication, additional payment systems,
              or new security features are introduced.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}