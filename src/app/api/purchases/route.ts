import { z } from "zod";
import { NextResponse } from "next/server";
import { Role } from "@/lib/enums";
import { prisma } from "@/lib/db";
import { requireRole, requireUser } from "@/lib/auth";
import { apiRoute, dbError, parseBody, query } from "@/lib/http";

const itemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().positive(),
  unitCost: z.coerce.number().nonnegative(),
});

const createSchema = z.object({
  supplierId: z.string().min(1),
  notes: z.string().nullable().optional(),
  items: z.array(itemSchema).min(1),
});

function generateReference(prefix: string) {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${stamp}-${rand}`;
}

export const GET = apiRoute(async (request) => {
  await requireUser(request);

  const params = new URL(request.url).searchParams;
  const status = query(params.get("status"));
  const supplierId = query(params.get("supplierId"));

  const purchases = await prisma.purchase.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(supplierId ? { supplierId } : {}),
    },
    include: { supplier: true, user: { select: { id: true, name: true } }, items: true },
    orderBy: { orderDate: "desc" },
  });
  return Response.json(purchases);
});

// Create a pending purchase order (does not affect stock yet).
export const POST = apiRoute(async (request) => {
  const session = await requireRole(request, Role.ADMIN, Role.MANAGER);
  const data = await parseBody(request, createSchema);

  const items = data.items.map((i) => ({ ...i, subtotal: i.quantity * i.unitCost }));
  const totalAmount = items.reduce((sum, i) => sum + i.subtotal, 0);

  try {
    const purchase = await prisma.purchase.create({
      data: {
        reference: generateReference("PO"),
        supplierId: data.supplierId,
        userId: session.sub,
        notes: data.notes,
        totalAmount,
        items: { create: items },
      },
      include: { items: { include: { product: true } }, supplier: true },
    });
    return NextResponse.json(purchase, { status: 201 });
  } catch (error) {
    dbError(error, "Purchase");
  }
});
