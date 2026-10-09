"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { TeamSlug } from "@/lib/sanity/queries";

const TEAMS: { slug: TeamSlug; label: string }[] = [
  { slug: "u11", label: "Under 11" },
  { slug: "u12", label: "Under 12" },
];

export default function TeamTabs({ activeTeam }: { activeTeam: TeamSlug }) {
  const pathname = usePathname();

  return (
    <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
      {TEAMS.map(({ slug, label }) => (
        <Link
          key={slug}
          href={`${pathname}?team=${slug}`}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTeam === slug
              ? "bg-[var(--color-accent)] text-[#1c1c1e] shadow-sm"
              : "text-gray-500 hover:text-gray-800"
          }`}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}
