import "server-only";

import { buildEsewaPaymentRequest, type EsewaResponse } from "@/lib/esewa";
import { formatGatewayAmount } from "@/lib/checkout";

export type EsewaConfig = {
  mode: "live" | "mock";
  productCode: string;
  secret: string;
  paymentUrl: string;
  statusUrl: string;
  appUrl: string;
};

export function getEsewaConfig(): EsewaConfig {
  const mode = process.env.ESEWA_GATEWAY_MODE === "mock" ? "mock" : "live";
  const appUrl = process.env.APP_URL ?? process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  if (mode === "mock") {
    return {
      mode,
      productCode: "EPAYTEST",
      secret: process.env.ESEWA_SECRET ?? "test-only-esewa-secret",
      paymentUrl: `${appUrl}/api/payments/esewa/mock`,
      statusUrl: "mock://esewa/status",
      appUrl,
    };
  }
  const productCode = process.env.ESEWA_PRODUCT_CODE;
  const secret = process.env.ESEWA_SECRET;
  const paymentUrl = process.env.ESEWA_PAYMENT_URL;
  const statusUrl = process.env.ESEWA_STATUS_URL;
  if (!productCode || !secret || !paymentUrl || !statusUrl || !process.env.APP_URL) {
    throw new Error("eSewa gateway configuration is incomplete.");
  }
  return { mode, productCode, secret, paymentUrl, statusUrl, appUrl };
}

export function paymentRequestForAttempt(input: {
  transactionId: string;
  subtotalPaisa: number;
  deliveryFeePaisa: number;
}, config = getEsewaConfig()) {
  return buildEsewaPaymentRequest({
    amountPaisa: input.subtotalPaisa,
    deliveryFeePaisa: input.deliveryFeePaisa,
    transactionUuid: input.transactionId,
    productCode: config.productCode,
    secret: config.secret,
    successUrl: `${config.appUrl}/api/payments/esewa/success`,
    failureUrl: `${config.appUrl}/api/payments/esewa/failure?attempt=${encodeURIComponent(input.transactionId)}`,
    paymentUrl: config.paymentUrl,
  });
}

export async function verifyEsewaTransaction(
  response: EsewaResponse,
  expectedPaisa: number,
  config = getEsewaConfig(),
  fetcher: typeof fetch = fetch,
) {
  if (response.status !== "COMPLETE") return false;
  if (config.mode === "mock") return true;
  const url = new URL(config.statusUrl);
  url.searchParams.set("product_code", config.productCode);
  url.searchParams.set("total_amount", formatGatewayAmount(expectedPaisa));
  url.searchParams.set("transaction_uuid", response.transactionUuid);
  const result = await fetcher(url, { headers: { accept: "application/json" }, cache: "no-store" });
  if (!result.ok) throw new Error("eSewa verification is temporarily unavailable.");
  const payload = await result.json() as { status?: unknown; ref_id?: unknown; refId?: unknown; total_amount?: unknown; totalAmount?: unknown };
  const reportedAmount = String(payload.total_amount ?? payload.totalAmount ?? "");
  return payload.status === "COMPLETE"
    && reportedAmount !== ""
    && Number(reportedAmount) === Number(formatGatewayAmount(expectedPaisa));
}
