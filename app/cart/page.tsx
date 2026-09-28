import { prisma } from "@/lib/prisma";
import requireUser from "@/lib/require-user";
import { removeCartItem, updateCartQuantity } from "./action";

export default async function CartPage() {
  const userId = await requireUser();

  const items = await prisma.cartItem.findMany({
    where: { userId },
    select: {
      id: true,
      quantity: true,
      product: {
        select: {
          name: true,
          price: true,
          stock: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const total =
    items.length === 0
      ? "0.00"
      : items
          .reduce(
            (sum, item) => sum.plus(item.product.price.mul(item.quantity)),
            items[0].product.price.mul(0),
          )
          .toFixed(2);

  return (
    <main className="space-y-6 p-6">
      <h1 className="font-bold text-2xl">Your cart</h1>

      {items.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
          <ul className="space-y-4">
            {items.map((item) => (
              <li key={item.id} className="space-y-2 p-4 border">
                <h2 className="font-semibold">{item.product.name}</h2>
                <p>Unit price: {item.product.price.toFixed(2)}</p>
                <p>
                  Subtotal: {item.product.price.mul(item.quantity).toFixed(2)}
                </p>
                <p>Available stock: {item.product.stock}</p>

                <form action={updateCartQuantity} className="flex gap-2">
                  <input type="hidden" name="itemId" value={item.id} />
                  <input
                    type="number"
                    name="quantity"
                    min="1"
                    max={Math.min(item.product.stock, 99)}
                    defaultValue={item.quantity}
                    required
                    className="p-1 border w-20"
                  />
                  <button type="submit">Update</button>
                </form>

                <form action={removeCartItem}>
                  <input type="hidden" name="itemId" value={item.id} />
                  <button type="submit">Remove</button>
                </form>
              </li>
            ))}
          </ul>

          <p className="font-bold text-xl">Total: {total}</p>
        </>
      )}
    </main>
  );
}
