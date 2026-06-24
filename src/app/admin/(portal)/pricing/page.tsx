"use client";

import { AutoPricingOverview } from "@/components/admin/AutoPricingOverview";

export default function AdminPricingPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Dynamic Pricing</h1>
      <p className="mt-1 text-muted">
        How fares are calculated automatically for intercity, metro, and local trains
      </p>
      <div className="mt-8">
        <AutoPricingOverview />
      </div>
    </div>
  );
}
