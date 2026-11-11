import type { TranslationKey } from "../i18n/dictionary";
import type { AudienceFilter, BookmarkId, FamilyLinkStatus, Persona } from "./types";

export function bookmarkNameKey(id: BookmarkId): TranslationKey {
  switch (id) {
    case "A":
      return "mb.bm.A.name";
    case "M":
      return "mb.bm.M.name";
    case "B":
      return "mb.bm.B.name";
    case "C":
      return "mb.bm.C.name";
    case "D":
      return "mb.bm.D.name";
    case "P":
      return "mb.bm.P.name";
    case "E":
      return "mb.bm.E.name";
    case "S":
      return "mb.bm.S.name";
    case "F":
      return "mb.bm.F.name";
  }
}

export function bookmarkShortKey(id: BookmarkId): TranslationKey {
  switch (id) {
    case "A":
      return "mb.bm.A.short";
    case "M":
      return "mb.bm.M.short";
    case "B":
      return "mb.bm.B.short";
    case "C":
      return "mb.bm.C.short";
    case "D":
      return "mb.bm.D.short";
    case "P":
      return "mb.bm.P.short";
    case "E":
      return "mb.bm.E.short";
    case "S":
      return "mb.bm.S.short";
    case "F":
      return "mb.bm.F.short";
  }
}

export function bookmarkHoverKey(id: BookmarkId): TranslationKey {
  switch (id) {
    case "A":
      return "mb.bm.A.hover";
    case "M":
      return "mb.bm.M.hover";
    case "B":
      return "mb.bm.B.hover";
    case "C":
      return "mb.bm.C.hover";
    case "D":
      return "mb.bm.D.hover";
    case "P":
      return "mb.bm.P.hover";
    case "E":
      return "mb.bm.E.hover";
    case "S":
      return "mb.bm.S.hover";
    case "F":
      return "mb.bm.F.hover";
  }
}

export function audienceKey(filter: AudienceFilter): TranslationKey {
  switch (filter) {
    case "all":
      return "mb.audience.all";
    case "students":
      return "mb.audience.students";
    case "parents":
      return "mb.audience.parents";
    case "student_uk":
      return "mb.audience.student_uk";
    case "student_au":
      return "mb.audience.student_au";
    case "parent_hk":
      return "mb.audience.parent_hk";
    case "parent_victoria":
      return "mb.audience.parent_victoria";
  }
}

export function personaKey(persona: Persona): TranslationKey {
  return audienceKey(persona);
}

export function familyStatusKey(status: FamilyLinkStatus): TranslationKey {
  switch (status) {
    case "cancelled":
      return "mb.fam.cancelled";
    case "declined":
      return "mb.fam.declined";
    case "revoked":
      return "mb.fam.revoked";
    case "authorized":
      return "mb.fam.authorized";
    case "linked_unauthorized":
      return "mb.fam.linked";
    case "pending":
      return "mb.fam.pending";
  }
}
