import "server-only";

import { buildEsewaPaymentRequest, type EsewaResponse } from "@/lib/esewa";
import { formatGatewayAmount } from "@/lib/checkout";

export type EsewaMode = "mock" | "uat" | "production";

export type EsewaConfig = {
  mode: EsewaMode;
  productCode: string;
  secret: string;
  paymentUrl: string;
  statusUrl: string;
  appUrl: string;
};

type EsewaEnvironment = Record<string, string | undefined>;

function parseUrl(value: string, label: string) {
  try {
    return new URL(value);
  } catch {
    throw new Error(`${label} must be a valid URL.`);
  }
}

export function getEsewaConfig(environment: EsewaEnvironment = process.env): EsewaConfig {
  const mode = environment.ESEWA_GATEWAY_MODE;
  if (!mode) throw new Error("ESEWA_GATEWAY_MODE must be set to mock, uat, or production.");
  if (mode !== "mock" && mode !== "uat" && mode !== "production") {
    throw new Error("ESEWA_GATEWAY_MODE must be mock, uat, or production.");
  }
  const appUrl = environment.APP_URL ?? environment.BETTER_AUTH_URL ?? "http://localhost:3000";
  if (mode === "mock") {
    return {
      mode,
      productCode: "EPAYTEST",
      secret: environment.ESEWA_SECRET ?? "test-only-esewa-secret",
      paymentUrl: `${appUrl}/api/payments/esewa/mock`,
      statusUrl: "mock://esewa/status",
      appUrl,
    };
  }
  const productCode = environment.ESEWA_PRODUCT_CODE;
  const secret = environment.ESEWA_SECRET;
  const paymentUrl = environment.ESEWA_PAYMENT_URL;
  const statusUrl = environment.ESEWA_STATUS_URL;
  if (!productCode || !secret || !paymentUrl || !statusUrl || !environment.APP_URL) {
    throw new Error("eSewa gateway configuration is incomplete.");
  }
  const app = parseUrl(appUrl, "APP_URL");
  const payment = parseUrl(paymentUrl, "ESEWA_PAYMENT_URL");
  const status = parseUrl(statusUrl, "ESEWA_STATUS_URL");
  if (app.protocol !== "https:") throw new Error("Hosted eSewa modes require a public HTTPS APP_URL for callbacks.");
  if (payment.protocol !== "https:" || status.protocol !== "https:") throw new Error("Hosted eSewa endpoints must use HTTPS.");
  const expectedHosts = mode === "uat"
    ? { payment: "rc-epay.esewa.com.np", status: "uat.esewa.com.np" }
    : { payment: "epay.esewa.com.np", status: "epay.esewa.com.np" };
  if (payment.hostname !== expectedHosts.payment || status.hostname !== expectedHosts.status) {
    throw new Error(`${mode === "uat" ? "UAT" : "Production"} mode requires matching ${mode} eSewa endpoints.`);
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
    successUrl: `${config.appUrl}/api/payments/esewa/success?attempt=${encodeURIComponent(input.transactionId)}`,
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
  const callbackStatus = response.status.toUpperCase();
  if (config.mode === "mock") {
    if (callbackStatus === "COMPLETE") return { outcome: "complete", referenceId: response.transactionCode } as const;
    if (callbackStatus === "PENDING") return { outcome: "pending" } as const;
    return { outcome: "failed" } as const;
  }
  const url = new URL(config.statusUrl);
  url.searchParams.set("product_code", config.productCode);
  url.searchParams.set("total_amount", formatGatewayAmount(expectedPaisa));
  url.searchParams.set("transaction_uuid", response.transactionUuid);
  let result: Response;
  try {
    result = await fetcher(url, { headers: { accept: "application/json" }, cache: "no-store" });
  } catch {
    return { outcome: "unavailable" } as const;
  }
  if (!result.ok) return { outcome: "unavailable" } as const;
  let payload: {
    status?: unknown;
    ref_id?: unknown;
    refId?: unknown;
    total_amount?: unknown;
    totalAmount?: unknown;
    transaction_uuid?: unknown;
    transactionUuid?: unknown;
    product_code?: unknown;
    productCode?: unknown;
    pid?: unknown;
    scd?: unknown;
    code?: unknown;
    error_message?: unknown;
  };
  try {
    payload = await result.json();
  } catch {
    return { outcome: "unavailable" } as const;
  }
  const statusValue = String(payload.status ?? "").toUpperCase();
  if (!statusValue || payload.code === 0 || payload.error_message) return { outcome: "unavailable" } as const;
  const reportedAmount = String(payload.total_amount ?? payload.totalAmount ?? "");
  const transactionUuid = payload.pid ?? payload.transaction_uuid ?? payload.transactionUuid;
  const productCode = payload.scd ?? payload.product_code ?? payload.productCode;
  const referenceId = payload.ref_id ?? payload.refId;
  const identityMatches = reportedAmount !== ""
    && Number(reportedAmount) === Number(formatGatewayAmount(expectedPaisa))
    && String(transactionUuid ?? "") === response.transactionUuid
    && String(productCode ?? "") === config.productCode
    && (referenceId == null || !response.transactionCode || String(referenceId) === response.transactionCode);
  if (!identityMatches) return { outcome: "mismatch" } as const;
  if (statusValue === "PENDING" || statusValue === "AMBIGUOUS" || statusValue === "AMBIGIOUS") return { outcome: "pending" } as const;
  if (statusValue !== "COMPLETE") return { outcome: "failed" } as const;
  return { outcome: "complete", ...(referenceId === undefined ? {} : { referenceId: String(referenceId) }) } as const;
}
