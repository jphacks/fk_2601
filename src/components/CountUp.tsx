"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";

/** 数がなめらかに変わる（はじめは from から、条件を動かしたときは、いまの数から新しい数へ） */
export function CountUp({
  value,
  from,
  duration = 900,
  format,
}: {
  value: number;
  from?: number;
  duration?: number;
  format: (value: number) => React.ReactNode;
}) {
  const reduced = useReducedMotion();
  const start = from ?? value;
  const shown = useRef(start);
  const [display, setDisplay] = useState(start);

  useEffect(() => {
    const startedAt = performance.now();
    const startValue = shown.current;
    const length = reduced ? 0 : duration;
    let frame = 0;
    const tick = (now: number) => {
      const t = length === 0 ? 1 : Math.min(1, (now - startedAt) / length);
      const eased = 1 - Math.pow(1 - t, 3);
      shown.current = startValue + (value - startValue) * eased;
      setDisplay(shown.current);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration, reduced]);

  return <>{format(display)}</>;
}
