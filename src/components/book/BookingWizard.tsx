"use client";

import { PassengerForm } from "@/components/book/PassengerForm";
import { SearchForm } from "@/components/book/SearchForm";
import { StepIndicator } from "@/components/book/StepIndicator";
import { TrainList } from "@/components/book/TrainList";
import { PageTransition } from "@/components/motion/PageTransition";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { buttonStyles } from "@/components/ui/button-styles";
import { getStationLabel, searchTrains } from "@/lib/train-search";
import { saveReservation } from "@/lib/booking-store";
import { generatePNR, formatPNR } from "@/lib/pnr";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { BookingChannel, Passenger, Reservation, TrainSearchResult, TravelClass } from "@/types";
import { CLASS_LABELS } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Copy, Download, Ticket } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

interface AgentInfo {
  id: string;
  name: string;
  agentCode?: string;
}

interface BookingWizardProps {
  mode?: BookingChannel;
  agent?: AgentInfo;
}

function createDefaultPassenger(): Passenger {
  return {
    id: crypto.randomUUID(),
    name: "",
    age: 25,
    gender: "male",
    berthPreference: "none",
  };
}

export function BookingWizard({ mode = "public", agent }: BookingWizardProps) {
  const isAgent = mode === "agent";
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState("NDLS");
  const [to, setTo] = useState("BCT");
  const [date, setDate] = useState("");
  const [travelClass, setTravelClass] = useState<TravelClass>("3A");
  const [results, setResults] = useState<TrainSearchResult[]>([]);
  const [selectedTrain, setSelectedTrain] = useState<TrainSearchResult | null>(null);
  const [passengers, setPassengers] = useState<Passenger[]>([createDefaultPassenger()]);
  const [confirmedPNR, setConfirmedPNR] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const totalFare = useMemo(() => {
    if (!selectedTrain) return 0;
    const perPerson = selectedTrain.fare[travelClass] ?? 0;
    return perPerson * passengers.length;
  }, [selectedTrain, travelClass, passengers.length]);

  const handleSearch = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setResults(searchTrains(from, to, date));
    setLoading(false);
    setStep(1);
  };

  const handleSelectTrain = (train: TrainSearchResult) => {
    setSelectedTrain(train);
    setStep(2);
  };

  const handleConfirm = async () => {
    if (!selectedTrain) return;

    const pnr = generatePNR();

    const reservation: Reservation = {
      pnr,
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
      status: "confirmed",
      bookingChannel: mode,
      bookedBy: isAgent ? agent?.name : undefined,
      bookedById: isAgent ? agent?.id : undefined,
      agentCode: isAgent ? agent?.agentCode : undefined,
      bookedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveReservation(reservation);
    setConfirmedPNR(pnr);
    setStep(3);
  };

  const copyPNR = async () => {
    if (!confirmedPNR) return;
    await navigator.clipboard.writeText(confirmedPNR);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const wrapperClass = isAgent ? "" : "mx-auto max-w-4xl px-4 py-10 sm:px-6";

  return (
    <PageTransition>
      <div className={wrapperClass}>
        {!isAgent && (
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Book Your Journey</h1>
            <p className="mt-2 text-muted">
              Search Indian Railway trains and reserve your seats
            </p>
          </div>
        )}

        {isAgent && (
          <div className="mb-8">
            <h1 className="text-2xl font-bold">Counter Booking</h1>
            <p className="mt-1 text-muted">Book on behalf of a passenger</p>
          </div>
        )}

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
                onClassChange={setTravelClass}
                onSearch={handleSearch}
                loading={loading}
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
                </div>
                <p className="mt-2 text-sm text-muted">
                  {formatDate(date)} · {getStationLabel(from)} → {getStationLabel(to)} ·{" "}
                  {CLASS_LABELS[travelClass]} · {formatCurrency(totalFare)} total
                </p>
              </div>
              <PassengerForm
                passengers={passengers}
                onChange={setPassengers}
                onNext={() => setStep(3)}
                onBack={() => setStep(1)}
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
              <h2 className="text-xl font-bold">Review & Confirm</h2>
              {isAgent && (
                <p className="mt-1 text-sm text-muted">Booking as agent: {agent?.name}</p>
              )}
              <div className="mt-6 space-y-3 text-sm">
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted">Train</span>
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
                  <span className="text-muted">Class</span>
                  <span className="font-medium">{CLASS_LABELS[travelClass]}</span>
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

              <div className="mt-6 flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button variant="secondary" onClick={handleConfirm}>
                  Confirm Booking
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
              <h2 className="mt-4 text-2xl font-bold">Booking Confirmed!</h2>
              <p className="mt-2 text-muted">PNR generated — share with passenger</p>

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

              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <a
                  href={`/api/reservations/${confirmedPNR}/ticket.pdf`}
                  download={`railconnect-ticket-${confirmedPNR}.pdf`}
                  className={buttonStyles({ variant: "secondary" })}
                >
                  <Download className="h-4 w-4" />
                  Download PDF Ticket
                </a>
                {isAgent ? (
                  <>
                    <Link href="/agent/dashboard">
                      <Button>Back to Dashboard</Button>
                    </Link>
                    <Link href="/agent/book">
                      <Button variant="outline">Book Another</Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href={`/reservations?pnr=${confirmedPNR}`}>
                      <Button>View Reservation</Button>
                    </Link>
                    <Link href="/book">
                      <Button variant="outline">Book Another</Button>
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
