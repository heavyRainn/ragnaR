"use client";

import { useEffect, useState } from "react";

/** Re-render every minute so relative timestamps stay fresh. */
export function useMinuteTick() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  return tick;
}
