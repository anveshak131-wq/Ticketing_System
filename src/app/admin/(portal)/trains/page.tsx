"use client";

import { TrainManager } from "@/components/admin/TrainManager";

export default function AdminTrainsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Trains & Schedules</h1>
      <p className="mt-1 text-muted">Manage train details, routes, and running days</p>
      <div className="mt-8">
        <TrainManager />
      </div>
    </div>
  );
}
