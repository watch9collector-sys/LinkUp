import type { Metadata } from "next";
import { DiscoverClient } from "./DiscoverClient";

export const metadata: Metadata = {
  title: "Discover",
};

export default function DiscoverPage() {
  return <DiscoverClient />;
}
