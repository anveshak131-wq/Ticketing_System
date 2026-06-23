"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getDemoCredentials, login } from "@/lib/auth-store";
import { useAuth } from "@/hooks/use-auth";
import type { UserRole } from "@/types";
import { motion } from "framer-motion";
import { Lock, LogIn, Mail, Train } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface LoginFormProps {
  role: UserRole;
  title: string;
  subtitle: string;
  redirectTo: string;
  accentClass?: string;
}

export function LoginForm({
  role,
  title,
  subtitle,
  redirectTo,
  accentClass = "from-primary to-accent",
}: LoginFormProps) {
  const router = useRouter();
  const session = useAuth();
  const demo = getDemoCredentials(role);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session?.role === role) {
      router.replace(redirectTo);
    }
  }, [session, role, redirectTo, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = login(email, password, role);
    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    router.replace(redirectTo);
  };

  const fillDemo = () => {
    setEmail(demo.email);
    setPassword(demo.password);
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className={`mb-8 rounded-2xl bg-gradient-to-br ${accentClass} p-6 text-white shadow-xl`}>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
              <Train className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{title}</h1>
              <p className="text-sm opacity-90">{subtitle}</p>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-border bg-card p-6 shadow-sm"
        >
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div className="mt-4">
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="mt-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}

          <Button type="submit" className="mt-6 w-full" disabled={loading}>
            <LogIn className="h-4 w-4" />
            {loading ? "Signing in..." : "Sign In"}
          </Button>

          <button
            type="button"
            onClick={fillDemo}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border px-4 py-2.5 text-sm text-muted transition hover:border-primary hover:text-foreground"
          >
            <Mail className="h-4 w-4" />
            Use demo credentials
          </button>

          <div className="mt-4 rounded-xl bg-foreground/5 p-3 text-xs text-muted">
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <Lock className="h-3.5 w-3.5" />
              Demo only — not for production
            </div>
            <p className="mt-1">
              {demo.email} / {demo.password}
            </p>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          <Link href="/about" className="text-primary hover:underline">
            ← Back to public site
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
