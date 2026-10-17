import { redirect } from "next/navigation";
import { getParentSession } from "@/lib/parent-auth";
import AccountView from "./AccountView";

export const metadata = { title: "My Account · North Legends FC" };

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const [session, params] = await Promise.all([getParentSession(), searchParams]);
  if (!session) redirect("/parent/login");
  return <AccountView account={session} welcome={params.welcome === "1"} />;
}
