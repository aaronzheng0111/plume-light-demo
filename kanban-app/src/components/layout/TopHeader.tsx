import { publicUrl } from "../../config/publicUrl";
import { useI18n } from "../../i18n/useI18n";
import type { Locale } from "../../i18n/dictionary";
import { SyncIndicator } from "../common/SyncIndicator";
import styles from "./TopHeader.module.css";

export function TopHeader({ live }: { live: boolean }) {
  const { t, locale, setLocale } = useI18n();
  return (
    <header className={styles.top}>
      <img
        className={styles.logo}
        src={publicUrl("brand/plume_light_logo_horizontal_reversed.svg")}
        alt="Plume Light"
      />
      <span className={styles.staff}>{t("kb.staffOnly")}</span>
      <SyncIndicator live={live} />
      <span className={styles.spacer} />
      <img className={styles.brush} src={publicUrl("brand/cathay-brushwing-white.png")} alt="" />
      {(["zh-Hant", "en"] as Locale[]).map((item) => (
        <button
          key={item}
          type="button"
          className={`${styles.lang} ${locale === item ? styles.on : ""}`}
          onClick={() => setLocale(item)}
        >
          {item === "zh-Hant" ? t("kb.lang.zh") : t("kb.lang.en")}
        </button>
      ))}
    </header>
  );
}
