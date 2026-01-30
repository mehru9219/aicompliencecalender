"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import Threads from "@/components/Threads";

// Colors from COLORPALETTE.md:
// Light: brown oklch(0.4341...) ≈ [0.45, 0.38, 0.35]
// Dark: warm amber oklch(0.9247...) ≈ [0.95, 0.88, 0.78]

export function ThreadsBackground() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const color: [number, number, number] =
    resolvedTheme === "dark"
      ? [0.95, 0.88, 0.78] // warm amber
      : [0.45, 0.38, 0.35]; // brown

  return (
    <div className="absolute inset-0 pointer-events-none">
      <Threads
        color={color}
        amplitude={1}
        distance={0}
        enableMouseInteraction
      />
    </div>
  );
}
