import type { Metadata } from "next";
import Link from "next/link";
import { LegalCenterCard } from "../components/LegalCenterCard";
import { SUPPORT_EMAIL } from "@/src/lib/support";

export const metadata: Metadata = {
  title: "Delete Your Nyvon Account",
  description: "Delete your Nyvon account immediately when eligible, or request staff-assisted deletion.",
};

export default function DeleteAccountInformationPage() {
  return (
    <LegalCenterCard
      title="Delete Your Nyvon Account"
      description="Nyvon LLC™ — Account & Data Deletion"
    >
      <div className="space-y-7">
        <p className="text-white/75">
          You can permanently delete an eligible Nyvon account directly in the app
          after verifying your password. You can also request deletion without the app.
        </p>

        <section className="space-y-3">
          <h2 className="font-semibold text-white">Option 1 — Delete immediately in Nyvon</h2>
          <p className="text-white/70">
            Sign in → Profile → Support &amp; Legal → Delete account.
            Enter your current password and select
            Permanently delete my account.
          </p>
          <p>
            <Link href="/delete" className="font-medium text-emerald-300 underline underline-offset-4 hover:text-emerald-200">
              Open the in-app deletion page
            </Link>
          </p>
          <p className="text-white/70">
            Your account, profile photos, memberships, and LinkUps you host are removed;
            you are signed out. Hosted LinkUps disappear for attendees, too.
            Deletion cannot be undone.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-semibold text-white">Option 2 — Without access to your account</h2>
          <p className="text-white/70">
            Email{" "}
            <a href={"mailto:" + SUPPORT_EMAIL + "?subject=Nyvon%20Account%20Deletion%20Request"}
              className="font-medium text-emerald-300 underline underline-offset-4 hover:text-emerald-200">
              {SUPPORT_EMAIL}
            </a>{" "}
            with the subject <strong className="text-white">Nyvon Account Deletion Request</strong>.
            Include the email address associated with your account; never send your password.
          </p>
          <p className="text-white/70">
            We will verify your identity before deleting your account.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-semibold text-white">Retention and safety reviews</h2>
          <p className="text-white/70">
            Accounts with an active safety, fraud, or legal preservation matter may require
            staff-assisted review instead of automatic deletion. Limited records may be
            retained where necessary for applicable legal or safety obligations.
            Contact{" "}
            <a href={"mailto:" + SUPPORT_EMAIL} className="text-emerald-300 underline">{SUPPORT_EMAIL}</a>
            {" "}to discuss a deletion exception or related data request.
          </p>
        </section>
      </div>
    </LegalCenterCard>
  );
}
