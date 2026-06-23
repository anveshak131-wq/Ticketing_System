"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Button } from "@/components/ui/Button";
import { PageTransition } from "@/components/motion/PageTransition";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Clock,
  MapPin,
  Shield,
  Ticket,
  Train,
  Users,
} from "lucide-react";
import Link from "next/link";

const features = [
  {
    icon: Train,
    title: "Live Train Search",
    desc: "Search Rajdhani, Shatabdi, Duronto and superfast trains across major Indian routes.",
  },
  {
    icon: Ticket,
    title: "Instant PNR",
    desc: "Get a unique 10-digit PNR automatically after every successful booking.",
  },
  {
    icon: Clock,
    title: "2-Day Modify Window",
    desc: "Edit or cancel your reservation up to 2 days before your journey date.",
  },
  {
    icon: Shield,
    title: "Demo Only",
    desc: "This is a learning project — not connected to official Indian Railways systems.",
  },
];

const steps = [
  { step: "01", title: "Search", desc: "Pick stations, date & class" },
  { step: "02", title: "Select Train", desc: "Compare timings & availability" },
  { step: "03", title: "Passengers", desc: "Add traveller details" },
  { step: "04", title: "Confirm", desc: "Receive your PNR instantly" },
];

export default function AboutPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(titleRef.current, {
        y: 60,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
      });
      gsap.from(subtitleRef.current, {
        y: 40,
        opacity: 0,
        duration: 1,
        delay: 0.2,
        ease: "power3.out",
      });
      gsap.from(".hero-cta", {
        y: 30,
        opacity: 0,
        duration: 0.8,
        delay: 0.5,
        stagger: 0.15,
        ease: "back.out(1.4)",
      });
      gsap.to(".hero-glow", {
        scale: 1.15,
        opacity: 0.6,
        duration: 4,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <PageTransition>
      <section ref={heroRef} className="relative overflow-hidden">
        <div className="hero-glow pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="hero-glow pointer-events-none absolute -right-32 top-20 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />

        <div className="rail-pattern relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted"
            >
              <MapPin className="h-3.5 w-3.5 text-accent" />
              Indian Railway Ticketing — Learning Demo
            </motion.div>

            <h1
              ref={titleRef}
              className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
            >
              Experience{" "}
              <span className="gradient-text">Modern Railway</span>{" "}
              Booking
            </h1>

            <p
              ref={subtitleRef}
              className="mx-auto mt-6 max-w-2xl text-lg text-muted"
            >
              RailConnect simulates the Indian Railways reservation flow — search
              trains, book tickets, and manage your journey using your PNR. Built
              for learning, not for commercial ticketing.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link href="/book" className="hero-cta">
                <Button size="lg" variant="secondary">
                  Start Booking
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/reservations" className="hero-cta">
                <Button size="lg" variant="outline">
                  Check PNR Status
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">How It Works</h2>
          <p className="mt-2 text-muted">Four simple steps to your reservation</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative rounded-2xl border border-border bg-card p-6"
            >
              <span className="text-3xl font-black text-primary/20">{item.step}</span>
              <h3 className="mt-2 font-semibold">{item.title}</h3>
              <p className="mt-1 text-sm text-muted">{item.desc}</p>
              {i < steps.length - 1 && (
                <div className="absolute -right-3 top-1/2 hidden h-0.5 w-6 bg-border lg:block" />
              )}
            </motion.div>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-card/40 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">Why RailConnect?</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="flex gap-4 rounded-2xl border border-border bg-card p-6"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <feature.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="mt-1 text-sm text-muted">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-accent p-8 text-primary-foreground sm:p-12"
        >
          <div className="relative z-10 max-w-xl">
            <div className="mb-4 flex items-center gap-2 text-sm opacity-90">
              <Users className="h-4 w-4" />
              Public demo with separate Agent & Admin portals
            </div>
            <h2 className="text-2xl font-bold sm:text-3xl">Ready to try a booking?</h2>
            <p className="mt-3 opacity-90">
              Use mock Indian Railway schedules to practice the full reservation
              flow. Your PNR is generated automatically and can be used to view,
              edit, or cancel later.
            </p>
            <Link href="/book" className="mt-6 inline-block">
              <Button variant="outline" size="lg" className="border-white/30 bg-white/10 text-white hover:bg-white/20">
                Book Your First Ticket
              </Button>
            </Link>
          </div>
          <Train className="absolute -bottom-4 -right-4 h-48 w-48 opacity-10 sm:h-64 sm:w-64" />
        </motion.div>
      </section>
    </PageTransition>
  );
}
