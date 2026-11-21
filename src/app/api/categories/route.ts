import { z } from "zod";
import { NextResponse } from "next/server";
import { Role } from "@/lib/enums";
import { prisma } from "@/lib/db";
import { requireRole, requireUser } from "@/lib/auth";
import { apiRoute, dbError, parseBody } from "@/lib/http";

const schema = z.object({ name: z.string().min(1) });

export const GET = apiRoute(async (request) => {
  await requireUser(request);

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });
  return Response.json(categories);
});

export const POST = apiRoute(async (request) => {
  await requireRole(request, Role.ADMIN, Role.MANAGER);
  const data = await parseBody(request, schema);

  try {
    const category = await prisma.category.create({ data });
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    dbError(error, "Category");
  }
});
