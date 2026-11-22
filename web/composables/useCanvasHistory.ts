import { computed, onBeforeUnmount, ref } from "vue";
import { api } from "../client.ts";
import { parseStroke, type Stroke } from "../../src/drawing/stroke.ts";

interface PendingStroke { key: string; change: string; timestamp: number }

/** Queue serialized immutable values; never change a payload while retrying its key. */
export function useCanvasHistory(onReconcile: (strokes: Stroke[]) => Promise<void>) {
  const pending = ref<PendingStroke[]>([]);
  const sequence = ref(0);
  const start = ref(0);
  const saved = computed(() => sequence.value - start.value);
  const submitting = ref(false);
  const submission = ref<{ key: string; sequence: number } | null>(null);
  const submissionPending = computed(() => submission.value !== null);
  const blocked = ref(false);
  const rejectedKey = ref<string | null>(null);
  const saving = ref(false);
  const loading = ref(true);
  const error = ref("");
  const history: Stroke[] = [];
  const keys = new Set<string>();
  let stopped = false;
  let reconciled = false;
  const unsaved = computed(() => pending.value.length > 0 || submissionPending.value);

  async function fetchHistory() {
    for (;;) {
      const result = await api.canvas.history({ after: sequence.value });
      if (stopped) return;
      if ("error" in result) throw new Error(result.error === "UNAUTHORIZED"
        ? "Your session ended. Sign in again in another tab, then retry here."
        : "Could not load your canvas. Check your connection and retry.");
      if (result.start !== start.value) {
        if (pending.value.length) {
          blocked.value = true;
          throw new Error("Another tab submitted this drawing. Your unsaved strokes remain in this tab; they have not been moved into the next timelapse.");
        }
        start.value = result.start;
        sequence.value = result.start;
        history.length = 0;
        keys.clear();
      }
      for (const update of result.updates) {
        const stroke = parseStroke(update.change);
        if (!stroke) throw new Error("This canvas uses an unsupported stroke format.");
        history.push(stroke);
        keys.add(update.key);
        sequence.value = update.sequence;
      }
      if (result.updates.length < 50) return;
    }
  }

  async function load() {
    loading.value = true;
    error.value = "";
    try {
      await fetchHistory();
      if (stopped) return false;
      await onReconcile(history);
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : "Could not restore your canvas. Retry to continue.";
      return false;
    } finally { loading.value = false; }
    return true;
  }

  async function flush() {
    if (saving.value || stopped || loading.value || submissionPending.value || blocked.value || rejectedKey.value) return;
    saving.value = true;
    error.value = "";
    try {
      while (pending.value.length && !stopped) {
        const next = pending.value[0]!;
        const result = await api.canvas.stroke({ ...next, sequence: sequence.value + 1 });
        if ("error" in result) {
          if (result.error === "INVALID_REQUEST") {
            rejectedKey.value = next.key;
            throw new Error("A stroke was rejected and cannot be saved. Discard that stroke to continue saving the remaining drawing.");
          }
          if (result.error === "CONFLICT") {
            await fetchHistory();
            pending.value = pending.value.filter((item) => !keys.has(item.key));
            reconciled = true;
            continue;
          }
          throw new Error(result.error === "UNAUTHORIZED"
            ? "Your session ended. Sign in again in another tab, then retry here."
            : "Strokes are waiting to save. Check your connection and retry.");
        }
        // Fetch if an acknowledgement reveals intervening writes from another tab.
        if (result.sequence !== sequence.value + 1) {
          await fetchHistory();
          reconciled = true;
        } else {
          sequence.value = result.sequence;
          history.push(parseStroke(next.change)!);
          keys.add(next.key);
        }
        pending.value.shift();
      }
      if (reconciled && !stopped) {
        await onReconcile(history);
        reconciled = false;
      }
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : "Could not save. Your strokes are still here; retry to save them.";
    } finally {
      saving.value = false;
      if (!error.value && pending.value.length && !stopped) queueMicrotask(() => void flush());
    }
  }

  function enqueue(stroke: Stroke, timestamp: number) {
    pending.value.push({ key: crypto.randomUUID(), change: JSON.stringify(stroke), timestamp });
    if (!error.value) void flush();
  }

  async function discardRejected() {
    if (!rejectedKey.value || saving.value || stopped) return;
    // Keep the rejected mark visible and pending until the artist chooses this.
    pending.value = pending.value.filter((item) => item.key !== rejectedKey.value);
    rejectedKey.value = null;
    error.value = "";
    saving.value = true;
    try {
      await onReconcile(history);
    } catch {
      reconciled = true;
      error.value = "Could not redraw the remaining strokes. Retry saving.";
    } finally { saving.value = false; }
    if (!error.value) await flush();
  }

  async function submit(): Promise<number | null> {
    if (submitting.value || saving.value || loading.value || pending.value.length || blocked.value || (!saved.value && !submission.value)) return null;
    submitting.value = true;
    error.value = "";
    submission.value ??= { key: crypto.randomUUID(), sequence: sequence.value + 1 };
    try {
      const result = await api.canvas.submit(submission.value);
      if ("error" in result) {
        if (result.error === "CONFLICT") {
          submission.value = null;
          await load();
          throw new Error("The drawing changed in another tab. Review the current canvas before submitting again.");
        }
        if (result.error === "INVALID_REQUEST") submission.value = null;
        throw new Error(result.error === "UNAUTHORIZED"
          ? "Your session ended. Sign in again in another tab, then retry submission."
          : "Could not confirm submission. Your drawing is still here. Retry submission.");
      }
      start.value = result.sequence;
      sequence.value = result.sequence;
      history.length = 0;
      keys.clear();
      await onReconcile([]);
      submission.value = null;
      return result.index;
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : "Could not confirm submission. Retry submission.";
      return null;
    } finally { submitting.value = false; }
  }

  const online = () => { if (pending.value.length) void flush(); };
  const beforeUnload = (event: BeforeUnloadEvent) => {
    if (!unsaved.value) return;
    event.preventDefault();
    event.returnValue = "";
  };
  window.addEventListener("online", online);
  window.addEventListener("beforeunload", beforeUnload);
  onBeforeUnmount(() => {
    stopped = true;
    window.removeEventListener("online", online);
    window.removeEventListener("beforeunload", beforeUnload);
  });

  return { load, flush, enqueue, submit, discardRejected, rejectedKey, pending, saved, saving, loading, error, unsaved, submitting, submissionPending, blocked };
}
