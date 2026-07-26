// lib/tools/aria-live.ts
// Throttled aria-live announcer for ResultPanel (SPEC 6.1/8.9). Pure logic,
// no React/DOM — result-panel.tsx wires `setText` to a state setter that
// backs an `aria-live="polite"` region. Kept in its own file (allowed by the
// PR 2.1 brief: "eigene Datei ODER in result-panel.tsx exportiert") so it can
// be unit-tested without pulling in the whole ResultPanel component tree.

/**
 * Returns a function that forwards at most one announcement per intervalMs
 * (trailing — the LAST sentence wins), and never announces during drag.
 */
export function createLiveAnnouncer(
  setText: (s: string) => void,
  intervalMs = 1000,
  schedule: (fn: () => void, ms: number) => unknown = (fn, ms) => setTimeout(fn, ms),
): { announce: (s: string) => void; setDragging: (d: boolean) => void } {
  let dragging = false;
  let lastFiredAt = -Infinity;
  let pendingTimer: unknown = null;
  let pendingText: string | null = null;

  function fire(text: string): void {
    lastFiredAt = Date.now();
    setText(text);
  }

  function announce(sentence: string): void {
    if (dragging) {
      // Fully suppressed while dragging — no setText call, no timer — but the
      // last-seen sentence is remembered so release can announce the settled
      // value (see setDragging).
      pendingText = sentence;
      return;
    }

    const elapsed = Date.now() - lastFiredAt;
    if (elapsed >= intervalMs) {
      // Leading edge — nothing pending, interval has elapsed: announce immediately.
      pendingText = null;
      fire(sentence);
      return;
    }

    // Within the interval — remember as trailing candidate, schedule (once) for
    // the remainder of the interval. The LAST sentence recorded before the
    // timer fires wins.
    pendingText = sentence;
    if (pendingTimer !== null) return;
    const remaining = Math.max(0, intervalMs - elapsed);
    pendingTimer = schedule(() => {
      pendingTimer = null;
      if (dragging) {
        // Dragging started after scheduling — suppress; release will announce.
        return;
      }
      if (pendingText !== null) {
        const text = pendingText;
        pendingText = null;
        fire(text);
      }
    }, remaining);
  }

  function setDragging(d: boolean): void {
    const wasDragging = dragging;
    dragging = d;
    if (wasDragging && !d && pendingText !== null) {
      // Release — announce the last known state immediately.
      const text = pendingText;
      pendingText = null;
      fire(text);
    }
  }

  return { announce, setDragging };
}
