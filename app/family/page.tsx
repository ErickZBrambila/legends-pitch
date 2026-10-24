import { redirect } from "next/navigation";
import { getFamilySession } from "@/lib/family-auth";
import FamilyLogin from "./FamilyLogin";
import { safeNextPath } from "@/lib/family-access";

export const metadata = { title: "Team Access · North Legends FC" };

export default async function FamilyPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const authed = await getFamilySession();
  // Reject "//evil.com"-style values, which browsers treat as another site.
  const destination = safeNextPath(next);

  if (authed) redirect(destination);
  return <FamilyLogin next={destination} />;
}
