import { formatAsOf } from "../../format/display";
import { useI18n } from "../../i18n/useI18n";
import { BOOKMARKS } from "../config/bookmarks";
import { formatMonthDay } from "../format";
import { audienceKey, bookmarkHoverKey, bookmarkNameKey, bookmarkShortKey } from "../labels";
import type { AudienceFilter, BookmarkId } from "../types";
import { HoverLabel } from "./HoverLabel";
import styles from "./MemberControlBar.module.css";

const PRIMARY: AudienceFilter[] = ["all", "students", "parents"];
const STUDENT_DETAIL: AudienceFilter[] = ["students", "student_uk", "student_au"];
const PARENT_DETAIL: AudienceFilter[] = ["parents", "parent_hk", "parent_victoria"];

function primarySelected(filter: AudienceFilter, audience: AudienceFilter): boolean {
  if (filter === "students") {
    return STUDENT_DETAIL.includes(audience);
  }
  if (filter === "parents") {
    return PARENT_DETAIL.includes(audience);
  }
  return audience === "all";
}

export function MemberControlBar({
  bookmarkId,
  at,
  audience,
  onBookmarkChange,
  onAudienceChange,
}: {
  bookmarkId: BookmarkId;
  at: string;
  audience: AudienceFilter;
  onBookmarkChange: (bookmarkId: BookmarkId) => void;
  onAudienceChange: (audience: AudienceFilter) => void;
}) {
  const { t } = useI18n();
  const showStudents =
    audience === "students" || audience === "student_uk" || audience === "student_au";
  const showParents =
    audience === "parents" || audience === "parent_hk" || audience === "parent_victoria";
  const detail = showStudents ? STUDENT_DETAIL : showParents ? PARENT_DETAIL : [];

  return (
    <div className={styles.bar}>
      <div className={styles.clock}>
        <strong>{formatAsOf(at)}</strong>
        <em>{t(bookmarkHoverKey(bookmarkId))}</em>
      </div>
      <div className={styles.bookmarks}>
        {BOOKMARKS.map((bookmark) => (
          <HoverLabel
            key={bookmark.id}
            className={`${styles.mark} ${bookmark.id === bookmarkId ? styles.on : ""}`}
            label={t(bookmarkShortKey(bookmark.id))}
            tip={t(bookmarkHoverKey(bookmark.id))}
            onSelect={() => onBookmarkChange(bookmark.id)}
          >
            <b>{t(bookmarkNameKey(bookmark.id))}</b>
            <small>{formatMonthDay(bookmark.at)}</small>
          </HoverLabel>
        ))}
      </div>
      <div className={styles.filters}>
        {PRIMARY.map((filter) => (
          <button
            key={filter}
            type="button"
            className={primarySelected(filter, audience) ? styles.on : ""}
            onClick={() => onAudienceChange(filter)}
          >
            {t(audienceKey(filter))}
          </button>
        ))}
      </div>
      {detail.length > 0 ? (
        <div className={styles.detail}>
          {detail.map((filter) => (
            <button
              key={filter}
              type="button"
              className={audience === filter ? styles.on : ""}
              onClick={() => onAudienceChange(filter)}
            >
              {t(audienceKey(filter))}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
