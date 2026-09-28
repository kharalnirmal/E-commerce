import { describe, expect, it } from "vitest";
import { getFulfillmentTransition, parseOrderFilters } from "@/lib/orders";

describe("order workflow rules", () => {
  it("allows only forward fulfillment transitions", () => {
    expect(getFulfillmentTransition("PAID", "SHIPPED")).toEqual({ next: "SHIPPED" });
    expect(getFulfillmentTransition("SHIPPED", "DELIVERED")).toEqual({ next: "DELIVERED" });
    expect(getFulfillmentTransition("DELIVERED", "SHIPPED")).toEqual({ error: "Delivered orders cannot change fulfillment state." });
    expect(getFulfillmentTransition("REFUND_PENDING", "SHIPPED")).toEqual({ error: "Only paid orders can be marked as shipped." });
  });

  it("normalizes admin search and allowlists status filters", () => {
    expect(parseOrderFilters({ q: "  Suraj   Kharal ", status: "REFUND_PENDING" })).toEqual({
      query: "Suraj Kharal",
      status: "REFUND_PENDING",
    });
    expect(parseOrderFilters({ q: ["first", "second"], status: "not-a-status" })).toEqual({
      query: "",
      status: "ALL",
    });
  });
});
