import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";

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

          <nav className="flex gap-5 text-sm">
            <Link href="/schedule" className="hover:text-white transition-colors">{t("schedule")}</Link>
            <Link href="/roster" className="hover:text-white transition-colors">{t("roster")}</Link>
            <Link href="/news" className="hover:text-white transition-colors">{t("news")}</Link>
            <Link href="/gallery" className="hover:text-white transition-colors">{t("gallery")}</Link>
            <Link href="/contact" className="hover:text-white transition-colors">{t("contact")}</Link>
            <Link href="/roadmap" className="hover:text-white transition-colors">{t("roadmap")}</Link>
          </nav>

          <div className="flex flex-col items-center md:items-end gap-1">
            <p className="text-xs text-red-600">{t("copyright", { year })}</p>
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
    </footer>
  );
}
