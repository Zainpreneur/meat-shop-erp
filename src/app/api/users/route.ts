import bcrypt from "bcryptjs";
import { z } from "zod";
import { NextResponse } from "next/server";
import { Role, roleValues } from "@/lib/enums";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { apiRoute, dbError, parseBody } from "@/lib/http";

const userSelect = { id: true, name: true, email: true, role: true, active: true, createdAt: true };

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(roleValues).default(Role.CASHIER),
});

export const GET = apiRoute(async (request) => {
  await requireRole(request, Role.ADMIN, Role.MANAGER);

  const users = await prisma.user.findMany({ select: userSelect, orderBy: { createdAt: "desc" } });
  return Response.json(users);
});

export const POST = apiRoute(async (request) => {
  await requireRole(request, Role.ADMIN);
  const data = await parseBody(request, createSchema);

  const passwordHash = await bcrypt.hash(data.password, 10);
  try {
    const user = await prisma.user.create({
      data: { name: data.name, email: data.email, passwordHash, role: data.role },
      select: userSelect,
    });
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    dbError(error, "User");
  }
});
