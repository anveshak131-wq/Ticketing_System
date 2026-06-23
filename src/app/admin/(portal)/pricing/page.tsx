"use client";

import { PricingRulesManager } from "@/components/admin/PricingRulesManager";

export default function AdminPricingPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Pricing & Promotions</h1>
      <p className="mt-1 text-muted">
        Configure dynamic pricing, promotions, and fare adjustments
      </p>
      <div className="mt-8">
        <PricingRulesManager />
      </div>
    </div>
  );
}
