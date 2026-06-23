import type { PricingRule, ReservationStatus, TravelClass, Train } from "@/types";

/**
 * Calculate dynamic price based on occupancy and demand
 */
export function calculateDynamicPrice(
  baseFare: number,
  occupancyRate: number,
  rule?: PricingRule
): number {
  let multiplier = 1;

  // Occupancy-based pricing
  if (occupancyRate > 85) multiplier = 1.5; // 50% increase when very full
  else if (occupancyRate > 70) multiplier = 1.3; // 30% increase
  else if (occupancyRate > 50) multiplier = 1.15; // 15% increase
  else if (occupancyRate < 20) multiplier = 0.85; // 15% discount when empty

  // Apply additional pricing rule if provided
  if (rule) {
    multiplier *= rule.multiplier;
  }

  return Math.round(baseFare * multiplier);
}

/**
 * Calculate group booking discount
 */
export function calculateGroupDiscount(
  baseFare: number,
  groupSize: number,
  maxGroupDiscount: number
): number {
  if (groupSize < 5) return baseFare;
  const discountPercentage = Math.min(maxGroupDiscount, Math.floor(groupSize / 5) * 2);
  return Math.round(baseFare * (1 - discountPercentage / 100));
}

/**
 * Calculate total fare with all adjustments
 */
export function calculateTotalFare(
  baseFare: number,
  passengerCount: number,
  occupancyRate: number,
  pricingRule?: PricingRule,
  groupDiscount?: number
): {
  unitPrice: number;
  totalFare: number;
  pricingMultiplier: number;
  isGroupBooking: boolean;
} {
  const isGroupBooking = passengerCount >= 5;
  let unitPrice = baseFare;
  let pricingMultiplier = 1;

  // Apply dynamic pricing
  const dynamicPrice = calculateDynamicPrice(baseFare, occupancyRate, pricingRule);
  pricingMultiplier = dynamicPrice / baseFare;
  unitPrice = dynamicPrice;

  // Apply group discount if applicable
  if (isGroupBooking && groupDiscount && groupDiscount > 0) {
    unitPrice = calculateGroupDiscount(unitPrice, passengerCount, groupDiscount);
  }

  const totalFare = unitPrice * passengerCount;

  return {
    unitPrice,
    totalFare: Math.round(totalFare),
    pricingMultiplier,
    isGroupBooking,
  };
}

/**
 * Get applicable pricing rule for a train/route/class
 */
export function getApplicablePricingRule(
  trainNumber: string,
  travelClass: TravelClass,
  travelDate: string,
  rules: PricingRule[]
): PricingRule | undefined {
  return rules.find(
    (rule) =>
      rule.isActive &&
      (!rule.trainNumber || rule.trainNumber === trainNumber) &&
      rule.class === travelClass &&
      new Date(travelDate) >= new Date(rule.startDate) &&
      new Date(travelDate) <= new Date(rule.endDate)
  );
}

/**
 * Calculate refund amount based on cancellation policy
 */
export function calculateRefund(
  totalFare: number,
  cancellationTime: Date,
  departureTime: Date
): {
  refundAmount: number;
  cancellationCharge: number;
  refundPercentage: number;
} {
  const hoursBeforeDeparture =
    (departureTime.getTime() - cancellationTime.getTime()) / (1000 * 60 * 60);

  let refundPercentage = 0;
  if (hoursBeforeDeparture > 48) refundPercentage = 100; // Full refund
  else if (hoursBeforeDeparture > 24) refundPercentage = 75; // 75% refund
  else if (hoursBeforeDeparture > 12) refundPercentage = 50; // 50% refund
  else if (hoursBeforeDeparture > 4) refundPercentage = 25; // 25% refund
  else refundPercentage = 0; // No refund

  const refundAmount = Math.round((totalFare * refundPercentage) / 100);
  const cancellationCharge = totalFare - refundAmount;

  return {
    refundAmount,
    cancellationCharge,
    refundPercentage,
  };
}

/**
 * Generate pricing summary for display
 */
export function generatePricingSummary(
  baseFare: number,
  unitPrice: number,
  totalFare: number,
  pricingMultiplier: number,
  passengerCount: number
): string[] {
  const summary: string[] = [];

  summary.push(`Base Fare: ₹${baseFare} per passenger`);

  if (pricingMultiplier !== 1) {
    const percentageChange = Math.round((pricingMultiplier - 1) * 100);
    if (percentageChange > 0) {
      summary.push(`Dynamic Pricing: +${percentageChange}% (₹${unitPrice} per passenger)`);
    } else {
      summary.push(`Dynamic Pricing: ${percentageChange}% (₹${unitPrice} per passenger)`);
    }
  }

  if (passengerCount >= 5) {
    const discount = baseFare - unitPrice;
    if (discount > 0) {
      summary.push(`Group Discount: -₹${discount} per passenger`);
    }
  }

  summary.push(`Total Fare: ₹${totalFare} (${passengerCount} passengers)`);

  return summary;
}
