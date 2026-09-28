import { createHmac, timingSafeEqual } from "node:crypto";
import { formatGatewayAmount } from "@/lib/checkout";

export type EsewaResponse = {
  transactionUuid: string;
  transactionCode: string;
  status: string;
  totalAmount: string;
  productCode: string;
};

export function signEsewaMessage(message: string, secret: string) {
  return createHmac("sha256", secret).update(message, "utf8").digest("base64");
}

export function buildEsewaPaymentRequest(input: {
  amountPaisa: number;
  deliveryFeePaisa: number;
  transactionUuid: string;
  productCode: string;
  secret: string;
  successUrl: string;
  failureUrl: string;
  paymentUrl: string;
}) {
  const amount = formatGatewayAmount(input.amountPaisa);
  const delivery = formatGatewayAmount(input.deliveryFeePaisa);
  const total = formatGatewayAmount(input.amountPaisa + input.deliveryFeePaisa);
  const message = `total_amount=${total},transaction_uuid=${input.transactionUuid},product_code=${input.productCode}`;
  return {
    url: input.paymentUrl,
    fields: {
      amount,
      tax_amount: "0",
      total_amount: total,
      transaction_uuid: input.transactionUuid,
      product_code: input.productCode,
      product_service_charge: "0",
      product_delivery_charge: delivery,
      success_url: input.successUrl,
      failure_url: input.failureUrl,
      signed_field_names: "total_amount,transaction_uuid,product_code",
      signature: signEsewaMessage(message, input.secret),
    },
  };
}

export function decodeAndVerifyEsewaResponse(encoded: string, secret: string): EsewaResponse {
  let value: unknown;
  try {
    value = JSON.parse(Buffer.from(encoded, "base64").toString("utf8"));
  } catch {
    throw new Error("Invalid eSewa response payload.");
  }
  if (!value || typeof value !== "object") throw new Error("Invalid eSewa response payload.");
  const payload = value as Record<string, unknown>;
  const required = ["transaction_code", "status", "total_amount", "transaction_uuid", "product_code", "signed_field_names", "signature"];
  if (required.some((field) => typeof payload[field] !== "string" && typeof payload[field] !== "number")) {
    throw new Error("Invalid eSewa response payload.");
  }
  const signedFields = String(payload.signed_field_names).split(",");
  if (!required.slice(0, 6).every((field) => signedFields.includes(field)) || signedFields.some((field) => !(field in payload))) {
    throw new Error("Invalid eSewa signed fields.");
  }
  const message = signedFields.map((field) => `${field}=${String(payload[field])}`).join(",");
  const expected = Buffer.from(signEsewaMessage(message, secret));
  const received = Buffer.from(String(payload.signature));
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    throw new Error("Invalid eSewa response signature.");
  }
  return {
    transactionUuid: String(payload.transaction_uuid),
    transactionCode: String(payload.transaction_code),
    status: String(payload.status),
    totalAmount: String(payload.total_amount),
    productCode: String(payload.product_code),
  };
}
