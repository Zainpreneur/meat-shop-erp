import { z } from "zod";
import { Role } from "@/lib/enums";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { apiRoute, dbError, noContent, parseBody } from "@/lib/http";

const schema = z.object({ name: z.string().min(1) });

export const PUT = apiRoute(async (request, context) => {
  await requireRole(request, Role.ADMIN, Role.MANAGER);
  const { id } = await context.params;
  const data = await parseBody(request, schema);

  try {
    const category = await prisma.category.update({ where: { id }, data });
    return Response.json(category);
  } catch (error) {
    dbError(error, "Category");
  }
});

export const DELETE = apiRoute(async (request, context) => {
  await requireRole(request, Role.ADMIN);
  const { id } = await context.params;

  try {
    await prisma.category.delete({ where: { id } });
    return noContent();
  } catch (error) {
    dbError(error, "Category");
  }
});
