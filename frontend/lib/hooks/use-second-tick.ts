"use client";

import { useEffect, useState } from "react";

/** Re-render every second so sync-age labels stay fresh. */
export function useSecondTick() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  return tick;
}
