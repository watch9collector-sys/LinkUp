import type { Metadata } from "next";
import Link from "next/link";
import { LegalCenterCard } from "../components/LegalCenterCard";
import { SUPPORT_EMAIL } from "@/src/lib/support";

export const metadata: Metadata = {
  title: "Account Deleted",
  robots: { index: false, follow: false },
};

export default function AccountDeletedPage() {
  return (
    <LegalCenterCard
      title="Your Nyvon account has been deleted"
      description="Your account is closed and you have been signed out."
    >
      <div className="space-y-5 text-white/75">
        <p>Your profile, hosted LinkUps, memberships, and profile images have been removed.
          Some limited information may be retained for legal, safety, or fraud-prevention reasons.</p>
        <p>If you have any questions about privacy or deletion, email{" "}
          <a className="text-emerald-300 underline" href={"mailto:" + SUPPORT_EMAIL}>{SUPPORT_EMAIL}</a>.
        </p>
        <p><Link className="text-emerald-300 underline" href="/">Return to Nyvon</Link></p>
      </div>
    </LegalCenterCard>
  );
}
