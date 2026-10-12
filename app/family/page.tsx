import { redirect } from "next/navigation";
import { getFamilySession } from "@/lib/family-auth";
import FamilyLogin from "./FamilyLogin";

export const metadata = { title: "Team Access · North Legends FC" };

export default async function FamilyPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const authed = await getFamilySession();
  const destination = next && next.startsWith("/") ? next : "/videos";

  if (authed) redirect(destination);
  return <FamilyLogin next={destination} />;
}
