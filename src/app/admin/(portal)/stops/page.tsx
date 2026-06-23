"use client";

import { StopsManager } from "@/components/admin/StopsManager";

export default function AdminStopsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Train Stops</h1>
      <p className="mt-1 text-muted">Delete or manage individual train stops</p>
      <div className="mt-8">
        <StopsManager />
      </div>
    </div>
  );
}
