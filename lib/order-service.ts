import "server-only";

import { OrderStatus, PaymentStatus, Prisma } from "@/generated/prisma/client";
import { lockInventory } from "@/lib/inventory";
import { getFulfillmentTransition, type OrderStatusFilter } from "@/lib/orders";
import { prisma } from "@/lib/prisma";

const orderDetailInclude = {
  orderItems: true,
  payments: { orderBy: { attemptNumber: "asc" } },
  timeline: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] },
} satisfies Prisma.OrderInclude;

export async function listCustomerOrders(userId: string) {
  return prisma.order.findMany({
    where: { userId },
    include: { orderItems: { select: { id: true, productName: true, quantity: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getCustomerOrder(userId: string, orderId: string) {
  return prisma.order.findFirst({ where: { userId, OR: [{ id: orderId }, { displayNumber: orderId }] }, include: orderDetailInclude });
}

export async function listAdminOrders(query: string, status: OrderStatusFilter, page: number) {
  const where: Prisma.OrderWhereInput = {
    ...(status === "ALL" ? {} : { status }),
    ...(query ? {
      OR: [
        { displayNumber: { contains: query, mode: "insensitive" } },
        { recipientName: { contains: query, mode: "insensitive" } },
        { phone: { contains: query } },
        { user: { is: { name: { contains: query, mode: "insensitive" } } } },
        { user: { is: { email: { contains: query, mode: "insensitive" } } } },
      ],
    } : {}),
  };
  const pageSize = 50;
  const [orders, total] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.order.count({ where }),
  ]);
  return { orders, total, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getAdminOrder(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: { ...orderDetailInclude, user: { select: { name: true, email: true } } },
  });
}

export async function cancelCustomerOrder(userId: string, orderId: string, now = new Date()) {
  return prisma.$transaction(async (tx) => {
    await lockInventory(tx);
    const order = await tx.order.findFirst({
      where: { id: orderId, userId },
      include: { payments: true, reservations: true },
    });
    if (!order) return { error: "Order not found." } as const;
    if (order.status === OrderStatus.CANCELLED || order.status === OrderStatus.REFUND_PENDING || order.status === OrderStatus.REFUNDED) {
      return { orderId: order.id, displayNumber: order.displayNumber, status: order.status, changed: false } as const;
    }

    if (order.status === OrderStatus.PAID) {
      if (!order.payments.some((payment) => payment.status === PaymentStatus.SUCCESS)) {
        return { error: "This paid order has no verified payment to refund." } as const;
      }
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.REFUND_PENDING,
          timeline: { create: { type: "CANCELLATION_REQUESTED", detail: "Customer requested cancellation. A manual refund is pending.", dedupeKey: `cancellation-requested:${order.id}` } },
        },
      });
      return { orderId: order.id, displayNumber: order.displayNumber, status: OrderStatus.REFUND_PENDING, changed: true } as const;
    }

    if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.FAILED) {
      return { error: "This order can no longer be cancelled." } as const;
    }

    const activeReservationIds = order.reservations
      .filter((reservation) => !reservation.releasedAt && !reservation.consumedAt)
      .map((reservation) => reservation.id);
    if (activeReservationIds.length) {
      await tx.inventoryReservation.updateMany({ where: { id: { in: activeReservationIds } }, data: { releasedAt: now } });
    }
    await tx.payment.updateMany({
      where: { orderId: order.id, status: PaymentStatus.PENDING },
      data: { status: PaymentStatus.ABANDONED, failureReason: "Order cancelled by customer before payment." },
    });
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.CANCELLED,
        timeline: { create: { type: "ORDER_CANCELLED", detail: "Customer cancelled the unpaid order.", dedupeKey: `order-cancelled:${order.id}` } },
      },
    });
    return { orderId: order.id, displayNumber: order.displayNumber, status: OrderStatus.CANCELLED, changed: true } as const;
  });
}

export async function updateFulfillment(orderId: string, requested: "SHIPPED" | "DELIVERED") {
  return prisma.$transaction(async (tx) => {
    await lockInventory(tx);
    const order = await tx.order.findUnique({ where: { id: orderId }, select: { id: true, status: true } });
    if (!order) return { error: "Order not found." } as const;
    if (order.status === requested) return { orderId: order.id, status: order.status } as const;
    const transition = getFulfillmentTransition(order.status, requested);
    if ("error" in transition) return transition;
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: transition.next,
        timeline: { create: { type: `ORDER_${transition.next}`, detail: transition.next === "SHIPPED" ? "Administrator marked the order as shipped." : "Administrator marked the order as delivered.", dedupeKey: `fulfillment:${transition.next.toLowerCase()}:${order.id}` } },
      },
    });
    return { orderId: order.id, status: transition.next } as const;
  });
}

export async function confirmManualRefund(orderId: string, administratorId: string, administratorName: string, now = new Date()) {
  return prisma.$transaction(async (tx) => {
    await lockInventory(tx);
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { orderItems: true, payments: true },
    });
    if (!order) return { error: "Order not found." } as const;
    if (order.status === OrderStatus.REFUNDED) return { orderId: order.id, status: order.status, changed: false } as const;
    if (order.status !== OrderStatus.REFUND_PENDING) return { error: "Only refund-pending orders can be confirmed as refunded." } as const;
    const payment = order.payments.find((attempt) => attempt.status === PaymentStatus.SUCCESS);
    if (!payment) return { error: "No successful payment is available to refund." } as const;

    const productIds = [...new Set(order.orderItems.map((item) => item.productId))].sort();
    await tx.$queryRaw`SELECT "id" FROM "product" WHERE "id" = ANY(${productIds}) ORDER BY "id" FOR UPDATE`;
    for (const item of order.orderItems) {
      const product = await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } }, select: { stock: true } });
      await tx.stockAdjustment.create({ data: {
        productId: item.productId,
        administratorId,
        actorLabel: administratorName,
        delta: item.quantity,
        reason: `Manual refund for order ${order.displayNumber}`,
        resultingStock: product.stock,
      } });
    }
    await tx.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.REFUNDED, refundedAt: now, refundedById: administratorId },
    });
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.REFUNDED,
        timeline: { create: { type: "REFUND_CONFIRMED", detail: "Administrator confirmed the manual refund and restored inventory.", dedupeKey: `refund-confirmed:${order.id}` } },
      },
    });
    return { orderId: order.id, status: OrderStatus.REFUNDED, changed: true } as const;
  });
}
