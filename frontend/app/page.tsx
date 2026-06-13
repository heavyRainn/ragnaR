import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="max-w-2xl text-center">
        <p className="mb-4 font-mono text-sm uppercase tracking-[0.3em] text-radar-accent">
          Market Intelligence
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-cmc-text sm:text-5xl">
          Crypto Market Intelligence Radar
        </h1>
        <p className="mt-4 text-lg text-cmc-muted">
          Explainable anomaly detection powered by market data
        </p>
        <Link
          href="/radar"
          className="mt-8 inline-flex items-center rounded-lg border border-radar-accent/50 bg-radar-accent/10 px-6 py-3 font-mono text-sm font-semibold text-radar-accent transition hover:bg-radar-accent/20"
        >
          Open Market Radar →
        </Link>
      </div>
    </main>
  );
}
