import { PurchaseStatus, Role, StockMovementType } from "@/lib/enums";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { apiRoute, dbError, HttpError, notFound } from "@/lib/http";

// Mark a purchase order as received: increments product stock and logs
// stock movements. This is the only path that should affect stock for a PO.
export const POST = apiRoute(async (request, context) => {
  await requireRole(request, Role.ADMIN, Role.MANAGER);
  const { id } = await context.params;

  const purchase = await prisma.purchase.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!purchase) notFound("Purchase");

  if (purchase.status === PurchaseStatus.RECEIVED) {
    throw new HttpError(400, "This purchase order has already been received");
  }
  if (purchase.status === PurchaseStatus.CANCELLED) {
    throw new HttpError(400, "Cannot receive a cancelled purchase order");
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      for (const item of purchase.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQty: { increment: item.quantity }, costPrice: item.unitCost },
        });
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: StockMovementType.PURCHASE_IN,
            quantity: item.quantity,
            reason: `Received PO ${purchase.reference}`,
            refId: purchase.id,
          },
        });
      }

      return tx.purchase.update({
        where: { id: purchase.id },
        data: { status: PurchaseStatus.RECEIVED, receivedAt: new Date() },
        include: { items: { include: { product: true } }, supplier: true },
      });
    });

    return Response.json(updated);
  } catch (error) {
    dbError(error, "Purchase");
  }
});
