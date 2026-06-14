import type { Metadata } from "next";
import { AppProviders } from "@/components/providers/app-providers";
import { Navbar } from "@/components/layout/navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Crypto Market Intelligence Radar",
  description: "Explainable anomaly detection powered by market data",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body>
        <AppProviders>
          <Navbar />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
