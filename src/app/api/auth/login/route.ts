import { getUsers } from "@/lib/server/data";
import { sessionDelete, sessionPut, SESSION_TTL_SECONDS } from "@/lib/server/kv";
import type { AuthSession, UserRole } from "@/types";
import { NextResponse } from "next/server";

const COOKIE_NAME = "rc_session";

export async function POST(request: Request) {
  const { email, password, role } = (await request.json()) as {
    email: string;
    password: string;
    role: UserRole;
  };

  const users = await getUsers();
  const user = users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.role === role
  );

  if (!user) {
    return NextResponse.json({ error: "Invalid email or role" }, { status: 401 });
  }
  if (!user.isActive) {
    return NextResponse.json({ error: "Account is deactivated" }, { status: 403 });
  }
  if (user.password !== password) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const sessionId = crypto.randomUUID();
  const session: AuthSession = {
    userId: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
    agentCode: user.agentCode,
    expiresAt: Date.now() + SESSION_TTL_SECONDS * 1000,
  };

  await sessionPut(sessionId, session);

  const response = NextResponse.json({ session });
  response.cookies.set(COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });

  return response;
}
