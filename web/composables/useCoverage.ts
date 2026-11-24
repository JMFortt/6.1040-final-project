import { computed, ref } from "vue";
import { api } from "../client.ts";

export interface CoverageRow { fundamental: string; count: number }

/** Least practiced first, then by name: the order CoverageTracking._coverage returns. */
const ordered = (rows: CoverageRow[]) => [...rows].sort((a, b) => a.count - b.count || a.fundamental.localeCompare(b.fundamental));

/** The signed-in artist's count of saved practices for each fundamental. */
export function useCoverage() {
  const rows = ref<CoverageRow[]>([]);
  const loading = ref(false);
  const error = ref("");

  async function load() {
    loading.value = true;
    error.value = "";
    try {
      const result = await api.coverage.current();
      if ("error" in result) throw new Error(result.error === "UNAUTHORIZED" ? "Your session ended. Sign in again." : "Could not load your fundamentals.");
      rows.value = ordered(result.coverage.rows);
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : "Could not load your fundamentals.";
    } finally { loading.value = false; }
  }

  const max = computed(() => Math.max(1, ...rows.value.map(row => row.count)));
  /** The fundamentals tied for the lowest count, to suggest what to practice next. */
  const neglected = computed(() => {
    const lowest = rows.value[0]?.count;
    return lowest === undefined ? [] : rows.value.filter(row => row.count === lowest).map(row => row.fundamental);
  });
  const practicedAny = computed(() => rows.value.some(row => row.count > 0));

  return { rows, loading, error, max, neglected, practicedAny, load };
}
