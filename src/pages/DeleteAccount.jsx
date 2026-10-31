import React from "react";

export default function DeleteAccount() {
  return (
    <main className="min-h-screen bg-[#f7f4f6] px-5 py-12 text-[#342633]">
      <div className="mx-auto max-w-2xl rounded-2xl border border-[#e8e2e7] bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold">
          Date-Locked — Delete Account
        </h1>

        <p className="mt-4 text-sm leading-6">
          Date-Locked users can request permanent deletion
          of their account and associated personal data.
        </p>

        <h2 className="mt-8 text-xl font-semibold">
          Delete your account in the app
        </h2>

        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">
          <li>Open Date-Locked and sign in.</li>
          <li>Go to Settings.</li>
          <li>Select Delete Account.</li>
          <li>Confirm your deletion request.</li>
        </ol>

        <h2 className="mt-8 text-xl font-semibold">
          Request deletion without the app
        </h2>

        <p className="mt-3 text-sm leading-6">
          If you cannot access your account, contact
          Date-Locked support using the contact information
          published on our website or Google Play listing.
          Request account deletion and provide the email
          address associated with your account. We may
          verify account ownership before processing.
        </p>

        <h2 className="mt-8 text-xl font-semibold">
          Data deletion and retention
        </h2>

        <p className="mt-3 text-sm leading-6">
          Account deletion includes your authentication
          account, profile and associated personal data,
          subject to applicable retention requirements.
          Shared memory media may be retained for up to
          seven days following relationship termination.
          Certain records may be retained where legally
          required or necessary for legitimate safety
          and compliance purposes.
        </p>
      </div>
    </main>
  );
}
