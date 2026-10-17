import { redirect } from "next/navigation";
import { getParentSession } from "@/lib/parent-auth";
import LoginForm from "./LoginForm";

export const metadata = { title: "Parent Sign In · North Legends FC" };

export default async function LoginPage() {
  const session = await getParentSession();
  if (session) redirect("/parent/account");
  return <LoginForm />;
}
