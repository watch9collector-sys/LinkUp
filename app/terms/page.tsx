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
    />
  );
}
