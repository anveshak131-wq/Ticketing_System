"use client";

import {
  getCatalogServerSnapshot,
  getCatalogSnapshot,
  loadCatalog,
  subscribeCatalog,
} from "@/lib/catalog-store";
import { useEffect } from "react";
import { useSyncExternalStore } from "react";

export function useCatalog() {
  const catalog = useSyncExternalStore(
    subscribeCatalog,
    getCatalogSnapshot,
    getCatalogServerSnapshot
  );

  useEffect(() => {
    void loadCatalog();
  }, []);

  return catalog;
}
