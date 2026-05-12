import type { Metadata } from "next";
import { LinkUpsClient } from "./LinkUpsClient";

export const metadata: Metadata = {
  title: "LinkUps",
  description: "Create and join live, location-based meetups.",
};

export default function LinkUpsPage() {
  return <LinkUpsClient />;
}
