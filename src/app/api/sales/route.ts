import { z } from "zod";
import { NextResponse } from "next/server";
import { PaymentMethod, StockMovementType, paymentMethodValues } from "@/lib/enums";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { apiRoute, dbError, HttpError, parseBody, query } from "@/lib/http";

const saleItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().positive(),
  unitPrice: z.coerce.number().nonnegative(),
});

const createSaleSchema = z.object({
  customerId: z.string().nullable().optional(),
  discount: z.coerce.number().nonnegative().default(0),
  tax: z.coerce.number().nonnegative().default(0),
  paymentMethod: z.enum(paymentMethodValues).default(PaymentMethod.CASH),
  notes: z.string().nullable().optional(),
  items: z.array(saleItemSchema).min(1),
});

function generateReference(prefix: string) {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${stamp}-${rand}`;
}

export const GET = apiRoute(async (request) => {
  await requireUser(request);

  const params = new URL(request.url).searchParams;
  const from = query(params.get("from"));
  const to = query(params.get("to"));
  const customerId = query(params.get("customerId"));
  const status = query(params.get("status"));

  const sales = await prisma.sale.findMany({
    where: {
      ...(customerId ? { customerId } : {}),
      ...(status ? { status } : {}),
      ...(from || to
        ? {
            saleDate: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    },
    include: {
      customer: true,
      user: { select: { id: true, name: true } },
      items: true,
    },
    orderBy: { saleDate: "desc" },
  });
  return Response.json(sales);
});

// Create + complete a sale in one step (typical POS checkout): validates
// stock, decrements it, and writes stock movement history — all atomically.
export const POST = apiRoute(async (request) => {
  const session = await requireUser(request);
  const data = await parseBody(request, createSaleSchema);

  try {
    const sale = await prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({
        where: { id: { in: data.items.map((i) => i.productId) } },
      });
      const productMap = new Map(products.map((p) => [p.id, p]));

      let subtotal = 0;
      for (const item of data.items) {
        const product = productMap.get(item.productId);
        if (!product) {
          throw new HttpError(404, `Product ${item.productId} not found`);
        }
        if (product.stockQty < item.quantity) {
          throw new HttpError(
            400,
            `Insufficient stock for ${product.name}: available ${product.stockQty}${product.unit}, requested ${item.quantity}${product.unit}`
          );
        }
        subtotal += item.quantity * item.unitPrice;
      }

      const total = Math.max(0, subtotal - data.discount + data.tax);

      const created = await tx.sale.create({
        data: {
          reference: generateReference("INV"),
          customerId: data.customerId || null,
          userId: session.sub,
          subtotal,
          discount: data.discount,
          tax: data.tax,
          total,
          paymentMethod: data.paymentMethod,
          notes: data.notes,
          items: {
            create: data.items.map((i) => ({
              productId: i.productId,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              subtotal: i.quantity * i.unitPrice,
            })),
          },
        },
        include: {
          items: { include: { product: true } },
          customer: true,
          user: { select: { id: true, name: true } },
        },
      });

      for (const item of data.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQty: { decrement: item.quantity } },
        });
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: StockMovementType.SALE_OUT,
            quantity: -item.quantity,
            reason: `Sold on ${created.reference}`,
            refId: created.id,
          },
        });
      }

      if (data.paymentMethod === PaymentMethod.CREDIT && data.customerId) {
        await tx.customer.update({
          where: { id: data.customerId },
          data: { creditBalance: { increment: total } },
        });
      }

      return created;
    });

    return NextResponse.json(sale, { status: 201 });
  } catch (error) {
    dbError(error, "Sale");
  }
});
