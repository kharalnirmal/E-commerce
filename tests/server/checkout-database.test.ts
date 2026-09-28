import { beforeEach, describe, expect, it } from "vitest";
import type { DeliveryAddress } from "@/lib/checkout";

const databaseTest = describe.skipIf(!process.env.TEST_DATABASE_URL);
const address: DeliveryAddress = {
  recipientName: "Checkout Tester",
  phone: "9841234567",
  province: "Bagmati",
  district: "Kathmandu",
  municipality: "Kathmandu Metropolitan City",
  ward: "10",
  streetAddress: "New Baneshwor",
  landmark: "Water tank",
};

async function signedResponse(transactionUuid: string, totalAmount: string, status = "COMPLETE") {
  const { signEsewaMessage } = await import("@/lib/esewa");
  const payload = {
    transaction_code: "MOCK-VERIFIED",
    status,
    total_amount: totalAmount,
    transaction_uuid: transactionUuid,
    product_code: "EPAYTEST",
    signed_field_names: "transaction_code,status,total_amount,transaction_uuid,product_code,signed_field_names",
  };
  const message = payload.signed_field_names.split(",").map((field) => `${field}=${payload[field as keyof typeof payload]}`).join(",");
  return Buffer.from(JSON.stringify({ ...payload, signature: signEsewaMessage(message, "test-only-esewa-secret") })).toString("base64");
}

databaseTest.sequential("checkout database boundaries", () => {
  beforeEach(async () => {
    process.env.ESEWA_GATEWAY_MODE = "mock";
    process.env.ESEWA_SECRET = "test-only-esewa-secret";
    const { restoreCanonicalDemo } = await import("@/lib/demo-server");
    await restoreCanonicalDemo();
  });

  it("rejects a stale cart price token", async () => {
    const [{ prisma }, checkout, { demoIdentities }] = await Promise.all([import("@/lib/prisma"), import("@/lib/checkout-service"), import("@/lib/demo")]);
    const user = await prisma.user.findUniqueOrThrow({ where: { email: demoIdentities.suraj.email } });
    const preview = await checkout.getCheckoutPreview(user.id);
    await prisma.product.update({ where: { id: preview.items[0].product.id }, data: { price: { increment: 1 } } });
    await expect(checkout.createCheckout(user.id, address, preview.token)).resolves.toEqual({ error: "Your cart changed. Review current prices and quantities before paying." });
  });

  it("allows only one shopper to reserve the final unit", async () => {
    const [{ prisma }, checkout, { demoIdentities }] = await Promise.all([import("@/lib/prisma"), import("@/lib/checkout-service"), import("@/lib/demo")]);
    const [suraj, aadarsh, product] = await Promise.all([
      prisma.user.findUniqueOrThrow({ where: { email: demoIdentities.suraj.email } }),
      prisma.user.findUniqueOrThrow({ where: { email: demoIdentities.aadarsh.email } }),
      prisma.product.findUniqueOrThrow({ where: { slug: "kathmandu-carry-all" } }),
    ]);
    await prisma.product.update({ where: { id: product.id }, data: { stock: 1 } });
    await prisma.cartItem.deleteMany({ where: { productId: { not: product.id } } });
    await prisma.cartItem.upsert({ where: { userId_productId: { userId: aadarsh.id, productId: product.id } }, create: { userId: aadarsh.id, productId: product.id, quantity: 1 }, update: { quantity: 1 } });
    const [surajPreview, aadarshPreview] = await Promise.all([checkout.getCheckoutPreview(suraj.id), checkout.getCheckoutPreview(aadarsh.id)]);

    const results = await Promise.all([
      checkout.createCheckout(suraj.id, address, surajPreview.token),
      checkout.createCheckout(aadarsh.id, address, aadarshPreview.token),
    ]);
    expect(results.filter((result) => !("error" in result))).toHaveLength(1);
    expect(await prisma.inventoryReservation.count()).toBe(1);
  });

  it("expires abandoned inventory and permits a fresh retry", async () => {
    const [{ prisma }, checkout, { demoIdentities }] = await Promise.all([import("@/lib/prisma"), import("@/lib/checkout-service"), import("@/lib/demo")]);
    const user = await prisma.user.findUniqueOrThrow({ where: { email: demoIdentities.suraj.email } });
    const preview = await checkout.getCheckoutPreview(user.id);
    const started = await checkout.createCheckout(user.id, address, preview.token, new Date("2026-09-28T00:00:00Z"));
    if ("error" in started) throw new Error(started.error);
    expect(await checkout.cleanupExpiredReservations(new Date("2026-09-28T00:11:00Z"))).toBe(1);
    const retried = await checkout.retryCheckout(user.id, started.orderId, new Date("2026-09-28T00:11:00Z"));
    expect(retried).toMatchObject({ orderId: started.orderId });
    expect(await prisma.payment.findMany({ where: { orderId: started.orderId }, orderBy: { attemptNumber: "asc" }, select: { status: true } })).toEqual([{ status: "ABANDONED" }, { status: "PENDING" }]);
  });

  it("fulfills a verified callback once and clears only the purchaser cart", async () => {
    const [{ prisma }, checkout, { demoIdentities }] = await Promise.all([import("@/lib/prisma"), import("@/lib/checkout-service"), import("@/lib/demo")]);
    const user = await prisma.user.findUniqueOrThrow({ where: { email: demoIdentities.suraj.email } });
    const preview = await checkout.getCheckoutPreview(user.id);
    const started = await checkout.createCheckout(user.id, address, preview.token);
    if ("error" in started) throw new Error(started.error);
    const payment = await prisma.payment.findUniqueOrThrow({ where: { id: started.paymentId } });
    const callback = await signedResponse(started.transactionId, payment.amount.toString());
    const before = await prisma.product.findUniqueOrThrow({ where: { id: preview.items[0].product.id } });

    await expect(checkout.completeVerifiedPayment(callback)).resolves.toMatchObject({ orderId: started.orderId, outcome: "success" });
    await expect(checkout.completeVerifiedPayment(callback)).resolves.toMatchObject({ orderId: started.orderId, outcome: "success" });

    const after = await prisma.product.findUniqueOrThrow({ where: { id: before.id } });
    expect(after.stock).toBe(before.stock - preview.items[0].quantity);
    expect(await prisma.orderTimelineEvent.count({ where: { orderId: started.orderId, type: "PAYMENT_VERIFIED" } })).toBe(1);
    expect(await prisma.cartItem.count({ where: { userId: user.id } })).toBe(0);
  });

  it("keeps pending callbacks unresolved and authorizes manual reconciliation", async () => {
    const [{ prisma }, checkout, { demoIdentities }] = await Promise.all([import("@/lib/prisma"), import("@/lib/checkout-service"), import("@/lib/demo")]);
    const [owner, anotherUser] = await Promise.all([
      prisma.user.findUniqueOrThrow({ where: { email: demoIdentities.suraj.email } }),
      prisma.user.findUniqueOrThrow({ where: { email: demoIdentities.aadarsh.email } }),
    ]);
    const preview = await checkout.getCheckoutPreview(owner.id);
    const started = await checkout.createCheckout(owner.id, address, preview.token);
    if ("error" in started) throw new Error(started.error);
    const payment = await prisma.payment.findUniqueOrThrow({ where: { id: started.paymentId } });

    await expect(checkout.completeVerifiedPayment(await signedResponse(started.transactionId, payment.amount.toString(), "PENDING"))).resolves.toEqual({
      orderId: started.orderId,
      outcome: "pending",
    });
    await expect(checkout.reconcileCustomerPayment(anotherUser.id, started.orderId)).resolves.toEqual({ error: "No unresolved payment is available to check." });
    await expect(checkout.reconcileCustomerPayment(owner.id, started.orderId)).resolves.toEqual({ orderId: started.orderId, outcome: "pending" });
    expect(await prisma.payment.findUniqueOrThrow({ where: { id: started.paymentId }, select: { status: true } })).toEqual({ status: "PENDING" });
    expect(await prisma.order.findUniqueOrThrow({ where: { id: started.orderId }, select: { status: true } })).toEqual({ status: "PENDING" });
  });
});
