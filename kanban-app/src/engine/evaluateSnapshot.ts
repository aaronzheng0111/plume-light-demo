import type {
  ActionQueueItem,
  HoldLoadView,
  KpiSummary,
  RawKanbanSnapshot,
  SnapshotViewModel,
} from "../types/kanban";
import { buildLoadMap, planDeferral } from "./deferralPlan";

function buildKpi(flights: readonly HoldLoadView[], totalDeferKg: number): KpiSummary {
  const overCount = flights.filter((flight) => flight.status === "OVER").length;
  const cautionCount = flights.filter((flight) => flight.status === "CAUTION").length;
  const normalCount = flights.filter((flight) => flight.status === "NORMAL").length;
  const cargoUnknownCount = flights.filter((flight) => flight.status === "CARGO_UNK").length;
  const totalDeficitKg = flights.reduce((sum, flight) => sum + flight.deficitKg, 0);
  const plumeOnFlightKg = flights.reduce((sum, flight) => sum + flight.plumeOnFlightKg, 0);
  const totalCapacityKg = flights.reduce((sum, flight) => sum + flight.capacityKg, 0);
  return {
    flightCount: flights.length,
    cargoUnknownCount,
    overCount,
    cautionCount,
    normalCount,
    totalDeficitKg,
    totalDeferKg,
    overFlightCount: overCount,
    plumeShareRatio: totalCapacityKg === 0 ? 0 : plumeOnFlightKg / totalCapacityKg,
    plumeOnFlightKg,
    totalCapacityKg,
  };
}

function isActionable(flight: HoldLoadView): boolean {
  if (flight.status === "OVER") {
    return true;
  }
  return flight.status === "CAUTION" && flight.isNearDeparture;
}

export function evaluateSnapshot(
  snapshot: RawKanbanSnapshot,
  asOf: string = snapshot.asOf,
): SnapshotViewModel {
  const loadsById = buildLoadMap(snapshot, asOf);
  const flights = snapshot.flights.map((flight) => loadsById.get(flight.id) as HoldLoadView);
  const deferralPlans: SnapshotViewModel["deferralPlans"] = {};

  for (const flight of snapshot.flights) {
    deferralPlans[flight.id] = planDeferral(flight, snapshot, loadsById);
  }

  const actionQueue: ActionQueueItem[] = flights
    .filter(isActionable)
    .map((flight) => {
      const plan = deferralPlans[flight.flightId];
      const targetFlightId =
        plan.candidates.find((candidate) => candidate.allocatedKg > 0)?.flightId ?? null;
      return {
        flightId: flight.flightId,
        status: flight.status,
        weightLoadRatio: flight.weightLoadRatio,
        hoursToDeparture: flight.hoursToDeparture,
        deficitKg: plan.deficitKg,
        deferKg: plan.deferKg,
        residualKg: plan.residualKg,
        targetFlightId,
        assessment: plan.assessment,
      };
    })
    .sort((left, right) => left.hoursToDeparture - right.hoursToDeparture);

  const totalDeferKg = Object.values(deferralPlans).reduce(
    (sum, plan) => sum + plan.deferKg,
    0,
  );

  return {
    asOf,
    sector: snapshot.sector,
    windowDays: snapshot.windowDays,
    nearHours: snapshot.nearHours,
    flights,
    deferralPlans,
    actionQueue,
    kpi: buildKpi(flights, totalDeferKg),
  };
}
