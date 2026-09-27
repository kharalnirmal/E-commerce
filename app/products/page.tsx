import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function ProductPage() {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      price: true,
      stock: true,
      imageUrl: true,
      category: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <section>
      <h1>Products</h1>
      {products.map((product) => (
        <ul>
          <li key={product.id} className="p-3 border w-fit">
            {product.imageUrl && (
              <img
                src={product.imageUrl}
                alt={product.name}
                width={240}
                height={240}
                loading="lazy"
                className="rounded w-48 h-48 object-cover"
              />
            )}
            <Link href={`/products/${product.id}`}>
              <strong>{product.name}</strong>
            </Link>

            <p>Price: {product.price.toString()}</p>
            <p>Stock: {product.stock}</p>

            <p className="capitalize">Category: {product.category.name}</p>
          </li>
        </ul>
      ))}
    </section>
  );
}
