import { z } from "zod";
import { NextResponse } from "next/server";
import { Role, Unit, unitValues } from "@/lib/enums";
import { prisma } from "@/lib/db";
import { requireRole, requireUser } from "@/lib/auth";
import { apiRoute, dbError, parseBody, query } from "@/lib/http";

const productSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  categoryId: z.string().nullable().optional(),
  unit: z.enum(unitValues).default(Unit.KG),
  costPrice: z.coerce.number().nonnegative(),
  sellingPrice: z.coerce.number().nonnegative(),
  stockQty: z.coerce.number().nonnegative().default(0),
  reorderLevel: z.coerce.number().nonnegative().default(5),
  imageUrl: z.string().nullable().optional(),
  active: z.boolean().optional(),
});

export const GET = apiRoute(async (request) => {
  await requireUser(request);

  const params = new URL(request.url).searchParams;
  const search = query(params.get("search"));
  const categoryId = query(params.get("categoryId"));
  const lowStock = query(params.get("lowStock"));
  const active = query(params.get("active"));

  let products = await prisma.product.findMany({
    where: {
      ...(search ? { OR: [{ name: { contains: search } }, { sku: { contains: search } }] } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(active !== undefined ? { active: active === "true" } : {}),
    },
    include: { category: true },
    orderBy: { name: "asc" },
  });

  if (lowStock === "true") {
    products = products.filter((p) => p.stockQty <= p.reorderLevel);
  }

  return Response.json(products);
});

export const POST = apiRoute(async (request) => {
  await requireRole(request, Role.ADMIN, Role.MANAGER);
  const data = await parseBody(request, productSchema);

  try {
    const product = await prisma.product.create({ data, include: { category: true } });
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    dbError(error, "Product");
  }
});
