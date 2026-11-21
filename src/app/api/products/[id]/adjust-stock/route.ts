import { z } from "zod";
import { Role, StockMovementType } from "@/lib/enums";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { apiRoute, dbError, HttpError, notFound, parseBody } from "@/lib/http";

const adjustSchema = z.object({
  quantity: z.coerce.number(),
  reason: z.string().min(1),
});

// Manual stock adjustment (e.g. wastage, spoilage, stocktake correction).
export const POST = apiRoute(async (request, context) => {
  await requireRole(request, Role.ADMIN, Role.MANAGER);
  const { id } = await context.params;
  const { quantity, reason } = await parseBody(request, adjustSchema);

  try {
    const product = await prisma.$transaction(async (tx) => {
      const current = await tx.product.findUnique({ where: { id } });
      if (!current) notFound("Product");
      if (current.stockQty + quantity < 0) {
        throw new HttpError(400, "Insufficient stock: adjustment would result in negative stock");
      }

      const updated = await tx.product.update({
        where: { id },
        data: { stockQty: { increment: quantity } },
      });
      await tx.stockMovement.create({
        data: {
          productId: id,
          type: quantity < 0 ? StockMovementType.WASTAGE : StockMovementType.ADJUSTMENT,
          quantity,
          reason,
        },
      });
      return updated;
    });

    return Response.json(product);
  } catch (error) {
    dbError(error, "Product");
  }
});
