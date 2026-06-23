"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { useReservations } from "@/hooks/use-reservations";
import {
  calculateRevenueMetrics,
  getCancellationTrends,
  getRoutePerformance,
  getRevenueByAgent,
  exportReportAsCSV,
} from "@/lib/analytics";
import { motion } from "framer-motion";
import { BarChart3, Download, TrendingUp } from "lucide-react";
import { useState } from "react";

export function RevenueAnalyticsDashboard() {
  const reservations = useReservations();
  const [period, setPeriod] = useState<"week" | "month" | "custom">("month");
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [filterTrain, setFilterTrain] = useState("");
  const [filterAgent, setFilterAgent] = useState("");

  const report = calculateRevenueMetrics(reservations, startDate, endDate, {
    trainNumber: filterTrain || undefined,
    agentCode: filterAgent || undefined,
  });

  const cancellationTrends = getCancellationTrends(reservations, startDate, endDate);
  const routePerformance = getRoutePerformance(reservations, startDate, endDate);
  const agentRevenue = getRevenueByAgent(reservations, startDate, endDate);
  const hasRevenueByClass = Object.values(report.revenueByClass).some((value) => value > 0);
  const hasCancellationTrends = Object.keys(cancellationTrends).length > 0;

  const handleDatePeriod = (p: "week" | "month" | "custom") => {
    setPeriod(p);
    const today = new Date();
    let start = new Date();

    if (p === "week") {
      start = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (p === "month") {
      start = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(today.toISOString().split("T")[0]);
  };

  const isEmpty = reservations.length === 0;

  return (
    <div className="space-y-6">
      {isEmpty && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl border border-dashed border-border bg-card p-8 text-center"
        >
          <BarChart3 className="mx-auto h-12 w-12 text-muted mb-4" />
          <p className="font-semibold text-lg">No Data Available</p>
          <p className="text-sm text-muted mt-2">
            Analytics will appear here once bookings are made
          </p>
        </motion.div>
      )}
      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card p-5 space-y-4"
      >
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="font-semibold">Revenue Analytics</h3>
          <div className="flex gap-2">
            <Button size="sm" variant={period === "week" ? "primary" : "outline"} onClick={() => handleDatePeriod("week")}>
              7 Days
            </Button>
            <Button size="sm" variant={period === "month" ? "primary" : "outline"} onClick={() => handleDatePeriod("month")}>
              30 Days
            </Button>
            <Button size="sm" variant={period === "custom" ? "primary" : "outline"} onClick={() => setPeriod("custom")}>
              Custom
            </Button>
          </div>
        </div>

        {period === "custom" && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">From</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">To</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Filter by Train (optional)</label>
            <Input placeholder="Train number" value={filterTrain} onChange={(e) => setFilterTrain(e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Filter by Agent (optional)</label>
            <Input placeholder="Agent code" value={filterAgent} onChange={(e) => setFilterAgent(e.target.value)} />
          </div>
        </div>

        <div className="flex gap-2">
          <Button size="sm" onClick={() => exportReportAsCSV(report, `revenue-${startDate}-${endDate}.csv`)}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </motion.div>

      {/* Key Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {[
          {
            label: "Total Revenue",
            value: `₹${report.totalRevenue.toLocaleString()}`,
            change: "+12%",
            icon: TrendingUp,
          },
          {
            label: "Reservations",
            value: report.totalReservations,
            change: `${report.totalCancellations} cancelled`,
            icon: BarChart3,
          },
          {
            label: "Average Fare",
            value: `₹${report.averageFare}`,
            change: report.totalReservations > 0 ? "avg" : "N/A",
            icon: null,
          },
          {
            label: "Refunds",
            value: `₹${report.refundAmount.toLocaleString()}`,
            change: `${report.totalCancellations} refunded`,
            icon: null,
          },
        ].map((metric, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-border bg-card p-4 hover:shadow-md transition-shadow"
          >
            <p className="text-sm text-muted mb-2">{metric.label}</p>
            <div className="text-2xl font-bold">{metric.value}</div>
            <p className="text-xs text-muted mt-2">{metric.change}</p>
          </div>
        ))}
      </motion.div>

      {/* Revenue by Class */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl border border-border bg-card p-5"
      >
        <h4 className="font-semibold mb-4">Revenue by Class</h4>
        <div className="space-y-3">
          {!hasRevenueByClass && (
            <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted">
              No revenue in the selected date range.
            </p>
          )}
          {Object.entries(report.revenueByClass)
            .filter(([, value]) => value > 0)
            .sort(([, a], [, b]) => b - a)
            .map(([cls, value]) => {
              const maxRevenue = Math.max(
                ...Object.values(report.revenueByClass)
              );
              const percentage = (value / maxRevenue) * 100;
              return (
                <div key={cls}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{cls}</span>
                    <span className="text-sm">₹{value.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-foreground/10 rounded-full h-2">
                    <div
                      className="bg-primary rounded-full h-2 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      </motion.div>

      {/* Route Performance */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl border border-border bg-card p-5"
      >
        <h4 className="font-semibold mb-4">Route Performance</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr>
                <th className="text-left py-2 px-3 font-semibold">Route</th>
                <th className="text-right py-2 px-3 font-semibold">Bookings</th>
                <th className="text-right py-2 px-3 font-semibold">Revenue</th>
                <th className="text-right py-2 px-3 font-semibold">Avg Fare</th>
                <th className="text-right py-2 px-3 font-semibold">Cancellation</th>
              </tr>
            </thead>
            <tbody>
              {routePerformance.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-muted">
                    No route bookings in the selected date range.
                  </td>
                </tr>
              )}
              {routePerformance.map((route) => (
                <tr key={route.route} className="border-b border-border hover:bg-foreground/5">
                  <td className="py-3 px-3 font-medium">{route.route}</td>
                  <td className="text-right py-3 px-3">{route.reservations}</td>
                  <td className="text-right py-3 px-3">₹{route.revenue.toLocaleString()}</td>
                  <td className="text-right py-3 px-3">₹{route.averageFare}</td>
                  <td className="text-right py-3 px-3">
                    <Badge variant={route.cancellationRate > 10 ? "danger" : "success"}>
                      {route.cancellationRate}%
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Agent Performance */}
      {Object.keys(agentRevenue).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl border border-border bg-card p-5"
        >
          <h4 className="font-semibold mb-4">Agent Performance</h4>
          <div className="space-y-3">
            {Object.entries(agentRevenue)
              .sort(([, a], [, b]) => b - a)
              .map(([agentCode, revenue]) => (
                <div
                  key={agentCode}
                  className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/50"
                >
                  <span className="font-medium">{agentCode}</span>
                  <span className="text-lg font-bold">₹{revenue.toLocaleString()}</span>
                </div>
              ))}
          </div>
        </motion.div>
      )}

      {/* Cancellation Trends */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-2xl border border-border bg-card p-5"
      >
        <h4 className="font-semibold mb-4">Cancellation Trends</h4>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {!hasCancellationTrends && (
            <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted">
              No cancellation activity in the selected date range.
            </p>
          )}
          {Object.entries(cancellationTrends)
            .reverse()
            .map(([date, data]) => (
              <div key={date} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                <span className="text-sm text-muted">{date}</span>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-medium">{data.confirmed} confirmed</div>
                    <div className="text-xs text-danger">{data.cancelled} cancelled</div>
                  </div>
                  <Badge variant={data.rate > 15 ? "danger" : data.rate > 5 ? "warning" : "success"}>
                    {data.rate}%
                  </Badge>
                </div>
              </div>
            ))}
        </div>
      </motion.div>
    </div>
  );
}
