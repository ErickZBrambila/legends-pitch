import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import "./globals.css";
import Nav from "@/components/Nav";
import MobileNav from "@/components/MobileNav";
import Footer from "@/components/Footer";
import { Analytics } from "@vercel/analytics/next";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: {
    default: "North Legends FC",
    template: "%s | North Legends FC",
  },
  description:
    "Official website of the North Legends FC youth soccer team — schedules, roster, news, and more.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();

  return (
    <html lang={locale} className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col pb-14 md:pb-0">
        <NextIntlClientProvider>
          <Nav />
          <main className="flex-1">{children}</main>
          <Footer />
          <MobileNav />
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
