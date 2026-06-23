"use client";

import {
  getCatalogServerSnapshot,
  getCatalogSnapshot,
  subscribeCatalog,
} from "@/lib/catalog-store";
import { useSyncExternalStore } from "react";

export function useCatalog() {
  return useSyncExternalStore(
    subscribeCatalog,
    getCatalogSnapshot,
    getCatalogServerSnapshot
  );
}
