"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { track } from "@vercel/analytics";

export default function Footer() {
  const t = useTranslations("Footer");
  const year = new Date().getFullYear();
  return (
    <footer className="bg-[var(--color-navy)] text-red-300 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.jpg" alt="North Legends FC crest" width={32} height={32} className="rounded-full object-cover" />
            <div>
              <p className="font-semibold text-white text-sm">North Legends FC</p>
              <p className="text-xs text-red-400">{t("tagline")}</p>
            </div>
          </div>

          <nav className="flex flex-wrap gap-5 text-sm justify-center">
            <Link href="/schedule" className="hover:text-white transition-colors">{t("schedule")}</Link>
            <Link href="/roster" className="hover:text-white transition-colors">{t("roster")}</Link>
            <Link href="/news" className="hover:text-white transition-colors">{t("news")}</Link>
            <Link href="/gallery" className="hover:text-white transition-colors">{t("gallery")}</Link>
            <Link href="/announcements" className="hover:text-white transition-colors">{t("announcements")}</Link>
            <Link href="/contact" className="hover:text-white transition-colors">{t("contact")}</Link>
            <Link href="/roadmap" className="hover:text-white transition-colors">{t("roadmap")}</Link>
          </nav>

          <div className="flex flex-col items-center md:items-end gap-3">
            <a
              href="https://www.facebook.com/p/North-Legends-FC-61585254458363/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track("social_click", { platform: "facebook" })}
              className="flex items-center gap-2 bg-[#1877F2] hover:bg-[#0e65d9] text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors shadow-md"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
              </svg>
              Follow us on Facebook
            </a>
            <p className="text-xs text-red-600">{t("copyright", { year })}</p>
            <div className="flex items-center gap-3">
              <a
                href="https://claude.ai/code"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-red-400 hover:text-white transition-colors"
              >
                Powered by Claude Code ↗
              </a>
              <span className="text-red-800 text-xs">·</span>
              <a
                href="https://github.com/ErickZBrambila/legends-pitch"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-red-500 hover:text-white transition-colors"
              >
                {t("contribute")}
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
