"use client";

import { DEMO_CREDENTIALS } from "@/data/seed-data";
import type { AuthSession, UserRole } from "@/types";

const listeners = new Set<() => void>();
let session: AuthSession | null = null;
let loading = false;
let loaded = false;

function notify() {
  listeners.forEach((l) => l());
}

export function subscribeAuth(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSessionSnapshot(): AuthSession | null {
  return session;
}

export function getSessionServerSnapshot(): null {
  return null;
}

export async function refreshSession(): Promise<AuthSession | null> {
  if (loading) return session;
  loading = true;
  try {
    const res = await fetch("/api/auth/session", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      session = data.session ?? null;
      loaded = true;
      notify();
    }
  } finally {
    loading = false;
  }
  return session;
}

export async function login(
  email: string,
  password: string,
  role: UserRole
): Promise<{ ok: true; session: AuthSession } | { ok: false; error: string }> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, role }),
  });

  const data = await res.json();
  if (!res.ok) {
    return { ok: false, error: data.error ?? "Login failed" };
  }

  session = data.session;
  notify();
  return { ok: true, session: data.session };
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/session", { method: "DELETE" });
  session = null;
  notify();
}

export function getDemoCredentials(role: UserRole) {
  return role === "agent" ? DEMO_CREDENTIALS.agent : DEMO_CREDENTIALS.admin;
}
