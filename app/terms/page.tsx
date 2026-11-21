import type { Metadata } from "next";
import { LegalCenterCard } from "../components/LegalCenterCard";
import { SUPPORT_EMAIL } from "@/src/lib/support";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <LegalCenterCard
      title="Terms of Service"
      description="Terms for using Nyvon, an early real-world meetup service operated by Nyvon LLC™."
    >
      <div className="space-y-6">
        <p className="text-white/55">Last updated: November 19, 2026</p>
        <section>
          <h2 className="font-semibold text-white">Eligibility</h2>
          <p className="mt-2 text-white/68">
            Nyvon is intended for users age 18 or older. By creating an account
            or using the service, you represent that you meet this minimum age.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-white">Acceptable use</h2>
          <p className="mt-2 text-white/68">
            Use Nyvon lawfully and respectfully. Do not harass, threaten,
            discriminate, impersonate, defraud, spam, share another person&apos;s
            private address without permission, or organize unsafe or illegal
            activities.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-white">Real-world meetups</h2>
          <p className="mt-2 text-white/68">
            Event hosts are responsible for the accuracy of their descriptions,
            dates, and meeting places. Participants must exercise care when
            meeting others in person. Nyvon does not supervise or guarantee
            any meetup or other user&apos;s conduct.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-white">Your content and privacy</h2>
          <p className="mt-2 text-white/68">
            You are responsible for the event and profile information you
            publish. Do not post private information about other people without
            their permission. Read our Privacy Policy for how Nyvon processes data.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-white">Moderation, account restrictions and deletion</h2>
          <p className="mt-2 text-white/68">
            We may remove events or restrict accounts where necessary to enforce
            these terms or protect users. Contact{" "}
            <a className="text-emerald-300 underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
            {" "}to report a problem, ask us to review a restriction, or request
            account deletion. Deletion requests are processed manually.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-white">Service availability</h2>
          <p className="mt-2 text-white/68">
            Nyvon V1.5 is an early product. Features, maps, event availability
            and moderation tools may change. We do not guarantee uninterrupted
            service, subject to applicable law.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-white">Governing law</h2>
          <p className="mt-2 text-white/68">
            To the extent permitted by applicable law, these terms are governed
            by the laws of Colorado, United States.
          </p>
        </section>
      </div>
    </LegalCenterCard>
  );
}
