import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { canResetDemo, isDemoEnabled, isResetConfirmation } from "@/lib/demo";
import { restoreCanonicalDemo } from "@/lib/demo-server";

export async function POST(request: Request) {
  if (!isDemoEnabled()) return Response.json({ message: "Not found." }, { status: 404 });

  const session = await auth.api.getSession({ headers: await headers() });
  if (!canResetDemo(session?.user.email)) {
    return Response.json({ message: "Only Nirmal can restore the demo." }, { status: 403 });
  }

  const body: unknown = await request.json().catch(() => null);
  const confirmation = body && typeof body === "object" && "confirmation" in body
    ? body.confirmation
    : null;
  if (!isResetConfirmation(confirmation)) {
    return Response.json({ message: "Invalid confirmation." }, { status: 400 });
  }

  await restoreCanonicalDemo();
  revalidatePath("/", "layout");
  return Response.json({ message: "Canonical demo restored." });
}
