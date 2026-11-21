import { z } from "zod";
import { Role, Unit, unitValues } from "@/lib/enums";
import { prisma } from "@/lib/db";
import { requireRole, requireUser } from "@/lib/auth";
import { apiRoute, dbError, noContent, notFound, parseBody } from "@/lib/http";

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

export const GET = apiRoute(async (request, context) => {
  await requireUser(request);
  const { id } = await context.params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true },
  });
  if (!product) notFound("Product");

  return Response.json(product);
});

export const PUT = apiRoute(async (request, context) => {
  await requireRole(request, Role.ADMIN, Role.MANAGER);
  const { id } = await context.params;
  const data = await parseBody(request, productSchema.partial());

  try {
    const product = await prisma.product.update({
      where: { id },
      data,
      include: { category: true },
    });
    return Response.json(product);
  } catch (error) {
    dbError(error, "Product");
  }
});

export const DELETE = apiRoute(async (request, context) => {
  await requireRole(request, Role.ADMIN);
  const { id } = await context.params;

  try {
    await prisma.product.update({ where: { id }, data: { active: false } });
    return noContent();
  } catch (error) {
    dbError(error, "Product");
  }
});
