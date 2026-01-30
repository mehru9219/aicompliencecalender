"use client";

import { cn } from "@/lib/utils";

interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  color?: "green" | "yellow" | "red";
  showValue?: boolean;
}

export function CircularProgress({
  value,
  size = 120,
  strokeWidth = 10,
  className,
  color = "green",
  showValue = false,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  const colorClasses = {
    green: "stroke-green-500",
    yellow: "stroke-amber-500",
    red: "stroke-red-500",
  };

  const bgColorClasses = {
    green: "stroke-green-100 dark:stroke-green-950",
    yellow: "stroke-amber-100 dark:stroke-amber-950",
    red: "stroke-red-100 dark:stroke-red-950",
  };

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center",
        className,
      )}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Compliance score: ${value}%`}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={bgColorClasses[color]}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={cn(
            colorClasses[color],
            "transition-all duration-500 ease-out",
          )}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
          }}
        />
      </svg>
      {showValue && (
        <span className="absolute text-2xl font-bold">{value}%</span>
      )}
    </div>
  );
}
