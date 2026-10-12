"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "./LanguageSwitcher";

const links = [
  { href: "/", key: "home" },
  { href: "/schedule", key: "schedule" },
  { href: "/roster", key: "roster" },
  { href: "/videos", key: "videos" },
  { href: "/news", key: "news" },
  { href: "/gallery", key: "gallery" },
  { href: "/contact", key: "contact" },
  { href: "/roadmap", key: "roadmap" },
] as const;

export default function Nav() {
  const pathname = usePathname();
  const t = useTranslations("Nav");

  return (
    <header className="hidden md:block sticky top-0 z-50 bg-[var(--color-navy)] shadow-lg">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-[var(--color-accent)] flex-shrink-0">
            <Image src="/logo.jpg" alt="North Legends FC crest" width={36} height={36} className="object-cover" />
          </div>
          <span className="font-bold text-white text-lg tracking-wide">
            North Legends FC
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  active
                    ? "bg-[var(--color-accent)] text-[#1c1c1e] font-bold"
                    : "text-gray-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                {t(link.key)}
              </Link>
            );
          })}
          <LanguageSwitcher className="ml-2" />
        </nav>
      </div>
    </header>
  );
}
