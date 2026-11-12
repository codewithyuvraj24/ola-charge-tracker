import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = "₹"): string {
  return `${currency}${amount.toFixed(2)}`;
}

export function formatNumber(num: number, decimals: number = 2): string {
  return num.toFixed(decimals);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

/**
 * Formats a Date into local YYYY-MM-DD for <input type="date"> without UTC day-shift.
 */
export function toLocalDateInputValue(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Parses a YYYY-MM-DD <input type="date"> string at local noon to prevent UTC timezone day shifts.
 */
export function parseLocalDateInput(dateStr: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim());
  if (!match) return new Date(dateStr);
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  return new Date(year, month, day, 12, 0, 0, 0);
}

export function getDateRange(filter: string): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  let start: Date;

  switch (filter) {
    case "7d":
      start = new Date(now);
      start.setDate(start.getDate() - 7);
      break;
    case "30d":
      start = new Date(now);
      start.setDate(start.getDate() - 30);
      break;
    case "3m":
      start = new Date(now);
      start.setMonth(start.getMonth() - 3);
      break;
    case "6m":
      start = new Date(now);
      start.setMonth(start.getMonth() - 6);
      break;
    case "1y":
      start = new Date(now.getFullYear(), 0, 1);
      break;
    case "all":
    default:
      start = new Date(2020, 0, 1);
      break;
  }

  start.setHours(0, 0, 0, 0);
  return { start, end };
}

