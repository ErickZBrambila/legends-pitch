"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import LanguageSwitcher from "./LanguageSwitcher";
import SearchModal from "./SearchModal";

const HAND_KEY = "nlfc_hand";

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
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [leftHanded, setLeftHanded] = useState(false);

  useEffect(() => {
    setLeftHanded(localStorage.getItem(HAND_KEY) === "left");
  }, []);

  // Cmd+K / Ctrl+K opens search
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Close menu on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  function toggleHand() {
    const next = !leftHanded;
    setLeftHanded(next);
    localStorage.setItem(HAND_KEY, next ? "left" : "right");
  }

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const hamburger = (
    <button
      onClick={() => setOpen((v) => !v)}
      aria-label="Toggle menu"
      className="p-2 rounded-md text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
    >
      {open ? (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      ) : (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      )}
    </button>
  );

  return (
    <header className="sticky top-0 z-50 bg-[var(--color-navy)] shadow-lg">
      <div className={`max-w-6xl mx-auto px-4 flex items-center h-16 ${leftHanded ? "flex-row-reverse" : "justify-between"}`}>
        {/* Logo */}
        <Link href="/" className={`flex items-center gap-2.5 ${leftHanded ? "mr-auto" : ""}`}>
          <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-[var(--color-accent)] flex-shrink-0">
            <Image src="/logo.jpg" alt="North Legends FC crest" width={36} height={36} className="object-cover" />
          </div>
          <span className="font-bold text-white text-lg tracking-wide">North Legends FC</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive(link.href)
                  ? "bg-[var(--color-accent)] text-[#1c1c1e] font-bold"
                  : "text-gray-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              {t(link.key)}
            </Link>
          ))}
          <button
            onClick={() => setSearchOpen(true)}
            aria-label="Search"
            className="ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-gray-400 bg-white/5 hover:bg-white/10 hover:text-white transition-colors border border-white/10"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <span className="hidden lg:inline">Search</span>
            <kbd className="hidden lg:inline text-[10px] text-gray-600 bg-white/5 px-1 rounded border border-white/10">⌘K</kbd>
          </button>
          <LanguageSwitcher className="ml-2" />
        </nav>

        {/* Mobile: search + language switcher + hamburger — order follows hand preference */}
        <div className={`flex items-center gap-2 md:hidden ${leftHanded ? "flex-row-reverse" : ""}`}>
          <button
            onClick={() => setSearchOpen(true)}
            aria-label="Search"
            className="p-2 rounded-md text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
          </button>
          <LanguageSwitcher />
          {hamburger}
        </div>
      </div>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Mobile drawer */}
      {open && (
        <nav className="md:hidden bg-[var(--color-navy)] border-t border-white/10 px-4 pb-4 pt-2 flex flex-col gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive(link.href)
                  ? "bg-[var(--color-accent)] text-[#1c1c1e] font-bold"
                  : "text-gray-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              {t(link.key)}
            </Link>
          ))}

          {/* Hand preference toggle */}
          <div className="mt-3 pt-3 border-t border-white/10">
            <button
              onClick={toggleHand}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
            >
              <span className="flex items-center gap-2">
                <span>{leftHanded ? "🫲" : "🫱"}</span>
                <span>{leftHanded ? "Left-handed mode" : "Right-handed mode"}</span>
              </span>
              <span className="text-xs text-gray-500">tap to switch</span>
            </button>
          </div>
        </nav>
      )}
    </header>
  );
}
