import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import RegisterForm from "./RegisterForm";

export const metadata = { title: "Request Access · NLFC Admin" };

export default async function AdminRegisterPage() {
  const session = await getAdminSession();
  if (session) redirect("/admin/dashboard");
  return <RegisterForm />;
}
