"use client";

import dynamic from "next/dynamic";

const CountdownTimer = dynamic(() => import("./CountdownTimer"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center gap-3 md:gap-4 opacity-40">
      {(["Days", "Hours", "Min", "Sec"] as const).map((label, i) => (
        <div key={label} className="flex items-center gap-3 md:gap-4">
          <div className="flex flex-col items-center">
            <span className="text-2xl md:text-4xl font-bold text-white tabular-nums">
              --
            </span>
            <span className="text-xs text-red-200 uppercase tracking-widest">
              {label}
            </span>
          </div>
          {i < 3 && (
            <span className="text-2xl md:text-4xl font-bold text-[var(--color-accent)] mb-4">
              :
            </span>
          )}
        </div>
      ))}
    </div>
  ),
});

export default function CountdownTimerClient({
  targetDate,
}: {
  targetDate: string;
}) {
  return <CountdownTimer targetDate={targetDate} />;
}
