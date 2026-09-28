import { signEsewaMessage } from "@/lib/esewa";
import { getEsewaConfig } from "@/lib/esewa-gateway";

export async function POST(request: Request) {
  const config = getEsewaConfig();
  if (config.mode !== "mock") return new Response("Not found", { status: 404 });
  const form = await request.formData();
  const transactionUuid = String(form.get("transaction_uuid"));
  const payload = {
    transaction_code: `MOCK-${transactionUuid}`,
    status: "COMPLETE",
    total_amount: String(form.get("total_amount")),
    transaction_uuid: transactionUuid,
    product_code: String(form.get("product_code")),
    signed_field_names: "transaction_code,status,total_amount,transaction_uuid,product_code,signed_field_names",
  };
  const message = payload.signed_field_names.split(",").map((field) => `${field}=${payload[field as keyof typeof payload]}`).join(",");
  const data = Buffer.from(JSON.stringify({ ...payload, signature: signEsewaMessage(message, config.secret) })).toString("base64");
  const success = new URL(String(form.get("success_url")));
  success.searchParams.set("data", data);
  return Response.redirect(success, 303);
}
