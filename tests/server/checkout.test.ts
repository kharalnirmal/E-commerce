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
});
