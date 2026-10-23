import { redirect } from "next/navigation";
import { getParentSession } from "@/lib/parent-auth";
import { getFamilySession } from "@/lib/family-auth";
import RegisterForm from "./RegisterForm";

export const metadata = { title: "Create Parent Account · North Legends FC" };

export default async function RegisterPage() {
  const session = await getParentSession();
  if (session) redirect("/parent/account");

  const hasFamilyAccess = await getFamilySession();
  if (!hasFamilyAccess) redirect("/family?next=/parent/register");

  return <RegisterForm />;
}
