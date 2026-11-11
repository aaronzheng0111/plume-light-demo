import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { bookmarkById } from "../src/members/config/bookmarks";
import { UnknownBookmarkError } from "../src/members/engine/errors";
import { evaluateMembers } from "../src/members/engine/evaluateMembers";
import { InvalidMemberSnapshotError } from "../src/members/engine/errors";
import { parseMemberSnapshot } from "../src/members/services/loadMemberSnapshot";
import type { MemberBoardView, MemberSnapshot } from "../src/members/types";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const snapshot = parseMemberSnapshot(
  JSON.parse(readFileSync(join(root, "public/data/member-snapshot.json"), "utf8")),
);
const kpi = JSON.parse(readFileSync(join(root, "public/data/kpi-at-bookmarks.json"), "utf8")) as Record<
  string,
  {
    growth: { G1_cumulative_members: number; G2_join_conversion_reach_to_complete: number };
    tracking: { T2_service_booking_conversion: number; T1_days_join_to_first_paid_p50: number | null };
    commercial: { C1_service_revenue_hkd: number; C1_paid_orders: number };
  }
>;

function at(id: "A" | "P" | "E" | "C", audience: MemberBoardView["audience"] = "all", corridor: MemberBoardView["corridor"] = "all") {
  return evaluateMembers(snapshot, bookmarkById(id).at, { audience, corridor });
}

function tier(view: MemberBoardView, name: string) {
  return view.tiers.tiers.find((column) => column.tier === name);
}

describe("evaluateMembers", () => {
  it("rejects a snapshot that is missing a required key", () => {
    expect(() => parseMemberSnapshot({ meta: {} })).toThrow(InvalidMemberSnapshotError);
    try {
      parseMemberSnapshot({ meta: {} });
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidMemberSnapshotError);
      expect((error as Error).message).toBe("members");
    }
  });

  it("rejects an unknown bookmark, including the cargo clock", () => {
    expect(() => bookmarkById("CARGO")).toThrow(UnknownBookmarkError);
    expect(() => bookmarkById("Z")).toThrow(UnknownBookmarkError);
  });

  it("matches bookmark P with no audience filter", () => {
    const view = at("P");
    expect(view.map.corridors.map((row) => [row.corridor, row.activeMembers, row.students, row.parents])).toEqual([
      ["HKG-LHR", 146, 103, 43],
      ["HKG-MEL", 60, 42, 18],
      ["HKG-SYD", 30, 17, 13],
    ]);
    expect(view.map.paidMembers).toBe(236);
    expect(view.map.ignoresAudienceFilter).toBe(true);

    expect(view.revenue.revenueHkd).toBe(427600);
    expect(view.revenue.contributionProfitHkd).toBe(277940);
    expect(view.revenue.paidOrders).toBe(236);
    expect(view.revenue.averageRevenueHkd).toBe(1811.86);
    expect(view.revenue.averageProfitHkd).toBe(1177.71);
    expect(view.revenue.pickupHkd).toBe(283200);
    expect(view.revenue.extraBagHkd).toBe(113400);
    expect(view.revenue.cargoHkd).toBe(31000);
    expect(view.revenue.costAssumptionLocked).toBe(false);

    expect(view.join.cumulative).toBe(277);
    expect(view.join.today).toBe(0);
    expect(view.join.thisWeek).toBe(0);
    expect(view.join.conversion).toEqual({ rate: 0.9023, numerator: 277, denominator: 307 });
    expect(view.join.started).toEqual({ rate: expect.closeTo(288 / 307, 4), numerator: 288, denominator: 307 });
    expect(view.join.startJoin).toBe(288);
    expect(view.join.students.cumulative).toBe(180);
    expect(view.join.students.conversion.denominator).toBe(200);
    expect(view.join.parents.cumulative).toBe(97);
    expect(view.join.parents.conversion).toEqual({ rate: 0.9065, numerator: 97, denominator: 107 });
    expect(view.join.sparkline.map((point) => point.cumulative)).toEqual([23, 67, 128, 213, 262, 277, 296, 303, 315]);

    expect(view.service.bookingConversion).toEqual({ rate: 0.852, numerator: 236, denominator: 277 });
    expect(view.service.learnedThenPaid).toEqual({ rate: expect.any(Number), numerator: 236, denominator: 241 });
    expect(view.service.layers.map((layer) => layer.members)).toEqual([241, 237, 236]);
    expect(view.service.dropoffs).toEqual([4, 1]);
    expect(view.service.marksDemoAlignment).toBe(true);

    expect(view.family.sent).toBe(67);
    expect(view.family.statuses.map((status) => status.count)).toEqual([3, 7, 0, 29, 26, 2]);
    expect(view.family.accepted).toBe(55);
    expect(view.family.linkRate.rate).toBe(0.8209);
    expect(view.family.successRate.rate).toBe(0.5273);
    expect(view.family.authorizationAmongSent.rate).toBe(0.4328);
    expect(view.family.studentPull).toEqual({ rate: 1, numerator: 55, denominator: 55 });
    expect(view.family.paidUnauthorized).toBe(25);
    expect(view.family.authorizedUnpaid).toBe(1);
    expect(view.family.pendingNotJoined).toBe(1);
    expect(view.family.ignoresAudienceFilter).toBe(true);

    expect(view.increment.completedHkd).toBe(141000);
    expect(view.increment.weekToDateHkd).toBe(8800);
    expect(view.increment.parents).toEqual({ completedHkd: 82600, weekToDateHkd: 5100 });
    expect(view.increment.students).toEqual({ completedHkd: 58400, weekToDateHkd: 3700 });

    expect(view.lag.p50Days).toBe(34.34);
    expect(view.lag.p90Days).toBe(88.5);
    expect(view.lag.sampleCount).toBe(236);
    expect(view.lag.minDays).toBe(3);
    expect(view.lag.maxDays).toBe(156.66);
    expect(view.lag.bins.map((bin) => bin.count)).toEqual([55, 51, 34, 30, 26, 18, 13, 9, 0]);

    expect(tier(view, "Green")).toMatchObject({ count: 140, usage: { rate: 0.85 } });
    expect(tier(view, "Silver")).toMatchObject({ count: 74, usage: { rate: 0.8378 } });
    expect(tier(view, "Gold")).toMatchObject({ count: 45, usage: { rate: 0.8889 } });
    expect(tier(view, "Diamond")).toMatchObject({ count: 18, usage: { rate: 0.8333 } });
    expect(tier(view, "Diamond Exec")).toBeUndefined();
    expect(view.tiers.tiers.reduce((sum, column) => sum + column.count, 0)).toBe(277);

    expect(view.promo.usage).toEqual({ rate: 0.4195, numerator: 99, denominator: 236 });
    expect(view.promo.familyOrders).toBe(70);
    expect(view.promo.familyRevenueHkd).toBe(126350);
    expect(view.promo.familyCodes).toEqual([
      { code: "PLUME-ENROL", orders: 8 },
      { code: "PLUME-HOLIDAY", orders: 62 },
      { code: "PLUME-GRAD", orders: 0 },
    ]);
    expect(view.promo.officialOrders).toBe(29);
    expect(view.promo.officialCodes).toEqual([
      { code: "HKSTUDENT", orders: 18 },
      { code: "GBASTU", orders: 11 },
    ]);
    expect(view.promo.roi).toBeNull();
    expect(JSON.stringify(view)).not.toContain("CXFAMILY");
    expect(JSON.stringify(view)).not.toContain("Diamond Plus");
  });

  it("matches bookmark A", () => {
    const view = at("A");
    expect(view.join.cumulative).toBe(23);
    expect(view.join.today).toBe(0);
    expect(view.join.thisWeek).toBe(3);
    expect(view.join.conversion).toEqual({ rate: 0.6571, numerator: 23, denominator: 35 });
    expect(view.join.cumulative).not.toBe(319);
    expect(view.revenue.paidOrders).toBe(0);
    expect(view.service.bookingConversion).toEqual({ rate: 0, numerator: 0, denominator: 23 });
    expect(view.service.layers.map((layer) => layer.members)).toEqual([0, 0, 0]);
    expect(view.lag.sampleCount).toBe(0);
    expect(view.lag.p50Days).toBeNull();
    expect(view.lag.p90Days).toBeNull();
    expect(view.family.sent).toBe(0);
    expect(view.family.linkRate.rate).toBeNull();
    expect(view.family.successRate.rate).toBeNull();
    expect(view.family.authorizationAmongSent.rate).toBeNull();
    expect(tier(view, "Green")?.count).toBe(12);
    expect(tier(view, "Silver")?.count).toBe(8);
    expect(tier(view, "Gold")?.count).toBe(2);
    expect(tier(view, "Diamond")?.count).toBe(1);
    expect(view.tiers.tiers.every((column) => column.usage.rate === 0)).toBe(true);
    expect(tier(view, "Diamond Exec")).toBeUndefined();
  });

  it("matches bookmark E, including Diamond Exec", () => {
    const view = at("E");
    expect(view.join.cumulative).toBe(296);
    expect(view.service.bookingConversion).toEqual({ rate: 0.875, numerator: 259, denominator: 296 });
    expect(view.revenue.revenueHkd).toBe(469950);
    expect(view.revenue.contributionProfitHkd).toBe(305467.5);
    expect(view.revenue.paidOrders).toBe(259);
    expect(tier(view, "Diamond Exec")).toMatchObject({ count: 8, usage: { rate: 1 } });
    expect(tier(view, "Green")?.count).toBe(151);
    expect(tier(view, "Silver")?.count).toBe(77);
    expect(tier(view, "Gold")?.count).toBe(49);
    expect(tier(view, "Diamond")?.count).toBe(11);
    expect(view.tiers.tiers.reduce((sum, column) => sum + column.count, 0)).toBe(296);
    expect(view.family.sent).toBe(75);
    expect(view.family.linkRate.rate).toBe(0.7867);
    expect(view.family.successRate.rate).toBe(0.5424);
  });

  it("filters parents at P without moving the full-population blocks", () => {
    const all = at("P");
    const parents = at("P", "parents");
    expect(parents.join.cumulative).toBe(97);
    expect(parents.join.conversion).toEqual({ rate: 0.9065, numerator: 97, denominator: 107 });
    expect(parents.service.bookingConversion).toEqual({ rate: 0.7629, numerator: 74, denominator: 97 });
    expect(parents.service.layers.map((layer) => layer.members)).toEqual([75, 74, 74]);
    expect(parents.increment.completedHkd).toBe(82600);
    expect(parents.increment.weekToDateHkd).toBe(5100);
    expect(parents.increment.students).toEqual({ completedHkd: 0, weekToDateHkd: 0 });
    expect(parents.lag.p50Days).toBe(38.64);
    expect(parents.lag.p90Days).toBe(77.56);
    expect(parents.lag.sampleCount).toBe(74);
    expect(tier(parents, "Green")).toMatchObject({ count: 54, usage: { rate: 0.7963 } });
    expect(tier(parents, "Silver")).toMatchObject({ count: 21, usage: { rate: 0.619 } });
    expect(tier(parents, "Gold")).toMatchObject({ count: 15, usage: { rate: 0.8 } });
    expect(tier(parents, "Diamond")).toMatchObject({ count: 7, usage: { rate: 0.8571 } });
    expect(tier(parents, "Diamond Exec")).toBeUndefined();
    expect(parents.tiers.tiers.reduce((sum, column) => sum + column.count, 0)).toBe(97);

    expect(parents.revenue).toEqual(all.revenue);
    expect(parents.family).toEqual(all.family);
    expect(parents.promo).toEqual(all.promo);
    expect(parents.map).toEqual(all.map);
    expect(parents.revenue.ignoresAudienceFilter).toBe(true);
    expect(parents.promo.ignoresAudienceFilter).toBe(true);
  });

  it("keeps the three filter invariants and the corridor split", () => {
    const view = at("P");
    expect(view.join.students.cumulative + view.join.parents.cumulative).toBe(277);
    const parentIncrement = view.increment.parents.completedHkd + view.increment.parents.weekToDateHkd;
    const studentIncrement = view.increment.students.completedHkd + view.increment.students.weekToDateHkd;
    expect(parentIncrement + studentIncrement).toBe(view.increment.completedHkd + view.increment.weekToDateHkd);
    expect(view.tiers.tiers.reduce((sum, column) => sum + column.count, 0)).toBe(view.join.cumulative);

    const lhr = at("P", "all", "HKG-LHR");
    expect(lhr.increment.completedHkd + lhr.increment.weekToDateHkd).toBe(39200 + 2300);
    expect(lhr.increment.parents.completedHkd + lhr.increment.parents.weekToDateHkd + lhr.increment.students.completedHkd + lhr.increment.students.weekToDateHkd).toBe(41500);
    const mel = at("P", "all", "HKG-MEL");
    expect(mel.increment.completedHkd + mel.increment.weekToDateHkd).toBe(49400 + 3200);
    const syd = at("P", "all", "HKG-SYD");
    expect(syd.increment.completedHkd + syd.increment.weekToDateHkd).toBe(52400 + 3300);
    expect(syd.join.cumulative).toBe(view.join.cumulative);
  });

  it("agrees with kpi-at-bookmarks for A, P and E", () => {
    for (const id of ["A", "P", "E"] as const) {
      const view = at(id);
      expect(view.join.cumulative).toBe(kpi[id].growth.G1_cumulative_members);
      expect(view.join.conversion.rate).toBe(kpi[id].growth.G2_join_conversion_reach_to_complete);
      expect(view.service.bookingConversion.rate).toBe(kpi[id].tracking.T2_service_booking_conversion);
      expect(view.lag.p50Days).toBe(kpi[id].tracking.T1_days_join_to_first_paid_p50);
      expect(view.revenue.revenueHkd).toBe(kpi[id].commercial.C1_service_revenue_hkd);
      expect(view.revenue.paidOrders).toBe(kpi[id].commercial.C1_paid_orders);
    }
  });

  it("drops names and member ids before the view model", () => {
    const view = at("P");
    const encoded = JSON.stringify(view);
    expect(encoded).not.toContain("May Chen");
    expect(encoded).not.toContain("Lin Chen");
    expect(encoded).not.toContain("Alex Chen");
    expect(encoded).not.toContain("Emily Chen");
    expect(encoded).not.toContain("member_id");
    expect(encoded).not.toContain("memberId");
    expect(encoded).not.toContain("order_id");
    expect(encoded).not.toContain("link_id");
  });

  it("does not import React from the member engine", () => {
    const dir = join(root, "src/members/engine");
    for (const file of readdirSync(dir)) {
      const source = readFileSync(join(dir, file), "utf8");
      expect(source).not.toMatch(/from ["']react/);
      expect(source).not.toMatch(/from ["']react-dom/);
    }
  });
});

void snapshot satisfies MemberSnapshot;
