import { z } from "zod";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { apiRoute, dbError, parseBody, query } from "@/lib/http";

const schema = z.object({
  name: z.string().min(1),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional().or(z.literal("")),
  address: z.string().nullable().optional(),
});

export const GET = apiRoute(async (request) => {
  await requireUser(request);

  const params = new URL(request.url).searchParams;
  const search = query(params.get("search"));

  const customers = await prisma.customer.findMany({
    where: search ? { OR: [{ name: { contains: search } }, { phone: { contains: search } }] } : {},
    orderBy: { name: "asc" },
    include: { _count: { select: { sales: true } } },
  });
  return Response.json(customers);
});

export const POST = apiRoute(async (request) => {
  await requireUser(request);
  const data = await parseBody(request, schema);

  try {
    const customer = await prisma.customer.create({ data });
    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    dbError(error, "Customer");
  }
});
