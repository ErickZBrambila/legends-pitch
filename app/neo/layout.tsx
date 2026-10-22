import { Metadata } from "next";

export const metadata: Metadata = {
  manifest: "/neo/manifest.webmanifest",
};

export default function NeoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
