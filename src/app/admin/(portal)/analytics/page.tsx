"use client";

import { RevenueAnalyticsDashboard } from "@/components/admin/RevenueAnalyticsDashboard";

export default function AdminAnalyticsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Revenue & Analytics</h1>
      <p className="mt-1 text-muted">
        Track revenue, occupancy, cancellations, and performance metrics
      </p>
      <div className="mt-8">
        <RevenueAnalyticsDashboard />
      </div>
    </div>
  );
}
