"use client";

import { useState, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { SNOOZE_OPTIONS } from "@/types/alert";

interface SnoozeButtonProps {
  alertId: Id<"alerts">;
  disabled?: boolean;
  onSnooze?: () => void;
}

export function SnoozeButton({
  alertId,
  disabled,
  onSnooze,
}: SnoozeButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const snooze = useMutation(api.alerts.snooze);

  const handleSnooze = useCallback(
    (duration: number) => {
      const snoozeUntil = Date.now() + duration;
      snooze({
        alertId,
        until: snoozeUntil,
      })
        .then(() => {
          setIsOpen(false);
          onSnooze?.();
        })
        .catch((error) => {
          console.error("Failed to snooze alert:", error);
        });
    },
    [alertId, onSnooze, snooze],
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg
          className="w-4 h-4 mr-1.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        Snooze
      </button>

      {isOpen && (
        <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            {SNOOZE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSnooze(option.value)}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
