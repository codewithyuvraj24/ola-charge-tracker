import * as XLSX from "xlsx";
import { formatDate, parseLocalDateInput, toLocalDateInputValue } from "./utils.ts";
import type { ChargingSession, SessionFormData } from "./types.ts";

function csvEscape(val: string): string {
  return `"${val.replace(/"/g, '""')}"`;
}

export function buildChargingCsv(sessions: ChargingSession[], currency: string = "₹"): string {
  const headers = [
    "Session ID",
    "Date",
    "Start %",
    "End %",
    "Added %",
    "Battery Capacity (kWh)",
    "Energy Stored (kWh)",
    "Grid Units (kWh)",
    `Rate (${currency}/kWh)`,
    "Charging Loss %",
    `Total Cost (${currency})`,
    "Start Odometer",
    "End Odometer",
    "Distance (km)",
    "Location",
    "Notes",
  ];

  const rows = sessions.map((s) => [
    csvEscape(s.id),
    csvEscape(toLocalDateInputValue(s.date.toDate())),
    s.startPercentage,
    s.endPercentage,
    s.addedPercentage,
    s.batteryCapacity,
    s.energyStored,
    s.gridUnits,
    s.electricityRate,
    s.chargingLoss,
    s.totalCost,
    s.startOdometer ?? "",
    s.endOdometer ?? "",
    s.distanceTravelled ?? "",
    csvEscape(s.location || ""),
    csvEscape(s.notes || ""),
  ]);

  return [headers.map(csvEscape).join(","), ...rows.map((r) => r.join(","))].join("\r\n");
}

export function downloadChargingCsv(sessions: ChargingSession[], currency: string = "₹"): void {
  const csvContent = buildChargingCsv(sessions, currency);
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `ola-charging-history-${toLocalDateInputValue()}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportChargingExcel(sessions: ChargingSession[], currency: string = "₹"): void {
  const rateCol = `Rate (${currency}/kWh)`;
  const costCol = `Total Cost (${currency})`;
  const data = sessions.map((s) => ({
    Date: formatDate(s.date.toDate()),
    "Start %": s.startPercentage,
    "End %": s.endPercentage,
    "Added %": s.addedPercentage,
    "Battery (kWh)": s.batteryCapacity,
    "Energy Stored (kWh)": s.energyStored,
    "Grid Units (kWh)": s.gridUnits,
    [rateCol]: s.electricityRate,
    "Loss %": s.chargingLoss,
    [costCol]: s.totalCost,
    "Start Odo (km)": s.startOdometer || "",
    "End Odo (km)": s.endOdometer || "",
    "Distance (km)": s.distanceTravelled || "",
    Location: s.location || "",
    Notes: s.notes || "",
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Charging History");
  XLSX.writeFile(workbook, `ola-charging-history-${toLocalDateInputValue()}.xlsx`);
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      cells.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  cells.push(cur.trim());
  return cells;
}

function parseFlexibleDate(raw: string): Date {
  const trimmed = (raw || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return parseLocalDateInput(trimmed);
  }
  const dmy = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/.exec(trimmed);
  if (dmy) {
    return new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]), 12, 0, 0, 0);
  }
  return new Date(trimmed);
}

export function parseChargingCsv(
  text: string,
  defaultRate: number = 12
): { rows: SessionFormData[]; hasHeaderError: boolean } {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return { rows: [], hasHeaderError: true };
  }

  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const idxDate = headers.findIndex((h) => h.includes("date"));
  const idxStart = headers.findIndex(
    (h) => h.includes("start %") || h === "start" || h.includes("startpct")
  );
  const idxEnd = headers.findIndex(
    (h) => h.includes("end %") || h === "end" || h.includes("endpct")
  );
  const idxRate = headers.findIndex((h) => h.includes("rate"));
  const idxSOdo = headers.findIndex((h) => h.includes("start odo"));
  const idxEOdo = headers.findIndex((h) => h.includes("end odo"));
  const idxLoc = headers.findIndex((h) => h.includes("location"));
  const idxNotes = headers.findIndex((h) => h.includes("note"));

  const rows: SessionFormData[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const dRaw = idxDate >= 0 ? cols[idxDate] : cols[0];
    const sPct = parseFloat(idxStart >= 0 ? cols[idxStart] : cols[1]);
    const ePct = parseFloat(idxEnd >= 0 ? cols[idxEnd] : cols[2]);
    const rVal = idxRate >= 0 ? parseFloat(cols[idxRate]) : defaultRate;

    const parsedDate = parseFlexibleDate(dRaw);
    if (isNaN(parsedDate.getTime()) || isNaN(sPct) || isNaN(ePct) || ePct <= sPct) {
      continue;
    }

    const sOdo = idxSOdo >= 0 && cols[idxSOdo] ? parseFloat(cols[idxSOdo]) : undefined;
    const eOdo = idxEOdo >= 0 && cols[idxEOdo] ? parseFloat(cols[idxEOdo]) : undefined;

    rows.push({
      date: parsedDate,
      startPercentage: Math.max(0, Math.min(99, sPct)),
      endPercentage: Math.max(1, Math.min(100, ePct)),
      electricityRate: isNaN(rVal) ? defaultRate : rVal,
      startOdometer: sOdo && !isNaN(sOdo) ? sOdo : undefined,
      endOdometer: eOdo && !isNaN(eOdo) ? eOdo : undefined,
      location: idxLoc >= 0 ? cols[idxLoc] || undefined : undefined,
      notes: idxNotes >= 0 ? cols[idxNotes] || undefined : undefined,
    });
  }

  return { rows, hasHeaderError: false };
}

