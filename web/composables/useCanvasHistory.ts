import { computed, onBeforeUnmount, ref } from "vue";
import { api } from "../client.ts";
import { parseStroke, type Stroke } from "../../src/drawing/stroke.ts";

interface PendingStroke { key: string; change: string; timestamp: number }

/** Queue serialized immutable values; never change a payload while retrying its key. */
export function useCanvasHistory(onReconcile: (strokes: Stroke[], mode?: "replace" | "undo" | "redo" | "sync") => Promise<void>) {
  const pending = ref<PendingStroke[]>([]);
  const sequence = ref(0);
  const start = ref(0);
  const drawn = ref(0);
  const redoCount = ref(0);
  const saved = computed(() => drawn.value > 0);
  const canUndo = computed(() => drawn.value > 0 || pending.value.length > 0);
  const canRedo = computed(() => redoCount.value > 0);
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
  let revising = false;
  const unsaved = computed(() => pending.value.length > 0 || submissionPending.value);
  const noteDrawn = () => { drawn.value = history.length; };

  async function fetchHistory() {
    let after = start.value;
    let rebuilding = true;
    for (;;) {
      const result = await api.canvas.history({ after });
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
        after = result.start;
        rebuilding = true;
        continue;
      }
      if (rebuilding) {
        history.length = 0;
        keys.clear();
        rebuilding = false;
      }
      redoCount.value = result.redo;
      for (const update of result.updates) {
        if (keys.has(update.key)) continue;
        const stroke = parseStroke(update.change);
        if (!stroke) throw new Error("This canvas uses an unsupported stroke format.");
        history.push(stroke);
        keys.add(update.key);
      }
      if (result.updates.length < 50) {
        sequence.value = result.tip;
        noteDrawn();
        return;
      }
      const last = result.updates.at(-1);
      if (!last || last.sequence <= after) {
        sequence.value = result.tip;
        noteDrawn();
        return;
      }
      after = last.sequence;
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
          noteDrawn();
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
    redoCount.value = 0;
    if (!error.value) void flush();
  }

  async function settle() {
    if (pending.value.length) await flush();
    while (saving.value) await new Promise((resolve) => queueMicrotask(resolve));
  }

  async function revise(kind: "undo" | "redo") {
    if (revising || loading.value || blocked.value || rejectedKey.value || submissionPending.value || submitting.value || stopped) return false;
    revising = true;
    try {
      await settle();
      if (stopped || pending.value.length || saving.value || error.value) return false;
      saving.value = true;
      error.value = "";
      const request = { key: crypto.randomUUID(), sequence: sequence.value + 1, timestamp: Date.now() };
      const failed = async (result: { error: string } | { sequence: number }, label: string) => {
        if (!("error" in result) || result.error === "CONFLICT" || result.error === "INVALID_REQUEST") {
          await fetchHistory();
          if (!stopped) await onReconcile(history, "sync");
          return true;
        }
        throw new Error(result.error === "UNAUTHORIZED"
          ? "Your session ended. Sign in again in another tab, then retry here."
          : `Could not ${label}. Retry.`);
      };
      if (kind === "undo") {
        const result = await api.canvas.undo(request);
        if ("error" in result || result.sequence !== request.sequence) {
          if (await failed(result, "undo")) return false;
        } else {
          history.pop();
          keys.delete(result.removed);
          redoCount.value += 1;
          sequence.value = result.sequence;
          noteDrawn();
          await onReconcile(history, "undo");
          return true;
        }
      } else {
        const result = await api.canvas.redo(request);
        if ("error" in result || result.sequence !== request.sequence) {
          if (await failed(result, "redo")) return false;
        } else {
          const stroke = parseStroke(result.change);
          if (!stroke) throw new Error("This canvas uses an unsupported stroke format.");
          history.push(stroke);
          keys.add(result.key);
          redoCount.value = Math.max(0, redoCount.value - 1);
          sequence.value = result.sequence;
          noteDrawn();
          await onReconcile(history, "redo");
          return true;
        }
      }
      return false;
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : "Could not update the drawing. Retry.";
      return false;
    } finally {
      revising = false;
      saving.value = false;
      if (!error.value && pending.value.length && !stopped) queueMicrotask(() => void flush());
    }
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
      redoCount.value = 0;
      noteDrawn();
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

  return {
    load, flush, enqueue, submit, discardRejected, undo: () => revise("undo"), redo: () => revise("redo"),
    rejectedKey, pending, saved, canUndo, canRedo, saving, loading, error, unsaved, submitting, submissionPending, blocked,
  };
}
