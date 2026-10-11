"use client";

import dynamic from "next/dynamic";

const CountdownTimer = dynamic(() => import("./CountdownTimer"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center gap-3 md:gap-4 opacity-40">
      {(["days", "hours", "minutes", "seconds"] as const).map((key, i) => (
        <div key={key} className="flex items-center gap-3 md:gap-4">
          <div className="flex flex-col items-center">
            <span className="text-2xl md:text-4xl font-bold text-white tabular-nums">
              --
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
