import { computed, ref } from "vue";

export interface CoverageRow { fundamental: string; count: number }

/**
 * The fundamentals named in the F3 problem framing. A stand-in until ReferencePhotoBinning
 * supplies its tags; the coverage endpoint will then report on that list instead.
 */
export const FUNDAMENTALS = ["perspective", "proportions", "anatomy", "lighting", "color", "composition"] as const;

/**
 * SAMPLE DATA, shown with a visible "Sample data" badge so the layout can be judged.
 * Nothing records practices yet: CoverageTracking needs ReferencePhotoBinning first.
 * Remove this, and load from the coverage endpoint in `load`, once that endpoint exists.
 */
const SAMPLE: CoverageRow[] = [
  { fundamental: "perspective", count: 2 },
  { fundamental: "proportions", count: 1 },
  { fundamental: "anatomy", count: 0 },
  { fundamental: "lighting", count: 4 },
  { fundamental: "color", count: 3 },
  { fundamental: "composition", count: 1 },
];

/** Least practiced first, then by name: the order CoverageTracking._coverage returns. */
const ordered = (rows: CoverageRow[]) => [...rows].sort((a, b) => a.count - b.count || a.fundamental.localeCompare(b.fundamental));

/** The signed-in artist's practice count for each fundamental. */
export function useCoverage() {
  const rows = ref<CoverageRow[]>([]);
  const sample = ref(false);
  const loading = ref(false);
  const error = ref("");

  async function load() {
    loading.value = true;
    error.value = "";
    try {
      rows.value = ordered(SAMPLE);
      sample.value = true;
    } catch {
      error.value = "Could not load your fundamentals.";
    } finally { loading.value = false; }
  }

  const max = computed(() => Math.max(1, ...rows.value.map(row => row.count)));
  /** The fundamentals tied for the lowest count, to suggest what to practice next. */
  const neglected = computed(() => {
    const lowest = rows.value[0]?.count;
    return lowest === undefined ? [] : rows.value.filter(row => row.count === lowest).map(row => row.fundamental);
  });

  return { rows, sample, loading, error, max, neglected, load };
}
