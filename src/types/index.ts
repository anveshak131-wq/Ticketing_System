export type TravelClass = "SL" | "3A" | "2A" | "1A" | "CC" | "2S" | "GEN";

export type StationNetwork = "intercity" | "metro" | "local" | "hyderabad-metro";

export type TrainCategory = "intercity" | "metro" | "local";

export type BookingType = "intercity" | "metro" | "local";

export type ReservationStatus = "confirmed" | "cancelled" | "modified" | "waitlisted";

export type BerthPreference = "LB" | "MB" | "UB" | "SL" | "SU" | "none";

export type BerthType = "UB" | "MB" | "LB" | "SU" | "SL" | "SEAT";

export type PricingRuleType = "demand" | "occupancy" | "date_range" | "promotional";

export type FareType = "distance" | "zone" | "flat" | "station";

export type TrainDirection = "up" | "down" | "both";

export interface Station {
  code: string;
  name: string;
  city: string;
  state: string;
  network?: StationNetwork;
  // Metro/Local specific fields
  zoneId?: number;
  latitude?: number;
  longitude?: number;
  isTerminus?: boolean;
}

export interface MetroLine {
  id: number;
  name: string;
  color?: string;
  network: StationNetwork;
  startStation: string;
  endStation: string;
  totalDistance: number;
  totalStations: number;
  fareType: FareType;
  baseFare: number;
  farePerKm: number;
  isActive: boolean;
}

export interface LineStation {
  id: number;
  lineId: number;
  stationCode: string;
  stopOrder: number;
  distanceFromStart: number;
  direction: TrainDirection;
}

export interface FareZone {
  id: number;
  name: string;
  network: StationNetwork;
  baseFare: number;
}

export interface ZoneMatrix {
  id: number;
  fromZone: number;
  toZone: number;
  fare: number;
}

export interface TrainScheduleStop {
  stationCode: string;
  arrival: string | null;
  departure: string | null;
  day: number;
  distance: number;
}

export interface SeatInventory {
  trainNumber: string;
  travelDate: string;
  class: TravelClass;
  berthType: BerthType;
  total: number;
  booked: number;
  blocked: number;
  waitlisted: number;
}

export interface PricingRule {
  id: string;
  trainNumber?: string;
  routeFrom?: string;
  routeTo?: string;
  class: TravelClass;
  type: PricingRuleType;
  startDate: string;
  endDate: string;
  multiplier: number; // 1.0 = base fare, 1.5 = 50% increase
  description: string;
  isActive: boolean;
}

export interface Train {
  number: string;
  name: string;
  type: string;
  category?: TrainCategory;
  source: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  runsOn: string[];
  classes: TravelClass[];
  schedule: TrainScheduleStop[];
  /** @deprecated Fares are computed automatically — not stored or edited by admins */
  baseFares?: Partial<Record<TravelClass, number>>;
  seatCapacity: Partial<Record<TravelClass, Partial<Record<BerthType, number>>>>;
  minGroupSize?: number;
  maxGroupSize?: number;
  groupDiscount?: number; // percentage discount for groups
  /** Metro/local: first departure of the day (weekdays) */
  firstService?: string;
  /** Metro/local: last departure of the day */
  lastService?: string;
  /** Metro/local: Sunday/holiday first departure */
  sundayFirstService?: string;
  /** Minutes between trains during peak hours */
  peakFrequencyMinutes?: number;
  /** Minutes between trains during off-peak hours */
  offPeakFrequencyMinutes?: number;
  // Metro/Local specific fields
  lineId?: number;
  direction?: TrainDirection;
  headwayMinutes?: number;
  peakHoursStart?: string;
  peakHoursEnd?: string;
  peakHeadwayMinutes?: number;
  offPeakHeadwayMinutes?: number;
}

export interface Passenger {
  id: string;
  name: string;
  age: number;
  gender: "male" | "female" | "other";
  berthPreference: BerthPreference;
}

export type UserRole = "admin" | "agent";

export type BookingChannel = "public" | "agent";

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  agentCode?: string;
  isActive: boolean;
}

export interface AuthSession {
  userId: string;
  role: UserRole;
  name: string;
  email: string;
  agentCode?: string;
  expiresAt: number;
}

export interface Reservation {
  pnr: string;
  bookingType?: BookingType;
  trainNumber: string;
  trainName: string;
  fromStation: string;
  toStation: string;
  fromName: string;
  toName: string;
  travelDate: string;
  travelClass: TravelClass;
  /** Boarding time for metro/local services (HH:mm) */
  departureTime?: string;
  passengers: Passenger[];
  totalFare: number;
  baseFare: number;
  pricingMultiplier: number; // For dynamic pricing tracking
  isGroupBooking: boolean;
  groupSize: number;
  status: ReservationStatus;
  bookingChannel: BookingChannel;
  bookedBy?: string;
  bookedById?: string;
  agentCode?: string;
  bookedAt: string;
  updatedAt: string;
  seats?: string[]; // Seat numbers
  // Metro/Local specific fields
  lineId?: number;
  distanceKm?: number;
  fareType?: FareType;
  fromZone?: number;
  toZone?: number;
}

export interface WaitlistEntry {
  id: string;
  trainNumber: string;
  travelDate: string;
  class: TravelClass;
  passengers: Passenger[];
  totalFare: number;
  addedAt: string;
  confirmationTime?: string;
  bookedPnr?: string;
}

export interface TrainSearchParams {
  fromStation: string;
  toStation: string;
  travelDate: string;
  travelClass?: TravelClass;
  passengerCount?: number;
  priceFrom?: number;
  priceTo?: number;
  dateFlexibility?: number; // days flexible before/after
  trainFlexibility?: boolean; // allow alternative trains
}

export interface TrainSearchResult extends Train {
  serviceKey?: string;
  availableSeats: Partial<Record<TravelClass, number>>;
  availableBerths: Partial<Record<TravelClass, Partial<Record<BerthType, number>>>>;
  fare: Partial<Record<TravelClass, number>>;
  dynamicPrice: Partial<Record<TravelClass, number>>; // With pricing rules applied
  occupancyRate: number; // 0-100 average across available classes
  occupancyRateByClass: Partial<Record<TravelClass, number>>;
  waitlistCount: number;
}

export interface RevenueReport {
  trainNumber?: string;
  routeFrom?: string;
  routeTo?: string;
  agentCode?: string;
  period: string;
  totalReservations: number;
  totalRevenue: number;
  totalCancellations: number;
  refundAmount: number;
  averageFare: number;
  occupancyRate: number;
  revenueByClass: Record<TravelClass, number>;
  revenueByAgent?: Record<string, number>;
}

export const CLASS_LABELS: Record<TravelClass, string> = {
  SL: "Sleeper (SL)",
  "3A": "AC 3 Tier (3A)",
  "2A": "AC 2 Tier (2A)",
  "1A": "AC First (1A)",
  CC: "Chair Car (CC)",
  "2S": "Second Sitting (2S)",
  GEN: "General (GEN)",
};

export const BERTH_LABELS: Record<BerthType, string> = {
  UB: "Upper Berth",
  MB: "Middle Berth",
  LB: "Lower Berth",
  SU: "Side Upper",
  SL: "Side Lower",
  SEAT: "Seat",
};

export const NETWORK_LABELS: Record<StationNetwork, string> = {
  intercity: "Intercity",
  metro: "Metro",
  local: "Local Train",
  "hyderabad-metro": "Hyderabad Metro",
};

export const BOOKING_TYPE_LABELS: Record<BookingType, string> = {
  intercity: "Intercity",
  metro: "Metro",
  local: "Local Train",
};

export const BERTH_PREFERENCE_LABELS: Record<BerthPreference, string> = {
  LB: "Lower Berth",
  MB: "Middle Berth",
  UB: "Upper Berth",
  SL: "Side Lower",
  SU: "Side Upper",
  none: "No Preference",
};

export const FARE_TYPE_LABELS: Record<FareType, string> = {
  distance: "Distance-Based",
  zone: "Zone-Based",
  flat: "Flat Rate",
  station: "Per Station",
};

export const DIRECTION_LABELS: Record<TrainDirection, string> = {
  up: "Up Line",
  down: "Down Line",
  both: "Both Directions",
};
