import { formatKg, formatPct } from "../../format/display";
import { useI18n } from "../../i18n/useI18n";
import type { KpiSummary } from "../../types/kanban";
import { InfoPopover } from "../common/InfoPopover";
import { KpiCard } from "./KpiCard";
import styles from "./KpiSummaryRow.module.css";

export function KpiSummaryRow({ kpi }: { kpi: KpiSummary }) {
  const { t } = useI18n();
  const totalStatus = kpi.overCount + kpi.cautionCount + kpi.normalCount + kpi.cargoUnknownCount;
  return (
    <div className={styles.row}>
      <KpiCard
        title={t("kb.kpi.flights")}
        value={kpi.flightCount}
        sub={`${kpi.cargoUnknownCount} ${t("kb.kpi.flightsSub")}`}
      />
      <KpiCard
        title={t("kb.kpi.status")}
        hint={<InfoPopover label={t("kb.kpi.statusHint")}>{t("kb.kpi.statusHint")}</InfoPopover>}
        value={null}
        sub={
          <>
            <b className={styles.bad}>OVER {kpi.overCount}</b>
            {" · "}
            <b className={styles.warn}>CAUTION {kpi.cautionCount}</b>
            {" · "}
            <b className={styles.ok}>NORMAL {kpi.normalCount}</b>
            {" · "}UNK {kpi.cargoUnknownCount}
          </>
        }
      >
        <div className={styles.bar}>
          <i style={{ flex: kpi.overCount || 0.0001, background: "var(--bad)" }} />
          <i style={{ flex: kpi.cautionCount || 0.0001, background: "var(--warn)" }} />
          <i style={{ flex: kpi.normalCount || 0.0001, background: "var(--ok)" }} />
          <i style={{ flex: kpi.cargoUnknownCount || 0.0001, background: "var(--off)" }} />
        </div>
        <span className="visually-hidden">{totalStatus} flights</span>
      </KpiCard>
      <KpiCard
        title={t("kb.kpi.deficit")}
        hint={<InfoPopover label={t("kb.kpi.deficitHint")}>{t("kb.kpi.deficitHint")}</InfoPopover>}
        value={
          <>
            {formatKg(kpi.totalDeficitKg)} <span className={styles.unit}>kg</span>
          </>
        }
        sub={`DEFER ${formatKg(kpi.totalDeferKg)} kg · ${kpi.overFlightCount} ${t("kb.kpi.deferLine")}`}
      />
      <KpiCard
        title={t("kb.kpi.plume")}
        hint={<InfoPopover label={t("kb.kpi.plumeHint")}>{t("kb.kpi.plumeHint")}</InfoPopover>}
        value={formatPct(kpi.plumeShareRatio)}
        sub={`${formatKg(kpi.plumeOnFlightKg)} / ${formatKg(kpi.totalCapacityKg)} kg`}
      />
    </div>
  );
}
