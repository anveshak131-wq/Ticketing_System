"use client";

import { StationManager } from "@/components/admin/StationManager";

export default function AdminStationsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Stations</h1>
      <p className="mt-1 text-muted">Add, edit, or remove railway stations</p>
      <div className="mt-8">
        <StationManager />
      </div>
    </div>
  );
}
