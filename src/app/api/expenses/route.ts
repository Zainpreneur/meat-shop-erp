import { z } from "zod";
import { NextResponse } from "next/server";
import { Role } from "@/lib/enums";
import { prisma } from "@/lib/db";
import { requireRole, requireUser } from "@/lib/auth";
import { apiRoute, dbError, parseBody, query } from "@/lib/http";

const schema = z.object({
  category: z.string().min(1),
  description: z.string().min(1),
  amount: z.coerce.number().positive(),
  expenseDate: z.string().optional(),
});

export const GET = apiRoute(async (request) => {
  await requireUser(request);

  const params = new URL(request.url).searchParams;
  const from = query(params.get("from"));
  const to = query(params.get("to"));
  const category = query(params.get("category"));

  const expenses = await prisma.expense.findMany({
    where: {
      ...(category ? { category } : {}),
      ...(from || to
        ? {
            expenseDate: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { expenseDate: "desc" },
  });
  return Response.json(expenses);
});

export const POST = apiRoute(async (request) => {
  const session = await requireRole(request, Role.ADMIN, Role.MANAGER);
  const data = await parseBody(request, schema);

  try {
    const expense = await prisma.expense.create({
      data: {
        category: data.category,
        description: data.description,
        amount: data.amount,
        expenseDate: data.expenseDate ? new Date(data.expenseDate) : new Date(),
        userId: session.sub,
      },
    });
    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    dbError(error, "Expense");
  }
});
