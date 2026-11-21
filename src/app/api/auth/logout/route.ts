import { NextResponse } from "next/server";
import { TOKEN_COOKIE } from "@/lib/auth";
import { apiRoute } from "@/lib/http";

export const POST = apiRoute(async () => {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(TOKEN_COOKIE);
  return response;
});
