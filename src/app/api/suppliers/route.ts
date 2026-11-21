import { z } from "zod";
import { NextResponse } from "next/server";
import { Role } from "@/lib/enums";
import { prisma } from "@/lib/db";
import { requireRole, requireUser } from "@/lib/auth";
import { apiRoute, dbError, parseBody, query } from "@/lib/http";

const schema = z.object({
  name: z.string().min(1),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional().or(z.literal("")),
  address: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const GET = apiRoute(async (request) => {
  await requireUser(request);

  const params = new URL(request.url).searchParams;
  const search = query(params.get("search"));

  const suppliers = await prisma.supplier.findMany({
    where: search ? { OR: [{ name: { contains: search } }, { phone: { contains: search } }] } : {},
    orderBy: { name: "asc" },
    include: { _count: { select: { purchases: true } } },
  });
  return Response.json(suppliers);
});

export const POST = apiRoute(async (request) => {
  await requireRole(request, Role.ADMIN, Role.MANAGER);
  const data = await parseBody(request, schema);

  try {
    const supplier = await prisma.supplier.create({ data });
    return NextResponse.json(supplier, { status: 201 });
  } catch (error) {
    dbError(error, "Supplier");
  }
});
