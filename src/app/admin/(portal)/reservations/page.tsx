"use client";

import { ReservationManager } from "@/components/admin/ReservationManager";

export default function AdminReservationsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">All Reservations</h1>
      <p className="mt-1 text-muted">View, edit, or delete any booking in the system</p>
      <div className="mt-8">
        <ReservationManager />
      </div>
    </div>
  );
}
