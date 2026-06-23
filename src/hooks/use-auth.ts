"use client";

import {
  getSessionServerSnapshot,
  getSessionSnapshot,
  subscribeAuth,
} from "@/lib/auth-store";
import { useSyncExternalStore } from "react";

export function useAuth() {
  return useSyncExternalStore(
    subscribeAuth,
    getSessionSnapshot,
    getSessionServerSnapshot
  );
}
