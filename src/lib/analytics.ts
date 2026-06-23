import type { Reservation, RevenueReport, TravelClass } from "@/types";

/**
 * Calculate revenue metrics for a period
 */
export function calculateRevenueMetrics(
  reservations: Reservation[],
  startDate: string,
  endDate: string,
  filterBy?: {
    trainNumber?: string;
    routeFrom?: string;
    routeTo?: string;
    agentCode?: string;
  }
): RevenueReport {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();

  const filtered = reservations.filter((r) => {
    const bookDate = new Date(r.bookedAt).getTime();
    const isInPeriod = bookDate >= start && bookDate <= end;
    const matchesTrain = !filterBy?.trainNumber || r.trainNumber === filterBy.trainNumber;
    const matchesRoute = 
      (!filterBy?.routeFrom || r.fromStation === filterBy.routeFrom) &&
      (!filterBy?.routeTo || r.toStation === filterBy.routeTo);
    const matchesAgent = !filterBy?.agentCode || r.agentCode === filterBy.agentCode;

    return isInPeriod && matchesTrain && matchesRoute && matchesAgent;
  });

  const confirmed = filtered.filter((r) => r.status === "confirmed");
  const cancelled = filtered.filter((r) => r.status === "cancelled");

  let totalRevenue = 0;
  let refundAmount = 0;
  const revenueByClass: Record<TravelClass, number> = {
    SL: 0,
    "3A": 0,
    "2A": 0,
    "1A": 0,
    CC: 0,
    "2S": 0,
  };

  confirmed.forEach((r) => {
    totalRevenue += r.totalFare;
    revenueByClass[r.travelClass] += r.totalFare;
  });

  cancelled.forEach((r) => {
    // Assume 50% refund rate for cancellations (can be made configurable)
    refundAmount += Math.round(r.totalFare * 0.5);
  });

  return {
    trainNumber: filterBy?.trainNumber,
    routeFrom: filterBy?.routeFrom,
    routeTo: filterBy?.routeTo,
    agentCode: filterBy?.agentCode,
    period: `${startDate} to ${endDate}`,
    totalReservations: confirmed.length,
    totalRevenue,
    totalCancellations: cancelled.length,
    refundAmount,
    averageFare: confirmed.length > 0 ? Math.round(totalRevenue / confirmed.length) : 0,
    occupancyRate: 0, // To be calculated separately based on seat data
    revenueByClass,
  };
}

/**
 * Get revenue by agent
 */
export function getRevenueByAgent(
  reservations: Reservation[],
  startDate: string,
  endDate: string
): Record<string, number> {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();

  const revenueByAgent: Record<string, number> = {};

  reservations.forEach((r) => {
    const bookDate = new Date(r.bookedAt).getTime();
    if (bookDate >= start && bookDate <= end && r.status === "confirmed" && r.agentCode) {
      revenueByAgent[r.agentCode] = (revenueByAgent[r.agentCode] || 0) + r.totalFare;
    }
  });

  return revenueByAgent;
}

/**
 * Get cancellation trends
 */
export function getCancellationTrends(
  reservations: Reservation[],
  startDate: string,
  endDate: string,
  groupByDays: boolean = true
): Record<string, { cancelled: number; confirmed: number; rate: number }> {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();

  const trends: Record<string, { cancelled: number; confirmed: number; rate: number }> = {};

  reservations.forEach((r) => {
    const bookDate = new Date(r.bookedAt);
    if (bookDate.getTime() >= start && bookDate.getTime() <= end) {
      const key = groupByDays ? bookDate.toISOString().split("T")[0] : bookDate.toISOString().split("T")[0].substring(0, 7);

      if (!trends[key]) {
        trends[key] = { cancelled: 0, confirmed: 0, rate: 0 };
      }

      if (r.status === "cancelled") {
        trends[key].cancelled += 1;
      } else if (r.status === "confirmed") {
        trends[key].confirmed += 1;
      }

      const total = trends[key].cancelled + trends[key].confirmed;
      trends[key].rate = total > 0 ? Math.round((trends[key].cancelled / total) * 100) : 0;
    }
  });

  return trends;
}

/**
 * Get route performance
 */
export function getRoutePerformance(
  reservations: Reservation[],
  startDate: string,
  endDate: string
): Array<{
  route: string;
  reservations: number;
  revenue: number;
  averageFare: number;
  cancellationRate: number;
}> {
  const metrics = new Map<string, {
    confirmed: number;
    cancelled: number;
    revenue: number;
  }>();

  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();

  reservations.forEach((r) => {
    const bookDate = new Date(r.bookedAt).getTime();
    if (bookDate >= start && bookDate <= end) {
      const route = `${r.fromStation}-${r.toStation}`;
      const current = metrics.get(route) || { confirmed: 0, cancelled: 0, revenue: 0 };

      if (r.status === "confirmed") {
        current.confirmed += 1;
        current.revenue += r.totalFare;
      } else if (r.status === "cancelled") {
        current.cancelled += 1;
      }

      metrics.set(route, current);
    }
  });

  return Array.from(metrics.entries())
    .map(([route, data]) => {
      const total = data.confirmed + data.cancelled;
      return {
        route,
        reservations: data.confirmed,
        revenue: data.revenue,
        averageFare: data.confirmed > 0 ? Math.round(data.revenue / data.confirmed) : 0,
        cancellationRate: total > 0 ? Math.round((data.cancelled / total) * 100) : 0,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);
}

/**
 * Calculate occupancy metrics across multiple dates
 */
export function calculateOccupancyMetrics(
  totalCapacity: number,
  bookedSeats: number[],
  dates: string[]
): {
  date: string;
  occupancyPercent: number;
  bookedSeats: number;
  availableSeats: number;
}[] {
  return dates.map((date, index) => {
    const booked = bookedSeats[index] || 0;
    return {
      date,
      occupancyPercent: Math.round((booked / totalCapacity) * 100),
      bookedSeats: booked,
      availableSeats: totalCapacity - booked,
    };
  });
}

/**
 * Get peak hours (times with most bookings)
 */
export function getPeakHours(
  reservations: Reservation[],
  startDate: string,
  endDate: string
): Array<{ hour: string; bookings: number; revenue: number }> {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();

  const hourlyData = new Map<number, { bookings: number; revenue: number }>();

  reservations.forEach((r) => {
    const bookDate = new Date(r.bookedAt);
    if (bookDate.getTime() >= start && bookDate.getTime() <= end && r.status === "confirmed") {
      const hour = bookDate.getHours();
      const current = hourlyData.get(hour) || { bookings: 0, revenue: 0 };
      current.bookings += 1;
      current.revenue += r.totalFare;
      hourlyData.set(hour, current);
    }
  });

  return Array.from(hourlyData.entries())
    .map(([hour, data]) => ({
      hour: `${hour}:00`,
      bookings: data.bookings,
      revenue: data.revenue,
    }))
    .sort((a, b) => b.bookings - a.bookings);
}

/**
 * Export report as CSV
 */
export function exportReportAsCSV(
  report: RevenueReport,
  filename: string = "revenue-report.csv"
): void {
  const rows = [
    ["Revenue Report"],
    ["Period", report.period],
    ["Total Reservations", report.totalReservations],
    ["Total Revenue", `₹${report.totalRevenue}`],
    ["Total Cancellations", report.totalCancellations],
    ["Refund Amount", `₹${report.refundAmount}`],
    ["Average Fare", `₹${report.averageFare}`],
    ["Occupancy Rate", `${report.occupancyRate}%`],
    [""],
    ["Revenue by Class"],
    ...Object.entries(report.revenueByClass).map(([cls, revenue]) => [cls, `₹${revenue}`]),
  ];

  const csv = rows.map((row) => row.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}
