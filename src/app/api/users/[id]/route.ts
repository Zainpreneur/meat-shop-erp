import bcrypt from "bcryptjs";
import { z } from "zod";
import { Role, roleValues } from "@/lib/enums";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { apiRoute, dbError, HttpError, noContent, parseBody } from "@/lib/http";

const userSelect = { id: true, name: true, email: true, role: true, active: true, createdAt: true };

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(roleValues).optional(),
  active: z.boolean().optional(),
  password: z.string().min(6).optional(),
});

export const PUT = apiRoute(async (request, context) => {
  await requireRole(request, Role.ADMIN);
  const { id } = await context.params;
  const data = await parseBody(request, updateSchema);

  const updateData: {
    name?: string;
    role?: string;
    active?: boolean;
    passwordHash?: string;
  } = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.role !== undefined) updateData.role = data.role;
  if (data.active !== undefined) updateData.active = data.active;
  if (data.password) {
    updateData.passwordHash = await bcrypt.hash(data.password, 10);
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: userSelect,
    });
    return Response.json(user);
  } catch (error) {
    dbError(error, "User");
  }
});

export const DELETE = apiRoute(async (request, context) => {
  const session = await requireRole(request, Role.ADMIN);
  const { id } = await context.params;

  if (id === session.sub) {
    throw new HttpError(400, "You cannot deactivate your own account");
  }

  try {
    await prisma.user.update({ where: { id }, data: { active: false } });
    return noContent();
  } catch (error) {
    dbError(error, "User");
  }
});
