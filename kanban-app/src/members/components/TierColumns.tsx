import { useI18n } from "../../i18n/useI18n";
import { formatRate } from "../format";
import type { TierView } from "../types";
import { MemberCard } from "./MemberCard";
import styles from "./TierColumns.module.css";

export function TierColumns({ tiers }: { tiers: TierView }) {
  const { t } = useI18n();
  const tallest = Math.max(...tiers.tiers.map((column) => column.count), 1);

  return (
    <MemberCard index={7} questionKey="mb.q7" showScopeAll={false}>
      <div className={styles.tiers} style={{ gridTemplateColumns: `repeat(${tiers.tiers.length}, 1fr)` }}>
        {tiers.tiers.map((column) => {
          const usage = column.usage.rate;
          const showFill = usage != null && usage > 0;
          return (
            <div key={column.tier} className={styles.tier}>
              <strong>{column.count}</strong>
              <div className={styles.col} style={{ height: `${Math.max((column.count / tallest) * 160, column.count === 0 ? 0 : 8)}px` }}>
                {showFill ? (
                  <i className={styles.fill} style={{ height: `${usage * 100}%` }} />
                ) : null}
              </div>
              <em>{column.tier}</em>
              <span>
                {t("mb.tier.usage")} {usage == null ? t("mb.noSample") : formatRate(usage)}
              </span>
            </div>
          );
        })}
      </div>
    </MemberCard>
  );
}
