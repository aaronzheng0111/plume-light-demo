import { useI18n } from "../../i18n/useI18n";
import { InfoPopover } from "./InfoPopover";
import styles from "./SyncIndicator.module.css";

export function SyncIndicator() {
  const { t } = useI18n();
  return (
    <span className={styles.sync}>
      <i className={styles.pulse} />
      {t("kb.sync.json")}
      <InfoPopover label={t("kb.sync.hint")}>{t("kb.sync.hint")}</InfoPopover>
    </span>
  );
}
