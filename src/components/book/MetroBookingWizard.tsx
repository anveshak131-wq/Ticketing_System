"use client";

import { PassengerForm } from "@/components/book/PassengerForm";
import { SearchForm } from "@/components/book/SearchForm";
import { StepIndicator } from "@/components/book/StepIndicator";
import { TrainList } from "@/components/book/TrainList";
import { PageTransition } from "@/components/motion/PageTransition";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { buttonStyles } from "@/components/ui/button-styles";
import { useCatalog } from "@/hooks/use-catalog";
import { useReservations } from "@/hooks/use-reservations";
import { saveReservation } from "@/lib/booking-store";
import { filterStationsByNetwork } from "@/lib/station-utils";
import { getStationLabel, searchTrains } from "@/lib/train-search";
import { generatePNR, formatPNR } from "@/lib/pnr";
import { formatCurrency, formatDate } from "@/lib/utils";
import { calculateTotalFare } from "@/lib/pricing-engine";
import { buildBerthPreferenceCounts, buildSeatInventory } from "@/lib/seat-availability";
import { bookSeats } from "@/lib/seat-management";
import type { BookingType, Passenger, Reservation, StationNetwork, TrainSearchResult } from "@/types";
import { BOOKING_TYPE_LABELS } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Copy, Download, Ticket, Train } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

const NETWORK_DEFAULTS: Record<StationNetwork, { from: string; to: string }> = {
  intercity: { from: "NDLS", to: "BCT" },
  metro: { from: "DMK1", to: "DMK3" },
  local: { from: "MLK1", to: "MLK5" },
};

function createDefaultPassenger(): Passenger {
  return {
    id: crypto.randomUUID(),
    name: "",
    age: 25,
    gender: "male",
    berthPreference: "none",
  };
}

export function MetroBookingWizard() {
  const { stations } = useCatalog();
  const reservations = useReservations();
  const [network, setNetwork] = useState<StationNetwork>("metro");
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState("DMK1");
  const [to, setTo] = useState("DMK3");
  const [date, setDate] = useState("");
  const travelClass = "2S" as const;
  const [results, setResults] = useState<TrainSearchResult[]>([]);
  const [selectedTrain, setSelectedTrain] = useState<TrainSearchResult | null>(null);
  const [passengers, setPassengers] = useState<Passenger[]>([createDefaultPassenger()]);
  const [confirmedPNR, setConfirmedPNR] = useState<string | null>(null);
  const [confirmedSeats, setConfirmedSeats] = useState<string[]>([]);
  const [bookingError, setBookingError] = useState("");
  const [copied, setCopied] = useState(false);

  const networkStations = useMemo(
    () => filterStationsByNetwork(stations, network),
    [stations, network]
  );

  useEffect(() => {
    const defaults = NETWORK_DEFAULTS[network];
    const availableCodes = networkStations.map((s) => s.code);
    const fromCode = availableCodes.includes(defaults.from)
      ? defaults.from
      : networkStations[0]?.code ?? "";
    const toCode = availableCodes.includes(defaults.to)
      ? defaults.to
      : networkStations[networkStations.length - 1]?.code ?? "";
    setFrom(fromCode);
    setTo(toCode);
    setStep(0);
    setResults([]);
    setSelectedTrain(null);
    setConfirmedPNR(null);
    setConfirmedSeats([]);
    setBookingError("");
    setPassengers([createDefaultPassenger()]);
  }, [network, networkStations]);

  const bookingType: BookingType = network === "local" ? "local" : "metro";

  const fareQuote = useMemo(() => {
    if (!selectedTrain) {
      return {
        unitPrice: 0,
        totalFare: 0,
        pricingMultiplier: 1,
        isGroupBooking: false,
      };
    }

    const baseFare = selectedTrain.fare[travelClass] ?? 0;
    const dynamicFare =
      selectedTrain.dynamicPrice[travelClass] ?? baseFare;

    return calculateTotalFare(
      dynamicFare,
      passengers.length,
      selectedTrain.occupancyRateByClass[travelClass] ?? 0,
      undefined,
      undefined
    );
  }, [selectedTrain, passengers.length]);

  const totalFare = fareQuote.totalFare;
  const selectedAvailableSeats = selectedTrain?.availableSeats[travelClass] ?? 0;

  const handleSearch = async () => {
    setLoading(true);
    setBookingError("");
    setSelectedTrain(null);
    setConfirmedPNR(null);
    setConfirmedSeats([]);
    await new Promise((r) => setTimeout(r, 600));
    setResults(
      searchTrains(from, to, date, reservations, { category: bookingType })
    );
    setLoading(false);
    setStep(1);
  };

  const handleSelectTrain = (train: TrainSearchResult) => {
    setBookingError("");
    setSelectedTrain(train);
    setStep(2);
  };

  const handleConfirm = async () => {
    if (!selectedTrain) return;

    const inventory = buildSeatInventory(
      selectedTrain,
      travelClass,
      date,
      reservations
    );
    const allocation = bookSeats(
      inventory,
      passengers.length,
      buildBerthPreferenceCounts(passengers)
    );

    if (!allocation.success) {
      setBookingError(allocation.message);
      return;
    }

    const pnr = generatePNR();

    const reservation: Reservation = {
      pnr,
      bookingType,
      trainNumber: selectedTrain.number,
      trainName: selectedTrain.name,
      fromStation: from,
      toStation: to,
      fromName: getStationLabel(from),
      toName: getStationLabel(to),
      travelDate: date,
      travelClass,
      passengers,
      totalFare,
      baseFare: selectedTrain.fare[travelClass] ?? 0,
      pricingMultiplier: fareQuote.pricingMultiplier,
      isGroupBooking: false,
      groupSize: passengers.length,
      status: allocation.isWaitlist ? "waitlisted" : "confirmed",
      bookingChannel: "public",
      bookedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      seats: allocation.bookedSeats,
    };

    await saveReservation(reservation);
    setConfirmedPNR(pnr);
    setConfirmedSeats(allocation.bookedSeats);
    setStep(3);
  };

  const copyPNR = async () => {
    if (!confirmedPNR) return;
    await navigator.clipboard.writeText(confirmedPNR);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <PageTransition>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Metro & Local Tickets</h1>
          <p className="mt-2 text-muted">
            Book urban metro and suburban local train tickets on admin-configured routes
          </p>
        </div>

        <div className="mb-6 flex gap-2">
          {(["metro", "local"] as StationNetwork[]).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setNetwork(value)}
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-medium transition-colors",
                network === value
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "border border-border bg-card text-muted hover:text-foreground"
              )}
            >
              {BOOKING_TYPE_LABELS[value]}
            </button>
          ))}
        </div>

        <StepIndicator currentStep={step} />

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="search" exit={{ opacity: 0, x: -20 }}>
              <SearchForm
                from={from}
                to={to}
                date={date}
                travelClass={travelClass}
                onFromChange={setFrom}
                onToChange={setTo}
                onDateChange={setDate}
                onClassChange={() => {}}
                onSearch={handleSearch}
                loading={loading}
                stationNetwork={network}
                searchLabel={
                  network === "metro" ? "Search Metro Services" : "Search Local Trains"
                }
              />
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="trains" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <TrainList
                trains={results}
                selectedClass={travelClass}
                onSelect={handleSelectTrain}
                from={from}
                to={to}
              />
              <Button variant="outline" className="mt-6" onClick={() => setStep(0)}>
                Modify Search
              </Button>
            </motion.div>
          )}

          {step === 2 && selectedTrain && (
            <motion.div key="passengers" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="mb-6 rounded-2xl border border-border bg-primary/5 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="accent">{selectedTrain.number}</Badge>
                  <span className="font-semibold">{selectedTrain.name}</span>
                  <Badge variant="default">{BOOKING_TYPE_LABELS[bookingType]}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted">
                  {formatDate(date)} · {getStationLabel(from)} → {getStationLabel(to)} ·{" "}
                  {formatCurrency(fareQuote.unitPrice)} per passenger
                </p>
                <div className="mt-3">
                  <Badge variant={selectedAvailableSeats > 10 ? "success" : "warning"}>
                    {selectedAvailableSeats} seats available
                  </Badge>
                </div>
              </div>
              <PassengerForm
                passengers={passengers}
                onChange={setPassengers}
                onNext={() => {
                  setBookingError("");
                  setStep(3);
                }}
                onBack={() => setStep(1)}
                travelClass={travelClass}
                farePerPassenger={fareQuote.unitPrice}
              />
            </motion.div>
          )}

          {step === 3 && !confirmedPNR && selectedTrain && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <h2 className="text-xl font-bold">Review & Confirm Ticket</h2>
              <div className="mt-6 space-y-3 text-sm">
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted">Type</span>
                  <span className="font-medium">{BOOKING_TYPE_LABELS[bookingType]}</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted">Service</span>
                  <span className="font-medium">
                    {selectedTrain.name} ({selectedTrain.number})
                  </span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted">Route</span>
                  <span className="font-medium">
                    {getStationLabel(from)} → {getStationLabel(to)}
                  </span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted">Date</span>
                  <span className="font-medium">{formatDate(date)}</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted">Passengers</span>
                  <span className="font-medium">{passengers.length}</span>
                </div>
                <div className="flex justify-between pt-2 text-lg font-bold">
                  <span>Total Fare</span>
                  <span className="text-primary">{formatCurrency(totalFare)}</span>
                </div>
              </div>

              <ul className="mt-6 space-y-2">
                {passengers.map((p, i) => (
                  <li key={p.id} className="rounded-lg bg-foreground/5 px-3 py-2 text-sm">
                    {i + 1}. {p.name} · {p.age} yrs · {p.gender}
                  </li>
                ))}
              </ul>

              {bookingError && (
                <p className="mt-4 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
                  {bookingError}
                </p>
              )}

              <div className="mt-6 flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button variant="secondary" onClick={handleConfirm}>
                  Confirm Ticket
                </Button>
              </div>
            </motion.div>
          )}

          {step === 3 && confirmedPNR && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border border-success/30 bg-success/5 p-8 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
              >
                <CheckCircle2 className="mx-auto h-16 w-16 text-success" />
              </motion.div>
              <h2 className="mt-4 text-2xl font-bold">Ticket Confirmed!</h2>
              <p className="mt-2 text-muted">
                {BOOKING_TYPE_LABELS[bookingType]} ticket — use PNR to view or cancel
              </p>

              <div className="mx-auto mt-6 max-w-xs rounded-2xl border border-border bg-card p-6">
                <Ticket className="mx-auto h-8 w-8 text-primary" />
                <p className="mt-2 text-xs uppercase tracking-widest text-muted">PNR Number</p>
                <p className="mt-1 text-3xl font-black tracking-wider text-primary">
                  {formatPNR(confirmedPNR)}
                </p>
                <Button variant="ghost" size="sm" className="mt-3" onClick={copyPNR}>
                  <Copy className="h-4 w-4" />
                  {copied ? "Copied!" : "Copy PNR"}
                </Button>
              </div>

              {confirmedSeats.length > 0 && (
                <div className="mx-auto mt-4 max-w-md rounded-xl border border-border bg-card p-4 text-left">
                  <p className="text-sm font-semibold">Allocated seats</p>
                  <p className="mt-1 text-sm text-muted">{confirmedSeats.join(", ")}</p>
                </div>
              )}

              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <a
                  href={`/api/reservations/${confirmedPNR}/ticket.pdf`}
                  download={`railconnect-ticket-${confirmedPNR}.pdf`}
                  className={buttonStyles({ variant: "secondary" })}
                >
                  <Download className="h-4 w-4" />
                  Download PDF Ticket
                </a>
                <Link href={`/reservations?pnr=${confirmedPNR}`}>
                  <Button>View Ticket</Button>
                </Link>
                <Link href="/metro">
                  <Button variant="outline">Book Another</Button>
                </Link>
                <Link href="/book">
                  <Button variant="ghost">
                    <Train className="h-4 w-4" />
                    Intercity Booking
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
