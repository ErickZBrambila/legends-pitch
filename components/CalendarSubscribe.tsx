"use client";

import { useState } from "react";

interface Props {
  team: string;
  labelSubscribe: string;
  labelDownload: string;
  labelGoogle: string;
  labelCopied: string;
  labelCopy: string;
}

export default function CalendarSubscribe({
  team,
  labelSubscribe,
  labelDownload,
  labelGoogle,
  labelCopied,
  labelCopy,
}: Props) {
  const [copied, setCopied] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const calUrl = `${origin}/api/calendar/${team}`;
  const webcalUrl = calUrl.replace(/^https?/, "webcal");
  const googleUrl = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(calUrl)}`;

  const copyUrl = () => {
    navigator.clipboard.writeText(calUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-7 h-7 rounded-full bg-[var(--color-primary)] flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </span>
        <p className="font-bold text-gray-800 text-sm">{labelSubscribe}</p>
      </div>

      <div className="flex flex-col gap-2">
        {/* iOS / Android native subscribe */}
        <a
          href={webcalUrl}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-[var(--color-navy)] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
          iPhone / iPad
        </a>

        {/* Google Calendar */}
        <a
          href={googleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-white border border-gray-200 text-gray-700 text-sm font-semibold hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
        >
          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.372 0 0 5.373 0 12s5.372 12 12 12 12-5.373 12-12S18.628 0 12 0zm5.82 9.254h-1.636v-.818H12.82v.818h-1.637v.818h1.637v3.273c0 .904.732 1.636 1.636 1.636h1.364v-.818H14.82a.82.82 0 01-.818-.818V10.07h3.818V9.254zm-7.638 5.727H8.546V9.254H7.728v6.545h2.454v-.818z" fill="none"/>
            <path d="M21.805 10.023H20v-.636h-1.6v.636H16.8v.8h1.6v3.2c0 .884.716 1.6 1.6 1.6h1.333v-.8H20a.8.8 0 01-.8-.8v-3.2h2.605v-.8zM6.4 16.023H4.8V10.18H4v6.644h2.4v-.8z" fill="none"/>
            <path d="M19 3H5C3.346 3 2 4.346 2 6v12c0 1.654 1.346 3 3 3h14c1.654 0 3-1.346 3-3V6c0-1.654-1.346-3-3-3zm-9 13H8v-6h2v6zm4 0h-2v-6h2v6zm4 0h-2v-6h2v6zM7 9a1 1 0 110-2 1 1 0 010 2zm5 0a1 1 0 110-2 1 1 0 010 2zm5 0a1 1 0 110-2 1 1 0 010 2z" fill="none"/>
          </svg>
          {labelGoogle}
        </a>

        {/* Download .ics */}
        <a
          href={`/api/calendar/${team}`}
          download={`north-legends-${team}.ics`}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-white border border-gray-200 text-gray-700 text-sm font-semibold hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h4a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
          {labelDownload}
        </a>

        {/* Copy URL */}
        <button
          onClick={copyUrl}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-white border border-gray-200 text-gray-500 text-sm hover:border-gray-300 transition-colors text-left"
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <span className="truncate text-xs font-mono">{copied ? labelCopied : calUrl}</span>
        </button>
      </div>
    </div>
  );
}
