import { auth } from "@/lib/auth";
import {
  demoIdentities,
  getDemoPassword,
  isDemoEnabled,
  isDemoIdentity,
} from "@/lib/demo";
import { ensureDemoIdentities } from "@/lib/demo-server";

export async function POST(request: Request) {
  if (!isDemoEnabled()) return Response.json({ message: "Not found." }, { status: 404 });

  const body: unknown = await request.json().catch(() => null);
  const identity = body && typeof body === "object" && "identity" in body
    ? body.identity
    : null;
  if (!isDemoIdentity(identity)) {
    return Response.json({ message: "Unknown demo identity." }, { status: 400 });
  }

  await ensureDemoIdentities();
  const response = await auth.handler(new Request(new URL("/api/auth/sign-in/email", request.url), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: demoIdentities[identity].email,
      password: getDemoPassword(),
      rememberMe: false,
    }),
  }));

  if (!response.ok) return Response.json({ message: "Could not switch identity." }, { status: 500 });
  const responseHeaders = new Headers({ "content-type": "application/json" });
  for (const cookie of response.headers.getSetCookie()) {
    responseHeaders.append("set-cookie", cookie);
  }
  return new Response(JSON.stringify({ destination: demoIdentities[identity].destination }), {
    status: 200,
    headers: responseHeaders,
  });
}
