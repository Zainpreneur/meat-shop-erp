import { PaymentMethod, Role, SaleStatus, StockMovementType } from "@/lib/enums";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { apiRoute, dbError, HttpError, notFound } from "@/lib/http";

// Refund a completed sale: restocks items and reverses any credit balance.
export const POST = apiRoute(async (request, context) => {
  await requireRole(request, Role.ADMIN, Role.MANAGER);
  const { id } = await context.params;

  const sale = await prisma.sale.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!sale) notFound("Sale");

  if (sale.status !== SaleStatus.COMPLETED) {
    throw new HttpError(400, "Only completed sales can be refunded");
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      for (const item of sale.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQty: { increment: item.quantity } },
        });
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: StockMovementType.RETURN_IN,
            quantity: item.quantity,
            reason: `Refund of ${sale.reference}`,
            refId: sale.id,
          },
        });
      }

      if (sale.paymentMethod === PaymentMethod.CREDIT && sale.customerId) {
        await tx.customer.update({
          where: { id: sale.customerId },
          data: { creditBalance: { decrement: sale.total } },
        });
      }

      return tx.sale.update({ where: { id: sale.id }, data: { status: SaleStatus.REFUNDED } });
    });

    return Response.json(updated);
  } catch (error) {
    dbError(error, "Sale");
  }
});
