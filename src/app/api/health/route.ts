import { apiRoute } from "@/lib/http";

export const GET = apiRoute(async () => {
  return Response.json({ status: "ok", time: new Date().toISOString() });
});
