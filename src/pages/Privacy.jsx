import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f7f1f4] px-3 py-3 pb-24">
      <div className="mx-auto w-full max-w-[390px]">
        
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="mb-3 flex h-[44px] w-full items-center justify-center rounded-[14px] bg-white text-sm font-medium text-slate-700 shadow-[0_4px_12px_rgba(15,23,42,0.06)]"
        >
          Back
        </button>

        {/* Card */}
        <div className="rounded-[16px] border border-slate-200 bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.06)]">
          
          <h1 className="text-[20px] font-semibold text-slate-800">
            Privacy Policy
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Last updated: January 16, 2026
          </p>

          <div className="mt-4 space-y-4 text-sm text-slate-600 leading-6">

            <p>
              Date-Locked (“we”, “our”, or “us”) operates the Date-Locked mobile application (“App”).
              This Privacy Policy explains how we collect, use, and protect your data.
            </p>

            <h2 className="font-semibold text-slate-800">1. Information We Collect</h2>
            <ul className="list-disc pl-5">
              <li>Name, email, date of birth</li>
              <li>Profile photo and location</li>
              <li>Relationship data and partner info</li>
              <li>Uploaded content (photos, videos, messages)</li>
              <li>Usage and device data</li>
            </ul>

            <h2 className="font-semibold text-slate-800">2. How We Use Data</h2>
            <ul className="list-disc pl-5">
              <li>Provide app features and services</li>
              <li>Enable Date-Locked relationship system</li>
              <li>Improve performance and user experience</li>
              <li>Send notifications</li>
              <li>Prevent fraud and abuse</li>
            </ul>

            <h2 className="font-semibold text-slate-800">3. AI Processing</h2>
            <p>
              AI may be used for content moderation and relationship insights.
              You can disable insights in Settings.
            </p>

            <h2 className="font-semibold text-slate-800">4. Data Sharing</h2>
            <p>
              We do not sell your data. Data may be shared with your partner,
              service providers, or authorities if required by law.
            </p>

            <h2 className="font-semibold text-slate-800">5. Security</h2>
            <p>
              We use secure systems, encryption, and access controls to protect your data.
            </p>

            <h2 className="font-semibold text-slate-800">6. Your Rights</h2>
            <ul className="list-disc pl-5">
              <li>Access your data</li>
              <li>Update your information</li>
              <li>Delete your account</li>
              <li>Withdraw consent</li>
            </ul>

            <h2 className="font-semibold text-slate-800">7. Age Restriction</h2>
            <p>This app is strictly for users 18 years and older.</p>

            <h2 className="font-semibold text-slate-800">8. Changes</h2>
            <p>
              We may update this policy. Continued use means acceptance.
            </p>

            <h2 className="font-semibold text-slate-800">9. Contact</h2>
            <p>Contact us via the app for any privacy concerns.</p>

          </div>
        </div>
      </div>
    </div>
  );
}