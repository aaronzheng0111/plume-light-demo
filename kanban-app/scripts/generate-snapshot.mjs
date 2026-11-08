import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_PLUME_BAG_M3 = 0.19;

function repeat(kg, count) {
  return Array.from({ length: count }, () => kg);
}

function bags(prefix, weights, mode, state) {
  return weights.map((kg, index) => ({
    bagId: `${prefix}-${String(index + 1).padStart(3, "0")}`,
    kg,
    m3: DEFAULT_PLUME_BAG_M3,
    mode,
    state,
  }));
}

const snapshot = {
  asOf: "2026-11-15T05:30:00+08:00",
  sector: "HKG-LHR",
  windowDays: 2,
  nearHours: 6,
  aircraftSpecs: {
    "A350-900": { capKg: 22050, capM3: 172.0, seats: 280 },
    "A350-1000": { capKg: 26660, capM3: 208.0, seats: 334 },
    "777-300ER": { capKg: 27410, capM3: 213.8, seats: 368 },
  },
  flights: [
    {
      id: "CX257",
      dep: "2026-11-15T09:30:00+08:00",
      aircraft: "A350-1000",
      seats: 334,
      capOverride: null,
      cargoKg: 17400,
      cargoM3: 108.75,
      plumePax: 20,
      plumeBags: [
        ...bags("PL-257-A", repeat(20, 6), "on_flight", "arrived"),
        ...bags("PL-257-F", repeat(19, 50), "on_flight", "staged"),
      ],
    },
    {
      id: "CX251",
      dep: "2026-11-15T23:40:00+08:00",
      aircraft: "777-300ER",
      seats: 368,
      capOverride: null,
      cargoKg: 19600,
      cargoM3: 122.5,
      plumePax: 28,
      plumeBags: [
        ...bags("PL-251-A", [24, 24, 23, 22, 21, 20], "cargo", "arrived"),
        ...bags("PL-251-D", [...repeat(22, 8), ...repeat(21, 10)], "cargo", "staged"),
        ...bags("PL-251-F", [...repeat(16, 30), ...repeat(15, 12)], "on_flight", "staged"),
      ],
    },
    {
      id: "CX253",
      dep: "2026-11-16T09:30:00+08:00",
      aircraft: "A350-900",
      seats: 280,
      capOverride: null,
      cargoKg: 14850,
      cargoM3: 92.8125,
      plumePax: 16,
      plumeBags: [
        ...bags("PL-253-D", [...repeat(26, 10), ...repeat(23, 4), ...repeat(19, 32)], "cargo", "staged"),
        ...bags("PL-253-F", repeat(25, 20), "on_flight", "staged"),
      ],
    },
    {
      id: "CX255",
      dep: "2026-11-16T23:55:00+08:00",
      aircraft: "A350-1000",
      seats: 300,
      capOverride: null,
      cargoKg: null,
      cargoM3: null,
      plumePax: 12,
      plumeBags: [
        ...bags("PL-255-A", repeat(20, 4), "cargo", "arrived"),
        ...bags("PL-255-F", repeat(20, 26), "on_flight", "staged"),
      ],
    },
    {
      id: "CX259",
      dep: "2026-11-17T09:30:00+08:00",
      aircraft: "A350-900",
      seats: 260,
      capOverride: null,
      cargoKg: 13200,
      cargoM3: 100.7,
      plumePax: 10,
      plumeBags: bags("PL-259-F", [...repeat(20, 20), ...repeat(25, 2)], "on_flight", "staged"),
    },
    {
      id: "CX261",
      dep: "2026-11-17T23:40:00+08:00",
      aircraft: "777-300ER",
      seats: 294,
      capOverride: null,
      cargoKg: 14900,
      cargoM3: 93.125,
      plumePax: 14,
      plumeBags: [
        ...bags("PL-261-A", [...repeat(18, 5)], "cargo", "arrived"),
        ...bags("PL-261-F", repeat(20, 28), "on_flight", "staged"),
      ],
    },
    {
      id: "CX263",
      dep: "2026-11-18T09:30:00+08:00",
      aircraft: "A350-1000",
      seats: 334,
      capOverride: null,
      cargoKg: null,
      cargoM3: null,
      plumePax: 6,
      plumeBags: bags("PL-263-F", repeat(20, 20), "on_flight", "staged"),
    },
  ],
};

const root = dirname(fileURLToPath(import.meta.url));
const outPath = join(root, "..", "public", "data", "kanban-snapshot.json");
writeFileSync(outPath, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(`wrote ${outPath}`);
