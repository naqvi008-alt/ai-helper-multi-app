import type { SessionState, Workflow } from "../types.js";

/**
 * Client-side session manager.
 *
 * State lives in localStorage so it:
 *   - Survives Vercel cold starts (state is in the browser, not the server)
 *   - Syncs across tabs of the same origin via the browser's `storage` event
 *   - Has zero network latency for advance/back/end
 *
 * Same-origin requirement: in production all 4 apps live on
 * `multi-app-prototype.vercel.app/`, `/intake/`, `/risk/`, `/fulfillment/` —
 * one origin → shared localStorage. In local dev the apps run on different
 * ports, so cross-port handoff isn't synced (a known dev-only limitation).
 */

const KEY = "helper:session:v1";
const CHANGE_EVENT = "helper:session-changed";

export function readSession(): SessionState | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SessionState) : null;
  } catch {
    return null;
  }
}

function writeSession(s: SessionState | null): void {
  if (s) localStorage.setItem(KEY, JSON.stringify(s));
  else localStorage.removeItem(KEY);
  // Notify this tab. The `storage` event only fires in *other* tabs.
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribeToSession(
  callback: (s: SessionState | null) => void
): () => void {
  const onSelf = () => callback(readSession());
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY || e.key === null) callback(readSession());
  };
  window.addEventListener(CHANGE_EVENT, onSelf);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onSelf);
    window.removeEventListener("storage", onStorage);
  };
}

export function startSession(workflow: Workflow): SessionState {
  const s: SessionState = {
    sessionId: `s-${Date.now()}`,
    workflowId: workflow.id,
    stepIndex: 0,
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    currentApp: workflow.steps[0].appId,
    context: {},
    errors: [],
  };
  writeSession(s);
  return s;
}

export function advanceSession(
  workflow: Workflow
): { completed: true; session: SessionState } | { completed: false; session: SessionState } {
  const current = readSession();
  if (!current) throw new Error("No active session");

  if (current.stepIndex >= workflow.steps.length - 1) {
    const completed = { ...current, updatedAt: new Date().toISOString() };
    writeSession(null);
    return { completed: true, session: completed };
  }
  const next: SessionState = {
    ...current,
    stepIndex: current.stepIndex + 1,
    currentApp: workflow.steps[current.stepIndex + 1].appId,
    updatedAt: new Date().toISOString(),
  };
  writeSession(next);
  return { completed: false, session: next };
}

export function backSession(workflow: Workflow): SessionState {
  const current = readSession();
  if (!current) throw new Error("No active session");
  const idx = Math.max(0, current.stepIndex - 1);
  const next: SessionState = {
    ...current,
    stepIndex: idx,
    currentApp: workflow.steps[idx].appId,
    updatedAt: new Date().toISOString(),
  };
  writeSession(next);
  return next;
}

export function endSession(): void {
  writeSession(null);
}
