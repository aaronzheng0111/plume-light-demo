import type { AudienceFilter, Persona } from "../types";

export const STUDENT_PERSONAS: readonly Persona[] = ["student_uk", "student_au"];

export const PARENT_PERSONAS: readonly Persona[] = ["parent_hk", "parent_victoria"];

const PERSONA_SET = new Set<string>([...STUDENT_PERSONAS, ...PARENT_PERSONAS]);

export function isPersona(value: string): value is Persona {
  return PERSONA_SET.has(value);
}

export function isStudentPersona(persona: Persona): boolean {
  return persona === "student_uk" || persona === "student_au";
}

export function isParentPersona(persona: Persona): boolean {
  return persona === "parent_hk" || persona === "parent_victoria";
}

export function matchesAudience(persona: Persona, filter: AudienceFilter): boolean {
  if (filter === "all") {
    return true;
  }
  if (filter === "students") {
    return isStudentPersona(persona);
  }
  if (filter === "parents") {
    return isParentPersona(persona);
  }
  return persona === filter;
}
