import { redirect } from "next/navigation";
import { getParentSession } from "@/lib/parent-auth";
import RegisterForm from "./RegisterForm";

export const metadata = { title: "Create Parent Account · North Legends FC" };

export default async function RegisterPage() {
  const session = await getParentSession();
  if (session) redirect("/parent/account");
  return <RegisterForm />;
}
