import type { Metadata } from "next";
import { ExploreClient } from "./ExploreClient";

export const metadata: Metadata = {
  title: "Explore",
  description: "Discover nearby people, communities, and live LinkUps.",
};

export default function ExplorePage() {
  return <ExploreClient />;
}
