import type { Metadata } from "next";
import { LegalCenterCard } from "../components/LegalCenterCard";
import { SUPPORT_EMAIL } from "@/src/lib/support";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <LegalCenterCard
      title="Privacy Policy"
      description="We explain what we collect, why we collect it, and how you can control your data while using LinkUp."
    >
      <div className="space-y-6">
        <section>
          <h2 className="font-semibold text-white">Data we collect</h2>
          <p className="mt-2 text-white/68">
            LinkUp may collect account details such as your email address,
            display name, profile photo, bio, hosted LinkUps, joined LinkUps,
            and basic activity needed to keep the app working.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-white">How we use data</h2>
          <p className="mt-2 text-white/68">
            We use this information to authenticate you, show your profile,
            display LinkUps, manage attendee lists, improve safety, respond to
            support requests, and operate the MVP.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-white">Location and nearby features</h2>
          <p className="mt-2 text-white/68">
            LinkUp is built around nearby real-world plans. The current MVP may
            use location labels and approximate/demo map coordinates until exact
            location data is added. Future versions may request device location
            permission only when needed for nearby discovery.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-white">Messaging, reports, and moderation</h2>
          <p className="mt-2 text-white/68">
            Messaging and reporting features may be reviewed for safety,
            abuse prevention, and policy enforcement. Reports can result in
            content removal, account restrictions, or escalation where required.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-white">Deletion and privacy requests</h2>
          <p className="mt-2 text-white/68">
            For support, privacy requests, account issues, or safety concerns,
            contact: <span className="text-emerald-300">{SUPPORT_EMAIL}</span>.
          </p>
        </section>
      </div>
    </LegalCenterCard>
  );
}
