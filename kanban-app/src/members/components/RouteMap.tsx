import { publicUrl } from "../../config/publicUrl";
import { useI18n } from "../../i18n/useI18n";
import { personaKey } from "../labels";
import type { Corridor, MapView } from "../types";
import styles from "./RouteMap.module.css";

const HKG = { x: 816.4, y: 178.7 };
const CITIES = {
  "HKG-LHR": { x: 498.7, y: 85.1, code: "LHR" },
  "HKG-MEL": { x: 902.3, y: 371.2, code: "MEL" },
  "HKG-SYD": { x: 919.9, y: 359.2, code: "SYD" },
} as const;

const ARCS: Record<Corridor, string> = {
  "HKG-LHR": "M816.4,178.7 Q657.6,61.9 498.7,85.1",
  "HKG-MEL": "M816.4,178.7 Q830,300 902.3,371.2",
  "HKG-SYD": "M816.4,178.7 Q900,250 919.9,359.2",
};

function strokeWidth(count: number, widest: number): number {
  if (count <= 0 || widest <= 0) {
    return 1.4;
  }
  return 1.8 + (count / widest) * 7.2;
}

export function RouteMap({
  map,
  corridor,
  showScopeAll,
  onCorridorChange,
}: {
  map: MapView;
  corridor: Corridor | "all";
  showScopeAll: boolean;
  onCorridorChange: (corridor: Corridor | "all") => void;
}) {
  const { t } = useI18n();
  const widest = Math.max(...map.corridors.map((row) => row.activeMembers), 1);

  return (
    <section className={styles.card}>
      <div className={styles.head}>
        <h2>
          {t("mb.map.title")}
          {showScopeAll ? <span className={styles.badge}>{t("mb.scopeAll")}</span> : null}
        </h2>
        <p className={styles.total}>
          <b>{map.paidMembers}</b>
          <small>{t("mb.map.paidMembers")}</small>
        </p>
      </div>
      <svg className={styles.map} viewBox="0 0 1000 430" role="img" aria-label={t("mb.map.title")}>
        <image href={publicUrl("maps/world-outline.svg")} x="0" y="0" width="1000" height="430" />
        {map.corridors.map((row) => {
          const selected = corridor === "all" || corridor === row.corridor;
          return (
            <path
              key={row.corridor}
              d={ARCS[row.corridor]}
              fill="none"
              stroke={row.corridor === "HKG-LHR" ? "#02544f" : row.corridor === "HKG-MEL" ? "#1f6f68" : "#3d8f86"}
              strokeWidth={strokeWidth(row.activeMembers, widest)}
              strokeLinecap="round"
              opacity={selected ? 1 : 0.28}
              className={styles.arc}
            />
          );
        })}
        <circle cx={HKG.x} cy={HKG.y} r="5.5" fill="#02544f" />
        <text x={HKG.x - 10} y={HKG.y - 12} textAnchor="end" className={styles.city}>HKG</text>
        {map.corridors.map((row) => {
          const city = CITIES[row.corridor];
          const label = row.corridor === "HKG-LHR"
            ? { x: city.x - 8, y: city.y - 12, anchor: "end" as const }
            : row.corridor === "HKG-MEL"
              ? { x: city.x - 8, y: city.y + 18, anchor: "end" as const }
              : { x: city.x + 10, y: city.y - 8, anchor: "start" as const };
          return (
            <g key={city.code}>
              <circle cx={city.x} cy={city.y} r="4.5" fill="#043f39" />
              <text x={label.x} y={label.y} textAnchor={label.anchor} className={styles.city}>{city.code}</text>
            </g>
          );
        })}
      </svg>
      <div className={styles.routes}>
        {map.corridors.map((row) => {
          const studentLabel = row.studentPersona ? t(personaKey(row.studentPersona)) : t("mb.map.students");
          const parentLabel = row.parentPersona ? t(personaKey(row.parentPersona)) : t("mb.map.parents");
          return (
            <button
              key={row.corridor}
              type="button"
              className={`${styles.route} ${corridor === row.corridor ? styles.on : ""}`}
              onClick={() => onCorridorChange(corridor === row.corridor ? "all" : row.corridor)}
            >
              <em>{row.corridor}</em>
              <strong>{row.activeMembers}</strong>
              <span>{t("mb.map.inUse")}</span>
              <span className={styles.split}>{studentLabel} {row.students}</span>
              <span className={styles.split}>{parentLabel} {row.parents}</span>
              {row.corridor === "HKG-SYD" ? <span className={styles.note}>{t("mb.map.orderRoute")}</span> : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
