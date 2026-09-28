import { describe, expect, it } from "vitest";
import {
  DELIVERY_FEE_PAISA,
  calculateCheckoutTotals,
  parseDeliveryAddress,
} from "@/lib/checkout";
import {
  buildEsewaPaymentRequest,
  decodeAndVerifyEsewaResponse,
  signEsewaMessage,
} from "@/lib/esewa";
import { getEsewaConfig, verifyEsewaTransaction } from "@/lib/esewa-gateway";

const validAddress = {
  recipientName: "Suraj Kharal",
  phone: "9841234567",
  province: "Bagmati",
  district: "Kathmandu",
  municipality: "Kathmandu Metropolitan City",
  ward: "10",
  streetAddress: "New Baneshwor",
  landmark: "Near the old water tank",
};

describe("checkout rules", () => {
  it("charges delivery through NPR 5,000 and waives it only above the threshold", () => {
    expect(calculateCheckoutTotals(500_000)).toEqual({
      subtotalPaisa: 500_000,
      deliveryFeePaisa: DELIVERY_FEE_PAISA,
      totalPaisa: 515_000,
    });
    expect(calculateCheckoutTotals(500_001)).toEqual({
      subtotalPaisa: 500_001,
      deliveryFeePaisa: 0,
      totalPaisa: 500_001,
    });
  });

  it("validates and normalizes a structured Nepal delivery address", () => {
    expect(parseDeliveryAddress(validAddress)).toEqual(validAddress);
    expect(parseDeliveryAddress({ ...validAddress, phone: "123", ward: "0" })).toEqual({
      error: "Enter a valid Nepal mobile number and ward number.",
    });
    expect(parseDeliveryAddress({ ...validAddress, municipality: " " })).toEqual({
      error: "Complete every required delivery-address field.",
    });
  });
});

describe("eSewa gateway messages", () => {
  it("requires an explicit gateway mode and keeps mock, UAT, and production distinct", () => {
    expect(() => getEsewaConfig({})).toThrow("ESEWA_GATEWAY_MODE");
    expect(() => getEsewaConfig({ ESEWA_GATEWAY_MODE: "live" })).toThrow("mock, uat, or production");

    expect(getEsewaConfig({ ESEWA_GATEWAY_MODE: "mock", APP_URL: "http://localhost:3000" })).toMatchObject({
      mode: "mock",
      productCode: "EPAYTEST",
      paymentUrl: "http://localhost:3000/api/payments/esewa/mock",
    });

    const hosted = {
      APP_URL: "https://shop.test",
      ESEWA_PRODUCT_CODE: "EPAYTEST",
      ESEWA_SECRET: "sandbox-secret",
      ESEWA_PAYMENT_URL: "https://rc-epay.esewa.com.np/api/epay/main/v2/form",
      ESEWA_STATUS_URL: "https://uat.esewa.com.np/api/epay/transaction/status/",
    };
    expect(getEsewaConfig({ ...hosted, ESEWA_GATEWAY_MODE: "uat" }).mode).toBe("uat");
    expect(getEsewaConfig({
      ...hosted,
      ESEWA_GATEWAY_MODE: "production",
      ESEWA_PAYMENT_URL: "https://epay.esewa.com.np/api/epay/main/v2/form",
      ESEWA_STATUS_URL: "https://epay.esewa.com.np/api/epay/transaction/status/",
    }).mode).toBe("production");
  });

  it("rejects mode-specific hosted gateway mistakes", () => {
    expect(() => getEsewaConfig({
      ESEWA_GATEWAY_MODE: "uat",
      APP_URL: "http://localhost:3000",
      ESEWA_PRODUCT_CODE: "EPAYTEST",
      ESEWA_SECRET: "sandbox-secret",
      ESEWA_PAYMENT_URL: "https://rc-epay.esewa.com.np/api/epay/main/v2/form",
      ESEWA_STATUS_URL: "https://uat.esewa.com.np/api/epay/transaction/status/",
    })).toThrow("public HTTPS APP_URL");
    expect(() => getEsewaConfig({
      ESEWA_GATEWAY_MODE: "production",
      APP_URL: "https://shop.test",
      ESEWA_PRODUCT_CODE: "EPAYTEST",
      ESEWA_SECRET: "secret",
      ESEWA_PAYMENT_URL: "https://rc-epay.esewa.com.np/api/epay/main/v2/form",
      ESEWA_STATUS_URL: "https://uat.esewa.com.np/api/epay/transaction/status/",
    })).toThrow("matching production eSewa endpoints");
  });

  it("signs the merchant-controlled payment request", () => {
    const request = buildEsewaPaymentRequest({
      amountPaisa: 500_000,
      deliveryFeePaisa: 15_000,
      transactionUuid: "payment-123",
      productCode: "EPAYTEST",
      secret: "8gBm/:&EnhH.1/q",
      successUrl: "https://shop.test/api/payments/esewa/success",
      failureUrl: "https://shop.test/api/payments/esewa/failure?attempt=payment-123",
      paymentUrl: "https://gateway.test/form",
    });

    expect(request.url).toBe("https://gateway.test/form");
    expect(request.fields).toMatchObject({
      amount: "5000",
      product_delivery_charge: "150",
      total_amount: "5150",
      transaction_uuid: "payment-123",
      signed_field_names: "total_amount,transaction_uuid,product_code",
      signature: "AXOUquuZYxAaX9atZjlYeiIHEZElOzWmKKVayMjjb9U=",
    });
  });

  it("rejects tampering and returns a verified callback payload", () => {
    const payload = {
      transaction_code: "0004T5I",
      status: "COMPLETE",
      total_amount: "5150",
      transaction_uuid: "payment-123",
      product_code: "EPAYTEST",
      signed_field_names: "transaction_code,status,total_amount,transaction_uuid,product_code,signed_field_names",
    };
    const message = payload.signed_field_names
      .split(",")
      .map((field) => `${field}=${payload[field as keyof typeof payload]}`)
      .join(",");
    const encoded = Buffer.from(JSON.stringify({
      ...payload,
      signature: signEsewaMessage(message, "8gBm/:&EnhH.1/q"),
    })).toString("base64");
    const signed = decodeAndVerifyEsewaResponse(encoded, "8gBm/:&EnhH.1/q");
    expect(signed).toMatchObject({ transactionUuid: "payment-123", status: "COMPLETE" });

    const tampered = Buffer.from(Buffer.from(encoded, "base64").toString().replace("5150", "1")).toString("base64");
    expect(() => decodeAndVerifyEsewaResponse(tampered, "8gBm/:&EnhH.1/q")).toThrow("signature");
  });

  it("binds hosted status responses to amount and transaction identity", async () => {
    const config = getEsewaConfig({
      ESEWA_GATEWAY_MODE: "uat",
      APP_URL: "https://shop.test",
      ESEWA_PRODUCT_CODE: "EPAYTEST",
      ESEWA_SECRET: "sandbox-secret",
      ESEWA_PAYMENT_URL: "https://rc-epay.esewa.com.np/api/epay/main/v2/form",
      ESEWA_STATUS_URL: "https://uat.esewa.com.np/api/epay/transaction/status/",
    });
    const response = {
      transactionUuid: "payment-123",
      transactionCode: "0004T5I",
      status: "COMPLETE",
      totalAmount: "5150",
      productCode: "EPAYTEST",
    };
    const matchingFetch = async () => Response.json({
      status: "COMPLETE",
      total_amount: "5150",
      pid: "payment-123",
      scd: "EPAYTEST",
      refId: "0004T5I",
    });
    expect(await verifyEsewaTransaction(response, 515_000, config, matchingFetch)).toEqual({ outcome: "complete", referenceId: "0004T5I" });
    expect(await verifyEsewaTransaction({ ...response, transactionCode: "" }, 515_000, config, matchingFetch)).toEqual({ outcome: "complete", referenceId: "0004T5I" });

    const mismatchedFetch = async () => Response.json({
      status: "COMPLETE",
      total_amount: "5150",
      pid: "another-payment",
      scd: "EPAYTEST",
      refId: "0004T5I",
    });
    expect(await verifyEsewaTransaction(response, 515_000, config, mismatchedFetch)).toEqual({ outcome: "mismatch" });
  });

  it("keeps pending and unavailable verification non-terminal", async () => {
    const config = getEsewaConfig({
      ESEWA_GATEWAY_MODE: "uat",
      APP_URL: "https://shop.test",
      ESEWA_PRODUCT_CODE: "EPAYTEST",
      ESEWA_SECRET: "sandbox-secret",
      ESEWA_PAYMENT_URL: "https://rc-epay.esewa.com.np/api/epay/main/v2/form",
      ESEWA_STATUS_URL: "https://uat.esewa.com.np/api/epay/transaction/status/",
    });
    const response = {
      transactionUuid: "payment-123",
      transactionCode: "0004T5I",
      status: "PENDING",
      totalAmount: "5150",
      productCode: "EPAYTEST",
    };
    expect(await verifyEsewaTransaction(response, 515_000, config, async () => Response.json({ status: "PENDING", totalAmount: "5150", pid: "payment-123", scd: "EPAYTEST", refId: null }))).toEqual({ outcome: "pending" });
    expect(await verifyEsewaTransaction(response, 515_000, config, async () => Response.json({ status: "AMBIGUOUS", totalAmount: "5150", pid: "payment-123", scd: "EPAYTEST", refId: "0004T5I" }))).toEqual({ outcome: "pending" });
    expect(await verifyEsewaTransaction(response, 515_000, config, async () => new Response(null, { status: 503 }))).toEqual({ outcome: "unavailable" });
  });
});
