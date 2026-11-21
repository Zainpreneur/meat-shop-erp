import { z } from "zod";
import { Role } from "@/lib/enums";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { apiRoute, dbError, noContent, parseBody } from "@/lib/http";

const schema = z.object({
  category: z.string().min(1),
  description: z.string().min(1),
  amount: z.coerce.number().positive(),
  expenseDate: z.string().optional(),
});

export const PUT = apiRoute(async (request, context) => {
  await requireRole(request, Role.ADMIN, Role.MANAGER);
  const { id } = await context.params;
  const data = await parseBody(request, schema.partial());

  const { expenseDate, ...rest } = data;
  try {
    const expense = await prisma.expense.update({
      where: { id },
      data: {
        ...rest,
        ...(expenseDate ? { expenseDate: new Date(expenseDate) } : {}),
      },
    });
    return Response.json(expense);
  } catch (error) {
    dbError(error, "Expense");
  }
});

export const DELETE = apiRoute(async (request, context) => {
  await requireRole(request, Role.ADMIN, Role.MANAGER);
  const { id } = await context.params;

  try {
    await prisma.expense.delete({ where: { id } });
    return noContent();
  } catch (error) {
    dbError(error, "Expense");
  }
});
