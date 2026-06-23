import { sessionDelete, sessionGet } from "@/lib/server/kv";
import type { AuthSession } from "@/types";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const COOKIE_NAME = "rc_session";

export async function GET() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(COOKIE_NAME)?.value;

  if (!sessionId) {
    return NextResponse.json({ session: null });
  }

  const raw = await sessionGet(sessionId);
  if (!raw) {
    return NextResponse.json({ session: null });
  }

  const session = JSON.parse(raw) as AuthSession;
  if (session.expiresAt < Date.now()) {
    await sessionDelete(sessionId);
    return NextResponse.json({ session: null });
  }

  return NextResponse.json({ session });
}

export async function DELETE() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(COOKIE_NAME)?.value;

  if (sessionId) {
    await sessionDelete(sessionId);
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, "", { httpOnly: true, path: "/", maxAge: 0 });
  return response;
}
