import type { Metadata } from "next";
import { MessagesClient } from "./MessagesClient";

export const metadata: Metadata = {
  title: "Messages",
  description: "Conversations with people you meet through LinkUp.",
};

export default function MessagesPage() {
  return <MessagesClient />;
}
