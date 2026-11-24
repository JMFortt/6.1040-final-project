/**
 * The fundamentals Redraw reports coverage for: the same five the Draw picker and the
 * References page offer. Coverage lists every one of them, including those never practiced.
 */
export const FUNDAMENTALS = ["anatomy", "color", "form", "lighting", "perspective"] as const;

/** The fixed list of fundamentals that coverage reports on. */
export function coverageFundamentals(): string[] {
  return [...FUNDAMENTALS];
}

/** The set holding only the fundamental an artist chose for one practice. */
export function fundamentalSet({ fundamental }: { fundamental: string }): string[] {
  return [fundamental];
}
