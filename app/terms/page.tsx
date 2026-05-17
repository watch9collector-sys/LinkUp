import type { Metadata } from "next";
import { LegalCenterCard } from "../components/LegalCenterCard";

export const metadata: Metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <LegalCenterCard
      title="Terms of Service"
      description="These terms govern your use of LinkUp, including acceptable behavior, content rules, and limitations of liability."
    >
      <div className="space-y-6">
        <section>
          <h2 className="font-semibold text-white">Acceptable use</h2>
          <p className="mt-2 text-white/68">
            Use LinkUp respectfully and lawfully. Do not use the app for
            harassment, threats, spam, fraud, illegal activity, impersonation,
            or attempts to mislead other users.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-white">Real-world meetups</h2>
          <p className="mt-2 text-white/68">
            LinkUp helps people discover and create plans, but users are
            responsible for their own decisions, safety, and conduct when
            meeting others in person.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-white">Moderation and removal</h2>
          <p className="mt-2 text-white/68">
            We may remove content, restrict accounts, or disable access when we
            believe behavior violates these terms, harms users, or creates risk
            for the community.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-white">MVP disclaimer</h2>
          <p className="mt-2 text-white/68">
            LinkUp V1 is an early MVP. Features, availability, moderation tools,
            messaging, maps, and policies may evolve as we learn from testing
            and improve the product.
          </p>
        </section>
      </div>
    </LegalCenterCard>
  );
}
