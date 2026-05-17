import type { Metadata } from "next";
import { LegalCenterCard } from "../components/LegalCenterCard";
import { SUPPORT_EMAIL } from "@/src/lib/support";

export const metadata: Metadata = {
  title: "Child Safety Standards",
};

export default function SafetyPage() {
  return (
    <LegalCenterCard
      title="Child Safety Standards"
      description="Our zero-tolerance approach to child safety, reporting pathways, and how we enforce community protection on LinkUp."
    >
      <div className="space-y-6">
        <section>
          <h2 className="font-semibold text-white">Zero tolerance</h2>
          <p className="mt-2 text-white/68">
            LinkUp has zero tolerance for child sexual exploitation, grooming,
            CSAM, trafficking, or any behavior that endangers minors.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-white">Reporting and moderation</h2>
          <p className="mt-2 text-white/68">
            Users can contact support to report suspected abuse, grooming,
            exploitation, harassment, or unsafe conduct. Reports are reviewed
            and prioritized for safety.
          </p>
          <p className="mt-2 text-white/68">
            For support, privacy requests, account issues, or safety concerns,
            contact: <span className="text-emerald-300">{SUPPORT_EMAIL}</span>.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-white">Enforcement</h2>
          <p className="mt-2 text-white/68">
            We may remove content, disable accounts, preserve relevant records,
            and block users who violate child safety standards or community
            safety expectations.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-white">Escalation</h2>
          <p className="mt-2 text-white/68">
            Serious child safety issues may be reported to appropriate
            authorities, hotlines, or law enforcement when required or
            appropriate.
          </p>
        </section>
      </div>
    </LegalCenterCard>
  );
}
