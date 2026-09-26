import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth } from "./auth";

export default async function requireAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  if (session.user?.role !== "ADMIN") {
    notFound();
  }
  return session.user;
}
