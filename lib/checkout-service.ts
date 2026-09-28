import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { Prisma, PaymentStatus } from "@/generated/prisma/client";
import { calculateCheckoutTotals, RESERVATION_MINUTES, rupeesToPaisa, type DeliveryAddress } from "@/lib/checkout";
import { decodeAndVerifyEsewaResponse } from "@/lib/esewa";
import { getEsewaConfig, verifyEsewaTransaction } from "@/lib/esewa-gateway";
import { getReservedQuantities, lockInventory } from "@/lib/inventory";
import { prisma } from "@/lib/prisma";

type CheckoutCartItem = {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    sku: string;
    maker: string;
    imageUrl: string | null;
    price: Prisma.Decimal;
    stock: number;
    archivedAt: Date | null;
    category: { archivedAt: Date | null };
  };
};

const cartSelection = {
  id: true,
  quantity: true,
  product: {
    select: {
      id: true, name: true, sku: true, maker: true, imageUrl: true, price: true, stock: true, archivedAt: true,
      category: { select: { archivedAt: true } },
    },
  },
} as const;

export function checkoutCartToken(items: CheckoutCartItem[]) {
  return createHash("sha256")
    .update(items.map((item) => `${item.product.id}:${item.quantity}:${item.product.price.toFixed(2)}`).sort().join("|"))
    .digest("hex");
}

async function allocateDisplayNumber(tx: Prisma.TransactionClient, now: Date) {
  const year = now.getUTCFullYear();
  const sequence = await tx.orderNumberSequence.upsert({
    where: { year },
    create: { year, lastValue: 1 },
    update: { lastValue: { increment: 1 } },
  });
  return `CHK-${year}-${sequence.lastValue.toString().padStart(4, "0")}`;
}

async function expireReservations(tx: Prisma.TransactionClient, now: Date) {
  const expired = await tx.inventoryReservation.findMany({
    where: { expiresAt: { lte: now }, releasedAt: null, consumedAt: null },
    select: { id: true, orderId: true, paymentId: true },
  });
  if (!expired.length) return 0;
  await tx.inventoryReservation.updateMany({ where: { id: { in: expired.map((item) => item.id) } }, data: { releasedAt: now } });
  await tx.payment.updateMany({
    where: { id: { in: expired.map((item) => item.paymentId) }, status: PaymentStatus.PENDING },
    data: { status: PaymentStatus.ABANDONED, failureReason: "Reservation expired before verified payment." },
  });
  await tx.order.updateMany({
    where: { id: { in: expired.map((item) => item.orderId) }, status: "PENDING" },
    data: { status: "FAILED" },
  });
  await tx.orderTimelineEvent.createMany({
    data: expired.map((item) => ({ orderId: item.orderId, type: "PAYMENT_ABANDONED", detail: "The ten-minute inventory reservation expired.", dedupeKey: `reservation-expired:${item.id}` })),
    skipDuplicates: true,
  });
  return expired.length;
}

export async function cleanupExpiredReservations(now = new Date()) {
  return prisma.$transaction(async (tx) => {
    await lockInventory(tx);
    return expireReservations(tx, now);
  });
}

export async function getCheckoutPreview(userId: string) {
  const items = await prisma.cartItem.findMany({ where: { userId }, select: cartSelection, orderBy: { createdAt: "asc" } });
  const reserved = await getReservedQuantities();
  const subtotalPaisa = items.reduce((sum, item) => sum + rupeesToPaisa(item.product.price) * item.quantity, 0);
  return {
    items: items.map((item) => ({ ...item, availableStock: Math.max(0, item.product.stock - (reserved.get(item.product.id) ?? 0)) })),
    token: checkoutCartToken(items),
    ...calculateCheckoutTotals(subtotalPaisa),
  };
}

function validateItems(items: CheckoutCartItem[], reserved: Map<string, number>) {
  if (!items.length) return "Your cart is empty.";
  for (const item of items) {
    const available = item.product.stock - (reserved.get(item.product.id) ?? 0);
    if (item.product.archivedAt || item.product.category.archivedAt) return `${item.product.name} is no longer active.`;
    if (item.quantity < 1 || item.quantity > 99 || item.quantity > available) return `There is not enough available stock for ${item.product.name}.`;
  }
  return null;
}

export async function createCheckout(userId: string, address: DeliveryAddress, expectedCartToken: string, now = new Date()) {
  return prisma.$transaction(async (tx) => {
    await lockInventory(tx);
    await expireReservations(tx, now);
    const items = await tx.cartItem.findMany({ where: { userId }, select: cartSelection, orderBy: { createdAt: "asc" } });
    if (checkoutCartToken(items) !== expectedCartToken) return { error: "Your cart changed. Review current prices and quantities before paying." } as const;
    await tx.$queryRaw`SELECT "id" FROM "product" WHERE "id" IN (SELECT "productId" FROM "cart_item" WHERE "userId" = ${userId}) ORDER BY "id" FOR UPDATE`;
    const reserved = await getReservedQuantities(tx, now);
    const error = validateItems(items, reserved);
    if (error) return { error } as const;
    const subtotalPaisa = items.reduce((sum, item) => sum + rupeesToPaisa(item.product.price) * item.quantity, 0);
    const totals = calculateCheckoutTotals(subtotalPaisa);
    const transactionId = randomUUID();
    const displayNumber = await allocateDisplayNumber(tx, now);
    const reservationExpiresAt = new Date(now.getTime() + RESERVATION_MINUTES * 60_000);
    const order = await tx.order.create({
      data: {
        displayNumber, userId, subtotalAmount: totals.subtotalPaisa / 100, deliveryFee: totals.deliveryFeePaisa / 100,
        totalAmount: totals.totalPaisa / 100, ...address, landmark: address.landmark || null,
        orderItems: { create: items.map((item) => ({
          productId: item.product.id, cartItemId: item.id, quantity: item.quantity, priceAtPurchase: item.product.price,
          productName: item.product.name, productSku: item.product.sku, productMaker: item.product.maker, productImageUrl: item.product.imageUrl,
        })) },
        timeline: { create: { type: "ORDER_CREATED", detail: "Order created and inventory reserved for ten minutes.", dedupeKey: `order-created:${transactionId}` } },
      },
    });
    const payment = await tx.payment.create({
      data: { orderId: order.id, transactionId, attemptNumber: 1, amount: totals.totalPaisa / 100 },
    });
    await tx.inventoryReservation.create({ data: {
      orderId: order.id, paymentId: payment.id, expiresAt: reservationExpiresAt,
      items: { create: items.map((item) => ({ productId: item.product.id, quantity: item.quantity })) },
    } });
    return { orderId: order.id, paymentId: payment.id, transactionId, displayNumber, reservationExpiresAt } as const;
  });
}

export async function retryCheckout(userId: string, orderId: string, now = new Date()) {
  return prisma.$transaction(async (tx) => {
    await lockInventory(tx);
    await expireReservations(tx, now);
    const order = await tx.order.findFirst({ where: { id: orderId, userId, status: "FAILED" }, include: { orderItems: { include: { product: { include: { category: true } } } }, payments: true } });
    if (!order) return { error: "Order is not available for payment retry." } as const;
    const reserved = await getReservedQuantities(tx, now);
    for (const item of order.orderItems) {
      if (item.product.archivedAt || item.product.category.archivedAt || item.product.price.comparedTo(item.priceAtPurchase) !== 0) return { error: `${item.productName} changed and this order cannot be retried.` } as const;
      if (item.product.stock - (reserved.get(item.productId) ?? 0) < item.quantity) return { error: `There is not enough available stock for ${item.productName}.` } as const;
    }
    const transactionId = randomUUID();
    const payment = await tx.payment.create({ data: {
      orderId, transactionId, attemptNumber: order.payments.length + 1, amount: order.totalAmount,
      reservation: { create: { order: { connect: { id: orderId } }, expiresAt: new Date(now.getTime() + RESERVATION_MINUTES * 60_000), items: { create: order.orderItems.map((item) => ({ productId: item.productId, quantity: item.quantity })) } } },
    } });
    await tx.order.update({ where: { id: orderId }, data: { status: "PENDING", timeline: { create: { type: "PAYMENT_RETRIED", detail: `Payment attempt ${payment.attemptNumber} started.`, dedupeKey: `payment-retry:${payment.id}` } } } });
    return { orderId, paymentId: payment.id, transactionId } as const;
  });
}

export async function abandonPayment(transactionId: string, now = new Date()) {
  return prisma.$transaction(async (tx) => {
    await lockInventory(tx);
    const payment = await tx.payment.findUnique({ where: { transactionId }, include: { reservation: true } });
    if (!payment || payment.status !== PaymentStatus.PENDING) return payment?.orderId ?? null;
    await tx.payment.update({ where: { id: payment.id }, data: { status: PaymentStatus.ABANDONED, failureReason: "Shopper returned from eSewa without a verified payment." } });
    if (payment.reservation) await tx.inventoryReservation.update({ where: { id: payment.reservation.id }, data: { releasedAt: now } });
    await tx.order.update({ where: { id: payment.orderId }, data: { status: "FAILED", timeline: { create: { type: "PAYMENT_ABANDONED", detail: `Payment attempt ${payment.attemptNumber} was abandoned.`, dedupeKey: `payment-abandoned:${payment.id}` } } } });
    return payment.orderId;
  });
}

export async function completeVerifiedPayment(encodedData: string, now = new Date()) {
  const config = getEsewaConfig();
  const response = decodeAndVerifyEsewaResponse(encodedData, config.secret);
  const payment = await prisma.payment.findUnique({ where: { transactionId: response.transactionUuid }, select: { amount: true } });
  if (!payment) throw new Error("eSewa payment details do not match this attempt.");
  if (response.productCode !== config.productCode || rupeesToPaisa(response.totalAmount) !== rupeesToPaisa(payment.amount)) {
    await failPaymentAttempt(response.transactionUuid, "Signed eSewa details did not match the recorded attempt.", now);
    throw new Error("eSewa payment details do not match this attempt.");
  }
  if (!(await verifyEsewaTransaction(response, rupeesToPaisa(payment.amount), config))) {
    await failPaymentAttempt(response.transactionUuid, "eSewa did not verify the transaction as complete.", now);
    throw new Error("eSewa did not verify this payment as complete.");
  }

  const result = await prisma.$transaction(async (tx) => {
    await lockInventory(tx);
    const attempt = await tx.payment.findUniqueOrThrow({ where: { transactionId: response.transactionUuid }, include: { reservation: { include: { items: true } }, order: { include: { orderItems: true } } } });
    if (attempt.status === PaymentStatus.SUCCESS) return attempt.orderId;
    if (attempt.status !== PaymentStatus.PENDING || !attempt.reservation || attempt.reservation.releasedAt || attempt.reservation.consumedAt || attempt.reservation.expiresAt <= now) {
      if (attempt.status === PaymentStatus.PENDING) {
        await tx.payment.update({ where: { id: attempt.id }, data: { status: PaymentStatus.FAILED, failureReason: "Verified payment arrived after its reservation expired." } });
        if (attempt.reservation && !attempt.reservation.releasedAt && !attempt.reservation.consumedAt) await tx.inventoryReservation.update({ where: { id: attempt.reservation.id }, data: { releasedAt: now } });
        await tx.order.update({ where: { id: attempt.orderId }, data: { status: "FAILED", timeline: { create: { type: "PAYMENT_FAILED", detail: "Verified payment arrived after the reservation expired.", dedupeKey: `payment-expired:${attempt.id}` } } } });
      }
      return { error: "The inventory reservation expired before payment verification." } as const;
    }
    const productIds = attempt.reservation.items.map((item) => item.productId).sort();
    await tx.$queryRaw`SELECT "id" FROM "product" WHERE "id" = ANY(${productIds}) ORDER BY "id" FOR UPDATE`;
    for (const item of attempt.reservation.items) {
      const product = await tx.product.findUniqueOrThrow({ where: { id: item.productId }, select: { stock: true, name: true } });
      if (product.stock < item.quantity) throw new Error(`Stock changed before ${product.name} could be fulfilled.`);
      const updated = await tx.product.update({ where: { id: item.productId }, data: { stock: { decrement: item.quantity } }, select: { stock: true } });
      await tx.stockAdjustment.create({ data: { productId: item.productId, actorLabel: "Verified eSewa checkout", delta: -item.quantity, reason: `Order ${attempt.order.displayNumber}`, resultingStock: updated.stock } });
    }
    await tx.payment.update({ where: { id: attempt.id }, data: { status: PaymentStatus.SUCCESS, gatewayTransactionCode: response.transactionCode, verifiedAt: now, failureReason: null } });
    await tx.inventoryReservation.update({ where: { id: attempt.reservation.id }, data: { consumedAt: now } });
    await tx.order.update({ where: { id: attempt.orderId }, data: { status: "PAID", timeline: { create: { type: "PAYMENT_VERIFIED", detail: "eSewa payment verified and order confirmed.", dedupeKey: `payment-success:${attempt.id}` } } } });
    for (const item of attempt.order.orderItems) {
      await tx.cartItem.deleteMany({ where: { id: item.cartItemId, userId: attempt.order.userId, productId: item.productId, quantity: item.quantity } });
    }
    return attempt.orderId;
  });
  if (typeof result !== "string") throw new Error(result.error);
  return result;
}

async function failPaymentAttempt(transactionId: string, reason: string, now: Date) {
  await prisma.$transaction(async (tx) => {
    await lockInventory(tx);
    const payment = await tx.payment.findUnique({ where: { transactionId }, include: { reservation: true } });
    if (!payment || payment.status !== PaymentStatus.PENDING) return;
    await tx.payment.update({ where: { id: payment.id }, data: { status: PaymentStatus.FAILED, failureReason: reason, verifiedAt: now } });
    if (payment.reservation && !payment.reservation.releasedAt && !payment.reservation.consumedAt) await tx.inventoryReservation.update({ where: { id: payment.reservation.id }, data: { releasedAt: now } });
    await tx.order.update({ where: { id: payment.orderId }, data: { status: "FAILED", timeline: { create: { type: "PAYMENT_FAILED", detail: reason, dedupeKey: `payment-failed:${payment.id}` } } } });
  });
}
