import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SignOutButton } from "./sign-out-button";

export default async function AccountPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <main>
      <h1>My account</h1>
      <p>Name: {session.user.name}</p>
      <p>Email: {session.user.email}</p>
      <SignOutButton />
    </main>
  );
}
