import type { Metadata } from "next";
import { players } from "@/lib/data";
import RosterView from "@/components/RosterView";

export const metadata: Metadata = { title: "Roster" };

export default function RosterPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-black text-gray-900 mb-2">Team Roster</h1>
      <p className="text-gray-500 text-sm mb-8">Summer 2026 · North Legends FC</p>
      <RosterView players={players} />
    </div>
  );
}
