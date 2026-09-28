import { OrderStatus } from "@/generated/prisma/client";

export const orderStatuses = Object.values(OrderStatus);
export type OrderStatusValue = OrderStatus;
export type OrderStatusFilter = OrderStatusValue | "ALL";

export function parseOrderFilters(searchParams: Record<string, string | string[] | undefined>) {
  const rawQuery = typeof searchParams.q === "string" ? searchParams.q : "";
  const query = rawQuery.trim().replace(/\s+/g, " ").slice(0, 100);
  const status = typeof searchParams.status === "string" && orderStatuses.includes(searchParams.status as OrderStatusValue)
    ? searchParams.status as OrderStatusValue
    : "ALL";
  return { query, status } satisfies { query: string; status: OrderStatusFilter };
}

export function getFulfillmentTransition(current: OrderStatusValue, requested: "SHIPPED" | "DELIVERED"):
  { next: "SHIPPED" | "DELIVERED" } | { error: string } {
  if (requested === "SHIPPED") {
    if (current === "PAID") return { next: "SHIPPED" };
    return { error: current === "DELIVERED" ? "Delivered orders cannot change fulfillment state." : "Only paid orders can be marked as shipped." };
  }
  if (current === "SHIPPED") return { next: "DELIVERED" };
  return { error: current === "DELIVERED" ? "This order is already delivered." : "Only shipped orders can be marked as delivered." };
}

export function humanizeOrderStatus(status: string) {
  return status.replaceAll("_", " ").toLowerCase().replace(/^./, (letter) => letter.toUpperCase());
}
