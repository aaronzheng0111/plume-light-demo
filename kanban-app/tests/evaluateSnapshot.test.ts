import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { evaluateSnapshot } from "../src/engine/evaluateSnapshot";
import type { RawKanbanSnapshot } from "../src/types/kanban";

const snapshot = JSON.parse(
  readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), "..", "public", "data", "kanban-snapshot.json"),
    "utf8",
  ),
) as RawKanbanSnapshot;

describe("evaluateSnapshot", () => {
  it("matches Plan §7 assertions for the seven-flight window", () => {
    const view = evaluateSnapshot(snapshot, snapshot.asOf);
    const cx251 = view.deferralPlans.CX251;
    const cx253 = view.deferralPlans.CX253;
    const cx257 = view.deferralPlans.CX257;
    const cx261 = view.flights.find((flight) => flight.flightId === "CX261");

    expect(cx251.deficitKg).toBe(1056);
    expect(cx251.deferKg).toBe(386);
    expect(cx251.residualKg).toBe(670);
    expect(cx251.assessment).toBe("PARTIAL");

    expect(cx253.deficitKg).toBe(332);
    expect(cx253.deferKg).toBe(352);
    expect(cx253.assessment).toBe("CLEAR");

    expect(cx257.assessment).toBe("MONITOR");

    const receivedKg = cx251.deferKg + cx253.deferKg;
    expect(receivedKg).toBe(738);
    const loadAfterBoth = ((cx261?.totalKg as number) + receivedKg) / (cx261?.capacityKg as number);
    expect(loadAfterBoth).toBeLessThan(0.9);

    const queueIds = view.actionQueue.map((item) => item.flightId);
    expect(queueIds).toContain("CX257");
    expect(queueIds).toContain("CX251");
    expect(queueIds).toContain("CX253");
    expect(view.actionQueue.find((item) => item.flightId === "CX257")?.assessment).toBe("MONITOR");
    expect(view.actionQueue.find((item) => item.flightId === "CX251")?.assessment).toBe("PARTIAL");
    expect(view.actionQueue.find((item) => item.flightId === "CX253")?.assessment).toBe("CLEAR");

    expect(view.kpi.flightCount).toBe(7);
    expect(view.kpi.cargoUnknownCount).toBe(2);
    expect(view.kpi.overCount).toBe(2);
    expect(view.kpi.totalDeficitKg).toBe(1388);
    expect(view.kpi.totalDeferKg).toBe(738);
    expect(view.kpi.plumeOnFlightKg).toBe(5386);
    expect(view.kpi.totalCapacityKg).toBe(178900);
  });

  it("shrinks CX251 candidates when the window is 1 day", () => {
    const oneDay = evaluateSnapshot({ ...snapshot, windowDays: 1 }, snapshot.asOf);
    const ids = oneDay.deferralPlans.CX251.candidates.map((item) => item.flightId);
    expect(ids).toEqual(["CX253", "CX255"]);
    expect(oneDay.deferralPlans.CX251.deferKg).toBe(0);
    expect(oneDay.deferralPlans.CX251.assessment).toBe("NO_GO");
  });
});
