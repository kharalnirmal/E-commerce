import { beforeEach, describe, expect, it } from "vitest";
import type { DeliveryAddress } from "@/lib/checkout";

const databaseTest = describe.skipIf(!process.env.TEST_DATABASE_URL);
const address: DeliveryAddress = {
  recipientName: "Order Tester",
  phone: "9841234567",
  province: "Bagmati",
  district: "Kathmandu",
  municipality: "Kathmandu Metropolitan City",
  ward: "10",
  streetAddress: "New Baneshwor",
  landmark: "Water tank",
};

async function signedSuccess(transactionUuid: string, totalAmount: string) {
  const { signEsewaMessage } = await import("@/lib/esewa");
  const payload = {
    transaction_code: "MOCK-ORDER-WORKFLOW",
    status: "COMPLETE",
    total_amount: totalAmount,
    transaction_uuid: transactionUuid,
    product_code: "EPAYTEST",
    signed_field_names: "transaction_code,status,total_amount,transaction_uuid,product_code,signed_field_names",
  };
  const message = payload.signed_field_names.split(",").map((field) => `${field}=${payload[field as keyof typeof payload]}`).join(",");
  return Buffer.from(JSON.stringify({ ...payload, signature: signEsewaMessage(message, "test-only-esewa-secret") })).toString("base64");
}

databaseTest.sequential("order workflow database boundaries", () => {
  beforeEach(async () => {
    process.env.ESEWA_GATEWAY_MODE = "mock";
    process.env.ESEWA_SECRET = "test-only-esewa-secret";
    const { restoreCanonicalDemo } = await import("@/lib/demo-server");
    await restoreCanonicalDemo();
  });

  it("enforces ownership and cancels unpaid inventory reservations once", async () => {
    const [{ prisma }, checkout, orders, { demoIdentities }] = await Promise.all([
      import("@/lib/prisma"), import("@/lib/checkout-service"), import("@/lib/order-service"), import("@/lib/demo"),
    ]);
    const [suraj, aadarsh] = await Promise.all([
      prisma.user.findUniqueOrThrow({ where: { email: demoIdentities.suraj.email } }),
      prisma.user.findUniqueOrThrow({ where: { email: demoIdentities.aadarsh.email } }),
    ]);
    const preview = await checkout.getCheckoutPreview(suraj.id);
    const started = await checkout.createCheckout(suraj.id, address, preview.token);
    if ("error" in started) throw new Error(started.error);
    const beforeStock = preview.items.map((item) => [item.product.id, item.product.stock] as const);

    await expect(orders.cancelCustomerOrder(aadarsh.id, started.orderId)).resolves.toEqual({ error: "Order not found." });
    await Promise.all([
      orders.cancelCustomerOrder(suraj.id, started.orderId),
      orders.cancelCustomerOrder(suraj.id, started.orderId),
    ]);

    expect(await prisma.order.findUniqueOrThrow({ where: { id: started.orderId }, select: { status: true } })).toEqual({ status: "CANCELLED" });
    expect(await prisma.inventoryReservation.count({ where: { orderId: started.orderId, releasedAt: { not: null } } })).toBe(1);
    expect(await prisma.orderTimelineEvent.count({ where: { orderId: started.orderId, type: "ORDER_CANCELLED" } })).toBe(1);
    for (const [productId, stock] of beforeStock) {
      expect((await prisma.product.findUniqueOrThrow({ where: { id: productId }, select: { stock: true } })).stock).toBe(stock);
    }
  });

  it("requests then confirms a paid refund and restores stock exactly once", async () => {
    const [{ prisma }, checkout, orders, { demoIdentities }] = await Promise.all([
      import("@/lib/prisma"), import("@/lib/checkout-service"), import("@/lib/order-service"), import("@/lib/demo"),
    ]);
    const [customer, administrator] = await Promise.all([
      prisma.user.findUniqueOrThrow({ where: { email: demoIdentities.suraj.email } }),
      prisma.user.findUniqueOrThrow({ where: { email: demoIdentities.nirmal.email } }),
    ]);
    const preview = await checkout.getCheckoutPreview(customer.id);
    const started = await checkout.createCheckout(customer.id, address, preview.token);
    if ("error" in started) throw new Error(started.error);
    const payment = await prisma.payment.findUniqueOrThrow({ where: { id: started.paymentId } });
    await checkout.completeVerifiedPayment(await signedSuccess(started.transactionId, payment.amount.toString()));

    await orders.cancelCustomerOrder(customer.id, started.orderId);
    expect(await prisma.order.findUniqueOrThrow({ where: { id: started.orderId }, select: { status: true } })).toEqual({ status: "REFUND_PENDING" });
    await Promise.all([
      orders.confirmManualRefund(started.orderId, administrator.id, administrator.name),
      orders.confirmManualRefund(started.orderId, administrator.id, administrator.name),
    ]);

    expect(await prisma.order.findUniqueOrThrow({ where: { id: started.orderId }, select: { status: true } })).toEqual({ status: "REFUNDED" });
    expect(await prisma.payment.findUniqueOrThrow({ where: { id: started.paymentId }, select: { status: true, refundedAt: true } })).toMatchObject({ status: "REFUNDED", refundedAt: expect.any(Date) });
    expect(await prisma.orderTimelineEvent.count({ where: { orderId: started.orderId, type: "REFUND_CONFIRMED" } })).toBe(1);
    expect(await prisma.stockAdjustment.count({ where: { reason: `Manual refund for order ${started.displayNumber}` } })).toBe(preview.items.length);
    for (const item of preview.items) {
      expect((await prisma.product.findUniqueOrThrow({ where: { id: item.product.id }, select: { stock: true } })).stock).toBe(item.product.stock);
    }
  });

  it("rejects impossible fulfillment transitions", async () => {
    const [{ prisma }, checkout, orders, { demoIdentities }] = await Promise.all([
      import("@/lib/prisma"), import("@/lib/checkout-service"), import("@/lib/order-service"), import("@/lib/demo"),
    ]);
    const customer = await prisma.user.findUniqueOrThrow({ where: { email: demoIdentities.suraj.email } });
    const preview = await checkout.getCheckoutPreview(customer.id);
    const started = await checkout.createCheckout(customer.id, address, preview.token);
    if ("error" in started) throw new Error(started.error);
    const payment = await prisma.payment.findUniqueOrThrow({ where: { id: started.paymentId } });
    await checkout.completeVerifiedPayment(await signedSuccess(started.transactionId, payment.amount.toString()));

    await expect(orders.updateFulfillment(started.orderId, "DELIVERED")).resolves.toEqual({ error: "Only shipped orders can be marked as delivered." });
    await expect(orders.updateFulfillment(started.orderId, "SHIPPED")).resolves.toMatchObject({ status: "SHIPPED" });
    await expect(orders.cancelCustomerOrder(customer.id, started.orderId)).resolves.toEqual({ error: "This order can no longer be cancelled." });
    await expect(orders.updateFulfillment(started.orderId, "DELIVERED")).resolves.toMatchObject({ status: "DELIVERED" });
    await expect(orders.updateFulfillment(started.orderId, "SHIPPED")).resolves.toEqual({ error: "Delivered orders cannot change fulfillment state." });
  });
});
