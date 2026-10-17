"use client";

import { useState } from "react";
import Image from "next/image";

interface Submission {
  id: string;
  playerId: string;
  imageUrl: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  playerName: string;
  playerNumber: number;
}

type ReviewState = "idle" | "loading" | "approved" | "rejected";

export default function PhotoQueue({ submissions: initial }: { submissions: Submission[] }) {
  const [queue, setQueue] = useState(initial);

  async function approve(id: string) {
    const res = await fetch(`/api/photo-submission/${id}/approve`, { method: "POST" });
    if (res.ok) setQueue((q) => q.filter((s) => s.id !== id));
    else alert("Failed to approve");
  }

  async function reject(id: string) {
    const res = await fetch(`/api/photo-submission/${id}`, { method: "DELETE" });
    if (res.ok) setQueue((q) => q.filter((s) => s.id !== id));
    else alert("Failed to reject");
  }

  if (queue.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p className="text-4xl mb-3">📭</p>
        <p className="font-medium">No pending submissions</p>
        <p className="text-sm mt-1">Photos will appear here when parents submit them from the roster page.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {queue.map((s) => (
        <SubmissionCard key={s.id} submission={s} onApprove={approve} onReject={reject} />
      ))}
    </div>
  );
}

function SubmissionCard({
  submission: s,
  onApprove,
  onReject,
}: {
  submission: Submission;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
}) {
  const [state, setState] = useState<ReviewState>("idle");

  async function handle(action: "approve" | "reject") {
    setState("loading");
    if (action === "approve") await onApprove(s.id);
    else await onReject(s.id);
  }

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm flex gap-5 p-5 items-start">
      {/* Photo */}
      <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 relative">
        <Image src={s.imageUrl} alt={s.playerName} fill className="object-cover" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-900">{s.playerName}</p>
        <p className="text-sm text-gray-500">#{s.playerNumber}</p>
        <p className="text-xs text-gray-400 mt-1">
          Submitted {new Date(s.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
        </p>

        <div className="flex gap-2 mt-3">
          <button
            onClick={() => handle("approve")}
            disabled={state === "loading"}
            className="px-4 py-1.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-40"
          >
            ✓ Approve
          </button>
          <button
            onClick={() => handle("reject")}
            disabled={state === "loading"}
            className="px-4 py-1.5 bg-red-50 text-red-600 text-sm font-semibold rounded-lg border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-40"
          >
            ✕ Reject
          </button>
        </div>
      </div>
    </div>
  );
}
