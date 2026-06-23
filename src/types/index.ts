export type TravelClass = "SL" | "3A" | "2A" | "1A" | "CC" | "2S";

export type ReservationStatus = "confirmed" | "cancelled" | "modified";

export type BerthPreference = "LB" | "MB" | "UB" | "SL" | "SU" | "none";

export interface Station {
  code: string;
  name: string;
  city: string;
  state: string;
}

export interface TrainScheduleStop {
  stationCode: string;
  arrival: string | null;
  departure: string | null;
  day: number;
  distance: number;
}

export interface Train {
  number: string;
  name: string;
  type: string;
  source: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  runsOn: string[];
  classes: TravelClass[];
  schedule: TrainScheduleStop[];
  baseFares: Partial<Record<TravelClass, number>>;
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
  trainNumber: string;
  trainName: string;
  fromStation: string;
  toStation: string;
  fromName: string;
  toName: string;
  travelDate: string;
  travelClass: TravelClass;
  passengers: Passenger[];
  totalFare: number;
  status: ReservationStatus;
  bookingChannel: BookingChannel;
  bookedBy?: string;
  bookedById?: string;
  agentCode?: string;
  bookedAt: string;
  updatedAt: string;
}

export interface TrainSearchResult extends Train {
  availableSeats: Partial<Record<TravelClass, number>>;
  fare: Partial<Record<TravelClass, number>>;
}

export const CLASS_LABELS: Record<TravelClass, string> = {
  SL: "Sleeper (SL)",
  "3A": "AC 3 Tier (3A)",
  "2A": "AC 2 Tier (2A)",
  "1A": "AC First (1A)",
  CC: "Chair Car (CC)",
  "2S": "Second Sitting (2S)",
};
