"use client";

import { useEffect, useState } from "react";

interface Props {
  targetDate: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calcTimeLeft(targetDate: string): TimeLeft | null {
  const diff = new Date(targetDate).getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / 1000 / 60) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function CountdownTimer({ targetDate }: Props) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    setTimeLeft(calcTimeLeft(targetDate));
    const id = setInterval(() => {
      setTimeLeft(calcTimeLeft(targetDate));
    }, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  if (!timeLeft) {
    return (
      <p className="text-[var(--color-accent-light)] font-semibold text-lg">
        Game time — let&apos;s go!
      </p>
    );
  }

  const units = [
    { label: "Days", value: timeLeft.days },
    { label: "Hours", value: timeLeft.hours },
    { label: "Min", value: timeLeft.minutes },
    { label: "Sec", value: timeLeft.seconds },
  ];

  return (
    <div className="flex items-center gap-3 md:gap-4">
      {units.map(({ label, value }, i) => (
        <div key={label} className="flex items-center gap-3 md:gap-4">
          <div className="flex flex-col items-center">
            <span className="text-2xl md:text-4xl font-bold text-white tabular-nums">
              {pad(value)}
            </span>
            <span className="text-xs text-red-200 uppercase tracking-widest">
              {label}
            </span>
          </div>
          {i < units.length - 1 && (
            <span className="text-2xl md:text-4xl font-bold text-[var(--color-accent)] mb-4">
              :
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
