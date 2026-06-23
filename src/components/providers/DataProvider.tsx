"use client";

import { refreshSession } from "@/lib/auth-store";
import { loadCatalog } from "@/lib/catalog-store";
import { loadReservations } from "@/lib/booking-store";
import { useEffect } from "react";

export function DataProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void Promise.all([loadCatalog(), loadReservations(), refreshSession()]);
  }, []);

  return <>{children}</>;
}
