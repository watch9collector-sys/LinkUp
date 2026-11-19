import type { Metadata } from "next";
import Link from "next/link";
import { LegalCenterCard } from "../components/LegalCenterCard";
import { SUPPORT_EMAIL } from "@/src/lib/support";

export const metadata: Metadata = {
  title: "Delete Your Nyvon Account",
  description:
    "Request deletion of your Nyvon account and associated personal data, with or without the app.",
};

export default function DeleteAccountInformationPage() {
  return (
    <LegalCenterCard
      title="Delete Your Nyvon Account"
      description="Nyvon LLC™ — Account & Data Deletion"
    >
      <div className="space-y-7">
        <p className="text-white/75">
          You can request deletion of your Nyvon account and associated
          personal data at any time, even if you no longer have the app installed.
        </p>

        <section className="space-y-3">
          <h2 className="font-semibold text-white">Option 1 — Inside Nyvon</h2>
          <p className="text-white/70">
            Sign in → Profile → Delete account → Confirm → Submit deletion request.
          </p>
          <p>
            <Link
              href="/delete"
              className="font-medium text-emerald-300 underline underline-offset-4 hover:text-emerald-200"
            >
              Open the in-app deletion request form
            </Link>
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-semibold text-white">Option 2 — Without the app</h2>
          <p className="text-white/70">
            Email{" "}
            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=Nyvon%20Account%20Deletion%20Request`}
              className="font-medium text-emerald-300 underline underline-offset-4 hover:text-emerald-200"
            >
              {SUPPORT_EMAIL}
            </a>{" "}
            with the subject <strong className="text-white">Nyvon Account Deletion Request</strong>.
          </p>
          <p className="text-white/70">
            Include the email address associated with your Nyvon account.
            Never send your password.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-semibold text-white">What happens next</h2>
          <p className="text-white/70">
            Our team will verify account ownership and process the deletion request.
            Account deletion is permanent and cannot be undone.
          </p>
          <p className="text-white/70">
            For questions about data deletion or retention, contact{" "}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="font-medium text-emerald-300 underline underline-offset-4 hover:text-emerald-200"
            >
              {SUPPORT_EMAIL}
            </a>.
          </p>
        </section>
      </div>
    </LegalCenterCard>
  );
}
