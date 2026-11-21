import { z } from "zod";
import { Role } from "@/lib/enums";
import { prisma } from "@/lib/db";
import { requireRole, requireUser } from "@/lib/auth";
import { apiRoute, dbError, noContent, notFound, parseBody } from "@/lib/http";

const schema = z.object({
  name: z.string().min(1),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional().or(z.literal("")),
  address: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const GET = apiRoute(async (request, context) => {
  await requireUser(request);
  const { id } = await context.params;

  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: { purchases: { orderBy: { orderDate: "desc" }, take: 20 } },
  });
  if (!supplier) notFound("Supplier");

  return Response.json(supplier);
});

export const PUT = apiRoute(async (request, context) => {
  await requireRole(request, Role.ADMIN, Role.MANAGER);
  const { id } = await context.params;
  const data = await parseBody(request, schema.partial());

  try {
    const supplier = await prisma.supplier.update({ where: { id }, data });
    return Response.json(supplier);
  } catch (error) {
    dbError(error, "Supplier");
  }
});

export const DELETE = apiRoute(async (request, context) => {
  await requireRole(request, Role.ADMIN);
  const { id } = await context.params;

  try {
    await prisma.supplier.delete({ where: { id } });
    return noContent();
  } catch (error) {
    dbError(error, "Supplier");
  }
});
