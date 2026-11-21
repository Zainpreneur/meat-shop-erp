import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { apiRoute, notFound } from "@/lib/http";

export const GET = apiRoute(async (request, context) => {
  await requireUser(request);
  const { id } = await context.params;

  const purchase = await prisma.purchase.findUnique({
    where: { id },
    include: {
      supplier: true,
      user: { select: { id: true, name: true } },
      items: { include: { product: true } },
    },
  });
  if (!purchase) notFound("Purchase");

  return Response.json(purchase);
});
