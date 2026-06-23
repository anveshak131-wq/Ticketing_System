import { Train } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-card/50">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Train className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">RailConnect Demo</p>
            <p className="text-xs text-muted">Educational project — not affiliated with Indian Railways</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-muted">
          <Link href="/about" className="hover:text-foreground">About</Link>
          <Link href="/book" className="hover:text-foreground">Book</Link>
          <Link href="/reservations" className="hover:text-foreground">My PNR</Link>
          <Link href="/agent/login" className="hover:text-foreground">Agent</Link>
          <Link href="/admin/login" className="hover:text-foreground">Admin</Link>
        </div>
      </div>
    </footer>
  );
}
