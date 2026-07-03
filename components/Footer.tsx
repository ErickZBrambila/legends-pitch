import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-[var(--color-navy)] text-red-300 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.jpg" alt="North Legends FC crest" width={32} height={32} className="rounded-full object-cover" />
            <div>
              <p className="font-semibold text-white text-sm">North Legends FC</p>
              <p className="text-xs text-red-400">Developing Players, Building Leaders</p>
            </div>
          </div>

          <nav className="flex gap-5 text-sm">
            <Link href="/schedule" className="hover:text-white transition-colors">Schedule</Link>
            <Link href="/roster" className="hover:text-white transition-colors">Roster</Link>
            <Link href="/news" className="hover:text-white transition-colors">News</Link>
            <Link href="/gallery" className="hover:text-white transition-colors">Gallery</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
          </nav>

          <p className="text-xs text-red-600">
            © {new Date().getFullYear()} North Legends FC
          </p>
        </div>
      </div>
    </footer>
  );
}
