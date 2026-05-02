import type { Metadata } from "next";
import { ShoutoutsClient } from "./ShoutoutsClient";

export const metadata: Metadata = {
  title: "Shoutouts",
};

export default function ShoutoutsPage() {
  return <ShoutoutsClient />;
}
