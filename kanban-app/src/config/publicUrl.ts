/** Resolve a file under Vite `public/` for both `npm run dev` and nested static builds. */
export function publicUrl(path: string): string {
  const normalized = path.replace(/^\/+/, "");
  return `${import.meta.env.BASE_URL}${normalized}`;
}
