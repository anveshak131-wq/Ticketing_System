"use client";

import {
  getReservationsServerSnapshot,
  getReservationsSnapshot,
  loadReservations,
  subscribeReservations,
} from "@/lib/booking-store";
import { useEffect } from "react";
import { useSyncExternalStore } from "react";

export function useReservations() {
  const reservations = useSyncExternalStore(
    subscribeReservations,
    getReservationsSnapshot,
    getReservationsServerSnapshot
  );

  useEffect(() => {
    void loadReservations();
  }, []);

  return reservations;
}
