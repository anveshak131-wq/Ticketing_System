"use client";

import {
  getSessionServerSnapshot,
  getSessionSnapshot,
  refreshSession,
  subscribeAuth,
} from "@/lib/auth-store";
import { useEffect } from "react";
import { useSyncExternalStore } from "react";

export function useAuth() {
  const authSession = useSyncExternalStore(
    subscribeAuth,
    getSessionSnapshot,
    getSessionServerSnapshot
  );

  useEffect(() => {
    void refreshSession();
  }, []);

  return authSession;
}
