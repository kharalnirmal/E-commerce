import { prisma } from "@/lib/prisma";

import { notFound } from "next/navigation";

export default async function productDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      name: true,
      description: true,
      imageUrl: true,
      stock: true,
      price: true,
      category: { select: { name: true } },
    },
  });
  if (!product) {
    notFound();
  }
  return (
    <section className="bg-zinc-800 mx-auto px-8 py-4 w-fit">
      <h1 className="font-bold text-center">{product.name}</h1>
      <div className="flex">
        <div className="max-w-[50%]">
          {product.imageUrl && (
            <img
              src={product.imageUrl}
              alt={product.name}
              width={300}
              height={300}
            />
          )}
        </div>
        <div>
          <strong>{product.category.name}</strong>
          <p>{product.description}</p>
          <p>{product.stock}</p>
          <p>{product.price.toString()}</p>
          <p>{product.id}</p>
        </div>
      </div>
    </section>
  );
}
