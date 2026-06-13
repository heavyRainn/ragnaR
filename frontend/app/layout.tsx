import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Crypto Market Intelligence Radar",
  description: "Explainable anomaly detection powered by market data",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
