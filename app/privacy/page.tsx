import type { Metadata } from "next";
import Link from "next/link";
import { LegalCenterCard } from "../components/LegalCenterCard";
import { SUPPORT_EMAIL } from "@/src/lib/support";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <LegalCenterCard
      title="Privacy Policy"
      description="How Nyvon LLC™ collects, uses, shares, and handles information."
    >
      <div className="space-y-6">
        <p className="text-white/55">Last updated: November 19, 2026</p>

        <section>
          <h2 className="font-semibold text-white">Who operates Nyvon</h2>
          <p className="mt-2 text-white/68">
            Nyvon LLC™ operates Nyvon. For privacy questions or requests,
            email <a className="text-emerald-300 underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-white">Information we process</h2>
          <p className="mt-2 text-white/68">
            Depending on your activity, this includes your email and account
            authentication details, display name, biography, profile photos and
            banners, hosted and joined LinkUps, event titles, descriptions, times,
            entered location labels and coordinates, attendance and interactions,
            support and deletion requests, reports, blocks, moderation records,
            and technical and usage analytics. We do not ask you to send us
            your password when requesting support or deletion.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-white">How we use information</h2>
          <p className="mt-2 text-white/68">
            To operate and protect accounts, display profiles, help users discover,
            host and join LinkUps, run location and mapping features, provide
            support, investigate reports, prevent abuse, measure product usage,
            and maintain the reliability and security of the service.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-white">Locations and public visibility</h2>
          <p className="mt-2 text-white/68">
            Organizers can enter event locations that may include precise coordinates
            or addresses. In the current version, LinkUp details and location
            information may be accessible to other users, including guests.
            Titles and descriptions can also disclose a precise location if an
            organizer types one into them. Do not put a home address or other
            sensitive information in a public LinkUp. Some profile images and
            banners are served from public file URLs; do not upload private photos.
            Location searches may send entered place information to a geocoding
            provider. Device location access, if offered by a feature, requires
            the permission provided by your device or browser.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-white">Service providers and analytics</h2>
          <p className="mt-2 text-white/68">
            We use Supabase for accounts, databases and files; Vercel to host
            the website; OpenStreetMap-related services for maps and place
            searches; and PostHog for product analytics. Analytics may include
            a user or device identifier, activity and event identifiers, page
            path, campaign attribution, and timestamps. Service providers may
            also receive technical connection information such as IP addresses
            and request metadata. We use browser storage to maintain sessions.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-white">Security and retention</h2>
          <p className="mt-2 text-white/68">
            We use encrypted connections and access controls to protect data,
            though no service can guarantee absolute security. Information is
            generally retained while needed to operate the service. A single
            fixed retention schedule is not yet published. Where genuinely
            necessary for legal obligations, safety, fraud prevention or dispute
            handling, limited records may be retained after an account-deletion
            request; we will explain applicable exceptions in our response.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-white">Your choices and account deletion</h2>
          <p className="mt-2 text-white/68">
            You may update some profile details or contact us about access,
            correction and deletion. You can submit a deletion request inside
            Nyvon or without the app through the{" "}
            <Link className="text-emerald-300 underline" href="/delete-account">
              account-deletion instructions
            </Link>.
            A submitted request is recorded for manual verification and processing;
            it does not immediately delete the account or all its associated data.
            We will communicate the expected processing timeline and any
            permissible retention when responding to a verified request.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-white">Age eligibility</h2>
          <p className="mt-2 text-white/68">
            Nyvon is intended for people age 18 and older. If you believe a
            person under 18 has an account, please contact our support team.
          </p>
        </section>
      </div>
    </LegalCenterCard>
  );
}
