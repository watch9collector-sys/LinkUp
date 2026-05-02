import type { Metadata } from "next";
import { LegalCenterCard } from "../components/LegalCenterCard";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <LegalCenterCard
      title="Privacy Policy"
      description="We explain what we collect, why we collect it, and how you can control your data while using LinkUp."
    />
  );
}
