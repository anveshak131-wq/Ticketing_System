import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { LayoutShell } from "@/components/layout/LayoutShell";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { DataProvider } from "@/components/providers/DataProvider";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RailConnect | Indian Railway Demo Booking",
  description:
    "Educational Indian Railway ticket booking demo. Search trains, book reservations, and manage your PNR.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${outfit.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        <ThemeProvider>
          <DataProvider>
            <LayoutShell>{children}</LayoutShell>
          </DataProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
