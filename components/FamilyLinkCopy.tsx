"use client";

import { useState } from "react";

export default function FamilyLinkCopy({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h2 className="text-lg font-black text-gray-900">Family Access Link</h2>
          <p className="text-sm text-gray-500 mt-0.5">Share this link in the group chat — one tap and parents are in, no PIN needed.</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <code className="flex-1 min-w-0 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 truncate font-mono">
          {url}
        </code>
        <button
          onClick={copy}
          className="shrink-0 px-4 py-2 bg-[var(--color-accent)] text-[#1c1c1e] text-sm font-bold rounded-lg hover:opacity-90 transition-opacity"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}
