import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import NavTip from "@/components/NavTip";
import AddToHomeScreen from "@/components/AddToHomeScreen";
import PushPermission from "@/components/PushPermission";
import LanguagePickerModal from "@/components/LanguagePickerModal";
import TeamPreferenceRedirect from "@/components/TeamPreferenceRedirect";
import SiteBannerClient from "@/components/SiteBannerClient";
import PageViewTracker from "@/components/PageViewTracker";
import WhatsNewModal from "@/components/WhatsNewModal";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { headers } from "next/headers";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: {
    default: "⚽ North Legends FC",
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
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? headersList.get("x-invoke-path") ?? "";
  const isAdminRoute = pathname.startsWith("/admin") || pathname.startsWith("/neo") || pathname.startsWith("/tracker");
  return (
    <html lang={locale} className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider>
          {!isAdminRoute && <LanguagePickerModal />}
          {!isAdminRoute && <TeamPreferenceRedirect />}
          {!isAdminRoute && <SiteBannerClient />}
          {!isAdminRoute && <Nav />}
          {!isAdminRoute && <NavTip />}
          <main className="flex-1">{children}</main>
          {!isAdminRoute && <Footer />}
          {!isAdminRoute && <AddToHomeScreen />}
          {!isAdminRoute && <PushPermission />}
          {!isAdminRoute && <WhatsNewModal />}
          {!isAdminRoute && <PageViewTracker />}
        </NextIntlClientProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
