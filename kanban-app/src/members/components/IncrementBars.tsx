import { useI18n } from "../../i18n/useI18n";
import { formatHkd } from "../format";
import type { Corridor, IncrementView } from "../types";
import { MemberCard } from "./MemberCard";
import styles from "./IncrementBars.module.css";

const CORRIDORS: readonly Corridor[] = ["HKG-LHR", "HKG-MEL", "HKG-SYD"];

export function IncrementBars({
  increment,
  corridor,
  onCorridorChange,
}: {
  increment: IncrementView;
  corridor: Corridor | "all";
  onCorridorChange: (corridor: Corridor | "all") => void;
}) {
  const { t } = useI18n();
  const rows = [
    { label: t("mb.inc.parents"), slice: increment.parents },
    { label: t("mb.inc.students"), slice: increment.students },
  ];
  const max = Math.max(
    ...rows.map((row) => row.slice.completedHkd + row.slice.weekToDateHkd),
    1,
  );

  return (
    <MemberCard index={5} questionKey="mb.q5" showScopeAll={false}>
      <div className={styles.metrics}>
        <p>
          <small>{t("mb.inc.completed")}</small>
          <b>{formatHkd(increment.completedHkd)}</b>
        </p>
        <p>
          <small>{t("mb.inc.partial")}</small>
          <b className={styles.mid}>{formatHkd(increment.weekToDateHkd)}</b>
        </p>
      </div>
      <div className={styles.lanes}>
        {rows.map((row) => (
          <div key={row.label}>
            <div className={styles.top}>
              <span>{row.label}</span>
              <b>
                {formatHkd(row.slice.completedHkd)} + {formatHkd(row.slice.weekToDateHkd)}
              </b>
            </div>
            <div className={styles.track}>
              <i className={styles.done} style={{ width: `${(row.slice.completedHkd / max) * 100}%` }} />
              <i className={styles.hatch} style={{ width: `${(row.slice.weekToDateHkd / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className={styles.key}>
        <span><i className={styles.done} />{t("mb.inc.completed")}</span>
        <span><i className={styles.hatch} />{t("mb.inc.partial")}</span>
      </div>
      <div className={styles.segs}>
        <button type="button" className={corridor === "all" ? styles.on : ""} onClick={() => onCorridorChange("all")}>
          {t("mb.inc.all")}
        </button>
        {CORRIDORS.map((item) => (
          <button
            key={item}
            type="button"
            className={corridor === item ? styles.on : ""}
            onClick={() => onCorridorChange(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <p className={styles.note}>{t("mb.inc.note")}</p>
    </MemberCard>
  );
}
