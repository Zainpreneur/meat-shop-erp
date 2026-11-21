import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { apiRoute, notFound } from "@/lib/http";

export const GET = apiRoute(async (request, context) => {
  await requireUser(request);
  const { id } = await context.params;

  const sale = await prisma.sale.findUnique({
    where: { id },
    include: {
      customer: true,
      user: { select: { id: true, name: true } },
      items: { include: { product: true } },
    },
  });
  if (!sale) notFound("Sale");

  return Response.json(sale);
});
