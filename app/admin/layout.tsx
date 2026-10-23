import { Metadata } from "next";

export const metadata: Metadata = {
  manifest: "/admin/manifest.webmanifest",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
