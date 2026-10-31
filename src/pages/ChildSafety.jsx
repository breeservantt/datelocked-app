import React from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  AlertTriangle,
  Flag,
  LockKeyhole,
  Mail,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";

const SAFETY_EMAIL = "breeservantt@gmail.com";

const sections = [
  {
    title: "Our commitment",
    body: [
      "Date-Locked is committed to protecting children and preventing child sexual abuse and exploitation (CSAE). We maintain a zero-tolerance policy toward child sexual abuse material (CSAM), grooming, sexual exploitation, and other activities that endanger children.",
      "These standards apply to all Date-Locked users and to content shared through the platform, including profiles, messages, photos, videos, and community posts.",
    ],
  },
  {
    title: "Prohibited content and behaviour",
    items: [
      "Creating, uploading, sharing, requesting, or distributing child sexual abuse material (CSAM).",
      "Sexual exploitation, grooming, coercion, or solicitation involving minors.",
      "Sexualised content involving minors, including attempts to facilitate exploitation.",
      "Using Date-Locked to arrange, promote, or participate in the abuse or exploitation of children.",
      "Threatening, blackmailing, or exploiting minors through messages or other content.",
    ],
  },
  {
    title: "Reporting safety concerns",
    body: [
      "Users can report suspected child sexual abuse or exploitation using available in-app reporting features or by contacting Date-Locked through its designated safety contact.",
      "Reports should include relevant details that help identify the content or account involved. Do not download, forward, or redistribute suspected child sexual abuse material.",
    ],
  },
  {
    title: "Review and enforcement",
    body: [
      "Date-Locked prohibits accounts and content that violate these standards. Reported concerns may be reviewed and may result in content removal, account restrictions, suspension, or permanent termination, depending on the circumstances.",
      "Where required by applicable law, Date-Locked will cooperate with competent authorities and make legally required reports concerning child sexual abuse material.",
    ],
  },
  {
    title: "Age restrictions",
    body: [
      "Date-Locked is intended for adults aged 18 years and older. Minors are not permitted to register or use the service.",
      "Accounts identified as belonging to minors may be restricted or removed in accordance with the platform's policies.",
    ],
  },
  {
    title: "Privacy and safety",
    body: [
      "Date-Locked aims to handle safety reports with appropriate confidentiality while prioritising the protection of children and complying with applicable legal obligations.",
      "Information submitted in a safety report may be used to investigate the concern and take appropriate action.",
    ],
  },
];

export default function ChildSafety() {
  const emailConfigured =
    SAFETY_EMAIL !== "REPLACE_WITH_YOUR_ACTIVE_SAFETY_EMAIL";

  return (
    <main className="min-h-screen bg-[#f7f4f6] text-[#342633]">
      <header className="border-b border-[#e8e2e7] bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-5">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-semibold text-[#355fba] hover:underline"
          >
            <ArrowLeft size={18} />
            Date-Locked
          </Link>

          <span className="flex items-center gap-2 text-sm font-semibold text-[#355fba]">
            <ShieldCheck size={18} />
            Safety Standards
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="rounded-3xl border border-[#e8e2e7] bg-white p-6 shadow-sm sm:p-10">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[#edf4ff] px-4 py-2 text-sm font-semibold text-[#3567bb]">
            <ShieldCheck size={17} />
            Child Protection
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Child Safety Standards
          </h1>

          <p className="mt-4 text-base leading-7 text-[#665b66]">
            Date-Locked's published standards against child sexual
            abuse and exploitation (CSAE).
          </p>

          <div className="mt-8 rounded-2xl border border-[#f0d6d6] bg-[#fff5f5] p-5">
            <div className="flex items-center gap-2 font-bold text-[#8f3434]">
              <AlertTriangle size={20} />
              Zero tolerance
            </div>

            <p className="mt-2 text-sm leading-6 text-[#6e4242]">
              Child sexual abuse material, grooming, exploitation,
              and any sexual abuse of minors are strictly prohibited
              on Date-Locked.
            </p>
          </div>

          <div className="mt-10 space-y-9">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="mb-3 text-xl font-bold">
                  {section.title}
                </h2>

                {section.body?.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="mb-3 text-sm leading-7 text-[#665b66]"
                  >
                    {paragraph}
                  </p>
                ))}

                {section.items && (
                  <ul className="list-disc space-y-3 pl-6 text-sm leading-7 text-[#665b66]">
                    {section.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>

          <section className="mt-10 rounded-2xl bg-[#edf4ff] p-6">
            <div className="flex items-center gap-2 text-lg font-bold text-[#2856a4]">
              <Flag size={20} />
              Contact our child safety team
            </div>

            <p className="mt-3 text-sm leading-7 text-[#4b607e]">
              To report suspected child sexual abuse, exploitation,
              grooming, or other child safety concerns, contact our
              designated safety contact.
            </p>

            {emailConfigured ? (
              <a
                href={`mailto:${SAFETY_EMAIL}?subject=Child%20Safety%20Report`}
                className="mt-4 inline-flex items-center gap-2 break-all font-semibold text-[#2856a4] underline"
              >
                <Mail size={18} />
                {SAFETY_EMAIL}
              </a>
            ) : (
              <p className="mt-4 font-semibold text-[#8f3434]">
                Safety contact email must be configured before publication.
              </p>
            )}

            <p className="mt-4 text-xs leading-6 text-[#4b607e]">
              If a child is in immediate danger, contact local
              emergency services or the relevant law enforcement
              authority.
            </p>
          </section>

          <div className="mt-8 flex flex-wrap gap-4 border-t border-[#e8e2e7] pt-6 text-sm">
            <Link
              to="/"
              className="inline-flex items-center gap-2 font-semibold text-[#355fba] hover:underline"
            >
              <LockKeyhole size={16} />
              Back to Date-Locked
            </Link>

            <a
              href="https://datelocked.app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-semibold text-[#355fba] hover:underline"
            >
              Official website
              <ExternalLink size={15} />
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
