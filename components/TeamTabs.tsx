"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import type { TeamSlug } from "@/lib/sanity/queries";

const TEAMS: TeamSlug[] = ["u11", "u12"];

export default function TeamTabs({ activeTeam }: { activeTeam: TeamSlug }) {
  const pathname = usePathname();
  const t = useTranslations("Teams");

  return (
    <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
      {TEAMS.map((slug) => (
        <Link
          key={slug}
          href={`${pathname}?team=${slug}`}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTeam === slug
              ? "bg-[var(--color-accent)] text-[#1c1c1e] shadow-sm"
              : "text-gray-500 hover:text-gray-800"
          }`}
        >
          {t(slug)}
        </Link>
      ))}
    </div>
  );
}
