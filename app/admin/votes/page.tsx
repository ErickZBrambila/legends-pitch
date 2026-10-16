import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { getAllVotes } from "@/lib/votes";
import CoachVotes from "./CoachVotes";

export const metadata = { title: "Coach Voting · North Legends FC Admin" };

export default async function CoachVotesPage() {
  const authed = await getAdminSession();
  if (!authed) redirect("/admin");

  const votes = await getAllVotes();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-8">
          <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Admin · Coach Tools</p>
          <h1 className="text-3xl font-black text-gray-900">Votación / Feature Voting</h1>
          <p className="text-gray-500 text-sm mt-1">
            Marca las funciones que quieres priorizar. / Mark wishlist items as a coaching staff priority.
          </p>
        </div>
        <CoachVotes initialVotes={votes} />
      </div>
    </div>
  );
}
