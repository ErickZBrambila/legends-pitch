import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import NeoLogin from "./NeoLogin";

export const metadata = { title: "// ACCESS REQUIRED" };

export default async function NeoLoginPage() {
  const authed = await getAdminSession();
  if (authed) redirect("/neo");
  return <NeoLogin />;
}
