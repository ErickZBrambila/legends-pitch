import { Metadata } from "next";

export const metadata: Metadata = {
  manifest: "/tracker/manifest.webmanifest",
};

export default function TrackerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
