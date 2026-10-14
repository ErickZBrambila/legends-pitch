import { redirect } from "next/navigation";
import { getNeoSession } from "@/lib/neo-auth";
import NeoLogin from "./NeoLogin";

export const metadata = { title: "// ACCESS REQUIRED" };

export default async function NeoLoginPage() {
  const authed = await getNeoSession();
  if (authed) redirect("/neo");
  return <NeoLogin />;
}
