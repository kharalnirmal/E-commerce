import Link from "next/link";
import { listAdminOrders } from "@/lib/order-service";
import { humanizeOrderStatus, orderStatuses, parseOrderFilters } from "@/lib/orders";
import requireAdmin from "@/lib/require-admin";
import { formatNpr } from "@/lib/storefront";

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const rawSearchParams = await searchParams;
  const filters = parseOrderFilters(rawSearchParams);
  const requestedPage = typeof rawSearchParams.page === "string" && /^\d+$/.test(rawSearchParams.page) ? Number(rawSearchParams.page) : 1;
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const { orders, total, pageCount } = await listAdminOrders(filters.query, filters.status, page);
  const filterQuery = new URLSearchParams({ ...(filters.query ? { q: filters.query } : {}), ...(filters.status !== "ALL" ? { status: filters.status } : {}) });
  return (
    <main className="shell py-12 sm:py-20">
      <p className="utility-label text-[var(--vermilion)]">Administrator</p>
      <h1 className="mt-2 text-6xl font-bold tracking-[-0.07em] sm:text-8xl">ORDER / DESK</h1>
      <form method="get" className="brutal-card mt-10 grid gap-4 p-5 md:grid-cols-[1fr_16rem_auto] md:items-end">
        <label className="grid gap-1">Order or customer<input name="q" defaultValue={filters.query} maxLength={100} placeholder="CHK-2026, name, email, phone" className="min-h-11 rounded-lg border-2 border-[var(--line)] bg-[var(--paper)] px-3" /></label>
        <label className="grid gap-1">Fulfillment status<select name="status" defaultValue={filters.status} className="min-h-11 rounded-lg border-2 border-[var(--line)] bg-[var(--paper)] px-3"><option value="ALL">All statuses</option>{orderStatuses.map((status) => <option key={status} value={status}>{humanizeOrderStatus(status)}</option>)}</select></label>
        <button className="button-primary">Find orders</button>
      </form>
      <div className="mt-7 flex items-center justify-between"><p role="status">{total} order{total === 1 ? "" : "s"}</p>{(filters.query || filters.status !== "ALL") && <Link href="/admin/orders" className="utility-label">Clear filters</Link>}</div>
      {orders.length ? <><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[760px] border-separate border-spacing-y-3"><thead><tr className="text-left utility-label"><th>Order</th><th>Customer</th><th>Status</th><th>Total</th><th>Placed</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{orders.map((order) => <tr key={order.id} className="bg-[var(--surface)]"><td className="rounded-l-xl border-y-2 border-l-2 border-[var(--line)] p-4 font-bold">{order.displayNumber}</td><td className="border-y-2 border-[var(--line)] p-4">{order.user.name}<small className="block text-[var(--muted)]">{order.user.email}</small></td><td className="border-y-2 border-[var(--line)] p-4">{humanizeOrderStatus(order.status)}</td><td className="border-y-2 border-[var(--line)] p-4">{formatNpr(order.totalAmount)}</td><td className="border-y-2 border-[var(--line)] p-4">{order.createdAt.toLocaleDateString()}</td><td className="rounded-r-xl border-y-2 border-r-2 border-[var(--line)] p-4"><Link href={`/admin/orders/${order.id}`} className="button-secondary">Open</Link></td></tr>)}</tbody></table></div>{pageCount > 1 && <nav aria-label="Order pages" className="mt-6 flex items-center justify-center gap-4">{page > 1 && <Link className="button-secondary" href={`/admin/orders?${filterQuery.toString()}${filterQuery.size ? "&" : ""}page=${page - 1}`}>Previous</Link>}<span>Page {page} of {pageCount}</span>{page < pageCount && <Link className="button-secondary" href={`/admin/orders?${filterQuery.toString()}${filterQuery.size ? "&" : ""}page=${page + 1}`}>Next</Link>}</nav>}</> : <section className="brutal-card mt-5 p-8 text-center"><h2 className="text-3xl font-bold">No matching orders</h2><p className="mt-3 text-[var(--muted)]">Try a different customer, order number, or status.</p></section>}
    </main>
  );
}
