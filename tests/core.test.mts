import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateSession,
  computeDashboardStats,
  computeMonthlyData,
  computeSessionChartData,
  computeLocationData,
  computeEvVsPetrolSavings,
} from "../lib/calculations.ts";
import { toLocalDateInputValue, parseLocalDateInput, formatCurrency } from "../lib/utils.ts";
import { scooterSchema, sessionSchema } from "../lib/validations.ts";
import type { ChargingSession } from "../lib/types.ts";

function fakeTimestamp(date: Date) {
  return {
    toDate: () => date,
    toMillis: () => date.getTime(),
  } as unknown as ChargingSession["date"];
}

function makeSession(
  id: string,
  date: Date,
  overrides: Partial<ChargingSession> = {}
): ChargingSession {
  const ts = fakeTimestamp(date);
  return {
    id,
    scooterId: "s1",
    date: ts,
    startPercentage: 20,
    endPercentage: 100,
    addedPercentage: 80,
    batteryCapacity: 4,
    energyStored: 3.2,
    gridUnits: 3.5556,
    electricityRate: 12,
    chargingLoss: 10,
    totalCost: 42.67,
    location: "Home",
    createdAt: ts,
    updatedAt: ts,
    ...overrides,
  };
}

describe("calculateSession", () => {
  it("computes stored energy, grid units after thermal loss, and cost", () => {
    const res = calculateSession(20, 100, 4, 12, 10, 1000, 1085);
    assert.equal(res.addedPercentage, 80);
    assert.equal(res.energyStored, 3.2);
    assert.equal(res.gridUnits, 3.5556);
    assert.equal(res.totalCost, 42.67);
    assert.equal(res.distanceTravelled, 85);
  });

  it("supports zero-cost free charging locations", () => {
    const res = calculateSession(30, 80, 4, 0, 10);
    assert.equal(res.addedPercentage, 50);
    assert.equal(res.energyStored, 2);
    assert.equal(res.totalCost, 0);
    assert.equal(res.distanceTravelled, undefined);
  });

  it("ignores invalid backward odometer readings", () => {
    const res = calculateSession(20, 80, 4, 10, 10, 500, 450);
    assert.equal(res.distanceTravelled, undefined);
  });
});

describe("dashboard & analytics aggregators", () => {
  it("returns zeroed stats on empty list", () => {
    const stats = computeDashboardStats([]);
    assert.equal(stats.totalSessions, 0);
    assert.equal(stats.costPerKm, null);
    assert.equal(stats.kmPerKwh, null);
  });

  it("computes cycles, costPerKm, and kmPerKwh accurately", () => {
    const s1 = makeSession("1", new Date(2026, 10, 10), {
      addedPercentage: 80,
      gridUnits: 4,
      totalCost: 48,
      distanceTravelled: 100,
    });
    const s2 = makeSession("2", new Date(2026, 10, 11), {
      addedPercentage: 50,
      gridUnits: 2.5,
      totalCost: 0,
      location: "Office",
    });

    const stats = computeDashboardStats([s1, s2]);
    assert.equal(stats.totalSessions, 2);
    assert.equal(stats.totalElectricity, 6.5);
    assert.equal(stats.totalExpenditure, 48);
    assert.equal(stats.equivalentCycles, 1.3);
    assert.equal(stats.totalDistance, 100);
    assert.equal(stats.costPerKm, 0.48);
    // Efficiency uses only odometer-tracked session s1 (100km / 4kWh = 25 km/kWh)
    assert.equal(stats.kmPerKwh, 25);
  });

  it("does not mutate input array when building session chart data", () => {
    const s1 = makeSession("new", new Date(2026, 10, 12), { totalCost: 50 });
    const s2 = makeSession("old", new Date(2026, 10, 1), { totalCost: 20 });
    const input = [s1, s2];
    const chart = computeSessionChartData(input);
    assert.equal(input[0].id, "new");
    assert.equal(chart[0].cost, 20);
    assert.equal(chart[1].cost, 50);
  });

  it("aggregates monthly and location breakdowns cleanly", () => {
    const s1 = makeSession("1", new Date(2026, 9, 15), { location: "Home", totalCost: 40, gridUnits: 4 });
    const s2 = makeSession("2", new Date(2026, 10, 5), { location: "Office", totalCost: 0, gridUnits: 3 });
    const monthly = computeMonthlyData([s2, s1]);
    assert.equal(monthly.length, 2);
    assert.equal(monthly[0].expenditure, 40);

    const locs = computeLocationData([s1, s2]);
    assert.equal(locs[0].location, "Home");
    assert.equal(locs[1].location, "Office");
  });

  it("calculates EV vs petrol savings cleanly", () => {
    const res = computeEvVsPetrolSavings(450, 180, 105, 45);
    assert.equal(res.hasDistance, true);
    assert.equal(res.petrolCost, 1050);
    assert.equal(res.netSavings, 870);
  });
});

describe("date helpers & currency formatting", () => {
  it("round-trips YYYY-MM-DD in local time without UTC shift", () => {
    const parsed = parseLocalDateInput("2026-11-12");
    assert.equal(toLocalDateInputValue(parsed), "2026-11-12");
  });

  it("formats custom currencies cleanly", () => {
    assert.equal(formatCurrency(12.5, "$"), "$12.50");
    assert.equal(formatCurrency(42.67, "₹"), "₹42.67");
  });
});

describe("validation schemas", () => {
  it("allows 0 electricity rate for free public/office charging", () => {
    const valid = sessionSchema.safeParse({
      date: new Date(),
      startPercentage: 20,
      endPercentage: 80,
      electricityRate: 0,
      location: "Office",
    });
    assert.equal(valid.success, true);

    const badPct = sessionSchema.safeParse({
      date: new Date(),
      startPercentage: 80,
      endPercentage: 40,
      electricityRate: 12,
    });
    assert.equal(badPct.success, false);

    const validScooter = scooterSchema.safeParse({
      name: "Ola S1 Pro",
      model: "Ola S1 Pro Gen 2",
      batteryCapacity: 4,
      electricityRate: 12,
      chargingLoss: 10,
    });
    assert.equal(validScooter.success, true);
  });
});
