import type { Metadata } from "next";
import Link from "next/link";
import { LegalCenterCard } from "../components/LegalCenterCard";
import { SUPPORT_EMAIL } from "@/src/lib/support";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <LegalCenterCard
      title="Privacy Policy"
      description="How Nyvon LLC™ handles information when you use Nyvon."
    >
      <div className="space-y-6">
        <p className="text-white/55">Last updated: November 19, 2026</p>
        <section>
          <h2 className="font-semibold text-white">Who operates Nyvon</h2>
          <p className="mt-2 text-white/68">
            Nyvon LLC™ operates Nyvon. Contact us at{" "}
            <a className="text-emerald-300 underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
            {" "}with privacy questions or requests.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-white">Information collected</h2>
          <p className="mt-2 text-white/68">
            Depending on how you use Nyvon, we process account information (including
            email and authentication details), display name, profile details,
            uploaded profile images, hosted and joined LinkUps, event times,
            locations and coordinates, attendee records, support requests, and
            reports of unsafe content or behavior. The service may also collect
            technical diagnostics needed to operate and protect the app.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-white">Why we process information</h2>
          <p className="mt-2 text-white/68">
            To create and secure accounts, let people discover and participate in
            events, show their profiles, provide support, investigate reports,
            enforce our rules, and maintain service reliability.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-white">Meetup location and attendee privacy</h2>
          <p className="mt-2 text-white/68">
            Public discovery is intended to show approximate meetup areas and
            attendee counts. Exact event locations, detailed descriptions and
            attendee identities should be available only to authorized event
            participants or hosts. Avoid entering private addresses or personal
            information in an event title, which may be public.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-white">Service providers and map services</h2>
          <p className="mt-2 text-white/68">
            We use Supabase for authentication, database and file storage,
            Vercel to host the website, and OpenStreetMap services for mapping
            and location lookup. A location search may be sent to an external
            geocoding service to resolve an entered place. These providers may
            process technical information as part of delivering those services.
            Leaflet is the map display software used by the site.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-white">Storage and retention</h2>
          <p className="mt-2 text-white/68">
            Account and activity information is generally stored while an account
            remains active and the service needs it. When account deletion is
            requested, our team verifies the request and reviews account data
            for deletion. Some information may need to be retained where
            necessary for legal obligations, security, fraud prevention or
            resolving disputes. We will communicate any applicable exceptions
            and the expected processing timeline when responding to a verified
            deletion request. A fixed retention schedule is not yet published;
            contact us for information about a particular data category.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-white">Browser storage and security</h2>
          <p className="mt-2 text-white/68">
            Nyvon uses browser storage to maintain authentication sessions.
            Hosting and map providers may receive technical connection data,
            and service providers may use their own cookies or logs. We use
            encrypted connections in transit, but no online system can
            guarantee absolute security.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-white">Age eligibility</h2>
          <p className="mt-2 text-white/68">
            Nyvon is intended for adults age 18 and older. Users under 18 should
            not create an account or use the service. Please contact us if you
            believe an underage account exists.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-white">Your choices and deletion requests</h2>
          <p className="mt-2 text-white/68">
            You can update some account details from your profile, or contact us
            to request access, corrections or deletion of your information.
            Instructions for requesting account and associated-data deletion,
            including without the app, are available on the{" "}
            <Link className="text-emerald-300 underline" href="/delete-account">account deletion page</Link>.
            The in-app form records a request; it does not instantly remove an
            account. Our team must complete the requested deletion and confirm
            its outcome.
          </p>
        </section>
      </div>
    </LegalCenterCard>
  );
}
