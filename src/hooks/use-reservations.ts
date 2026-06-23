"use client";

import {
  getReservationsServerSnapshot,
  getReservationsSnapshot,
  subscribeReservations,
} from "@/lib/booking-store";
import { useSyncExternalStore } from "react";

export function useReservations() {
  return useSyncExternalStore(
    subscribeReservations,
    getReservationsSnapshot,
    getReservationsServerSnapshot
  );
}
