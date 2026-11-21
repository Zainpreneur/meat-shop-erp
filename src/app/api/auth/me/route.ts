import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { apiRoute, notFound } from "@/lib/http";

export const GET = apiRoute(async (request) => {
  const session = await requireUser(request);

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
  });
  if (!user) notFound("User");

  return Response.json(user);
});
