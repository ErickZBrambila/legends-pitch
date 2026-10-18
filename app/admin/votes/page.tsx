import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getAdminSession } from "@/lib/admin-auth";
import { getAllVotes } from "@/lib/votes";
import CoachVotes from "./CoachVotes";

export const metadata = { title: "⚙ Votes · Admin" };

export default async function CoachVotesPage() {
  const authed = await getAdminSession();
  if (!authed) redirect("/admin");

  const [votes, locale] = await Promise.all([getAllVotes(), getLocale()]);

  return <CoachVotes initialVotes={votes} locale={locale} />;
}
