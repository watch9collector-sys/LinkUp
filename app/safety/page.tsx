import type { Metadata } from "next";
import { LegalCenterCard } from "../components/LegalCenterCard";

export const metadata: Metadata = {
  title: "Child Safety Standards",
};

export default function SafetyPage() {
  return (
    <LegalCenterCard
      title="Child Safety Standards"
      description="Our zero-tolerance approach to child safety, reporting pathways, and how we enforce community protection on LinkUp."
    />
  );
}
