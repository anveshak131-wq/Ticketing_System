"use client";

import { DEMO_CREDENTIALS, SEED_USERS } from "@/data/seed-data";
import { createStore } from "@/lib/storage";
import type { AuthSession, User, UserRole } from "@/types";

const USERS_KEY = "ir-demo-users";
const SESSION_KEY = "ir-demo-session";
const SESSION_HOURS = 8;

const usersStore = createStore<User[]>(USERS_KEY, () => SEED_USERS);

function readSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as AuthSession;
    if (session.expiresAt < Date.now()) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

function writeSession(session: AuthSession | null) {
  if (typeof window === "undefined") return;
  if (session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
  sessionListeners.forEach((listener) => listener());
}

const sessionListeners = new Set<() => void>();

export function subscribeAuth(listener: () => void) {
  sessionListeners.add(listener);
  return () => sessionListeners.delete(listener);
}

export function getSessionSnapshot(): AuthSession | null {
  return readSession();
}

export function getSessionServerSnapshot(): null {
  return null;
}

export function getUsers(): User[] {
  return usersStore.read();
}

export function login(
  email: string,
  password: string,
  role: UserRole
): { ok: true; session: AuthSession } | { ok: false; error: string } {
  const user = getUsers().find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.role === role
  );

  if (!user) {
    return { ok: false, error: "Invalid email or role" };
  }
  if (!user.isActive) {
    return { ok: false, error: "Account is deactivated" };
  }
  if (user.password !== password) {
    return { ok: false, error: "Incorrect password" };
  }

  const session: AuthSession = {
    userId: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
    agentCode: user.agentCode,
    expiresAt: Date.now() + SESSION_HOURS * 60 * 60 * 1000,
  };

  writeSession(session);
  return { ok: true, session };
}

export function logout(): void {
  writeSession(null);
}

export function getDemoCredentials(role: UserRole) {
  return role === "agent" ? DEMO_CREDENTIALS.agent : DEMO_CREDENTIALS.admin;
}
