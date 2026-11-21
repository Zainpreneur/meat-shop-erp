import { PurchaseStatus, Role } from "@/lib/enums";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { apiRoute, dbError, HttpError, notFound } from "@/lib/http";

export const POST = apiRoute(async (request, context) => {
  await requireRole(request, Role.ADMIN, Role.MANAGER);
  const { id } = await context.params;

  const purchase = await prisma.purchase.findUnique({ where: { id } });
  if (!purchase) notFound("Purchase");

  if (purchase.status === PurchaseStatus.RECEIVED) {
    throw new HttpError(400, "Cannot cancel a purchase order that has already been received");
  }

  try {
    const updated = await prisma.purchase.update({
      where: { id },
      data: { status: PurchaseStatus.CANCELLED },
    });
    return Response.json(updated);
  } catch (error) {
    dbError(error, "Purchase");
  }
});
