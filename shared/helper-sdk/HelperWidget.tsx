import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { api } from "./api";
import {
  advanceSession,
  backSession,
  endSession,
  readSession,
  startSession,
  subscribeToSession,
} from "./session";
import StepPreview from "./StepPreview";
import type {
  AppId,
  AskResponse,
  BusinessRule,
  ErrorReport,
  SessionState,
  Workflow,
} from "../types";
import "./helper.css";

type Msg =
  | { kind: "bot"; text: string }
  | { kind: "user"; text: string }
  | { kind: "match"; wf: Workflow; rules: BusinessRule[] };

type Props = {
  appId: AppId;
  appName: string;
};

/**
 * Panel expand/shrink preference. Persisted in localStorage so it survives
 * reloads and syncs across same-origin tabs the same way the session does.
 */
const PANEL_EXPANDED_KEY = "helper:panel-expanded:v1";
const PANEL_EXPANDED_EVENT = "helper:panel-expanded-changed";

function readExpanded(): boolean {
  try {
    return localStorage.getItem(PANEL_EXPANDED_KEY) === "1";
  } catch {
    return false;
  }
}
function writeExpanded(v: boolean) {
  try {
    localStorage.setItem(PANEL_EXPANDED_KEY, v ? "1" : "0");
    window.dispatchEvent(new Event(PANEL_EXPANDED_EVENT));
  } catch {
    /* ignore */
  }
}

const SUGGESTIONS_BY_APP: Record<AppId, string[]> = {
  "member-portal": [
    "How do I apply for a loan?",
    "What documents do I need?",
    "Why was my application returned?",
  ],
  "intake-app": [
    "How do I review an application?",
    "Address proof too old — what do I do?",
    "Income docs insufficient — next steps?",
  ],
  "risk-app": [
    "How do I underwrite a loan?",
    "DTI is too high — options?",
    "Credit score below floor — what now?",
  ],
  "fulfillment-app": [
    "How do I book and disburse?",
    "Bank account not verified — how to fix?",
    "Member hasn't e-signed yet",
  ],
};

export default function HelperWidget({ appId, appName }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      kind: "bot",
      text: `Hi! I'm the cross-app helper for ${appName}. I can guide you through tasks even when they span multiple apps.`,
    },
  ]);
  const [input, setInput] = useState("");

  // Session state lives in localStorage; we mirror it in component state and
  // re-render whenever localStorage changes (this tab OR a sibling tab).
  const [session, setSession] = useState<SessionState | null>(() => readSession());
  const [activeWorkflow, setActiveWorkflow] = useState<Workflow | null>(null);

  const [errorBadge, setErrorBadge] = useState<{
    err: ErrorReport;
    rect: { top: number; left: number; width: number; height: number } | null;
  } | null>(null);

  // Panel size preference (persisted + cross-tab synced).
  const [expanded, setExpanded] = useState<boolean>(() => readExpanded());

  const bodyRef = useRef<HTMLDivElement>(null);

  // Sync the expanded preference across tabs (and from this tab's own writes).
  useEffect(() => {
    const refresh = () => setExpanded(readExpanded());
    const onStorage = (e: StorageEvent) => {
      if (e.key === PANEL_EXPANDED_KEY) refresh();
    };
    window.addEventListener(PANEL_EXPANDED_EVENT, refresh);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(PANEL_EXPANDED_EVENT, refresh);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  function toggleExpanded() {
    writeExpanded(!expanded);
  }

  // Auto-scroll chat
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  // Subscribe to session changes — both this tab's writes and cross-tab events.
  useEffect(() => subscribeToSession(setSession), []);

  // When the active workflow id changes, fetch its definition from the hub.
  useEffect(() => {
    if (!session) {
      setActiveWorkflow(null);
      return;
    }
    let cancelled = false;
    api
      .getWorkflow(session.workflowId)
      .then((wf) => {
        if (!cancelled) setActiveWorkflow(wf);
      })
      .catch(() => {
        // Hub unreachable: leave activeWorkflow null. Helper will look idle
        // until the hub recovers or the user starts a new flow.
      });
    return () => {
      cancelled = true;
    };
  }, [session?.workflowId]);

  // Listen for error events fired by the host app
  useEffect(() => {
    function onError(e: CustomEvent<ErrorReport>) {
      setErrorBadge({ err: e.detail, rect: null });
    }
    function onClear() {
      setErrorBadge(null);
    }
    window.addEventListener("helper:error", onError);
    window.addEventListener("helper:clear-error", onClear);
    return () => {
      window.removeEventListener("helper:error", onError);
      window.removeEventListener("helper:clear-error", onClear);
    };
  }, []);

  // Position the error badge near its anchor element
  useLayoutEffect(() => {
    if (!errorBadge?.err.anchorSelector) return;
    function recompute() {
      const el = document.querySelector(
        errorBadge!.err.anchorSelector!
      ) as HTMLElement | null;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setErrorBadge((prev) =>
        prev
          ? { ...prev, rect: { top: r.top, left: r.left, width: r.width, height: r.height } }
          : prev
      );
    }
    recompute();
    const id = window.setInterval(recompute, 250);
    window.addEventListener("resize", recompute);
    window.addEventListener("scroll", recompute, true);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("resize", recompute);
      window.removeEventListener("scroll", recompute, true);
    };
  }, [errorBadge?.err.anchorSelector]);

  async function startWorkflow(workflowId: string) {
    const wf = await api.getWorkflow(workflowId);
    setActiveWorkflow(wf);
    startSession(wf); // writes to localStorage; subscription updates `session`
    setErrorBadge(null);
    setOpen(true); // keep / bring the panel open so the new step card is visible
    // Auto-scroll the chat body to the top so the user immediately sees the new step
    requestAnimationFrame(() => bodyRef.current?.scrollTo({ top: 0 }));
  }

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((m) => [...m, { kind: "user", text: trimmed }]);
    setInput("");
    let resp: AskResponse;
    try {
      resp = await api.ask(trimmed, appId);
    } catch {
      setMessages((m) => [
        ...m,
        { kind: "bot", text: "Helper hub is unreachable. Try again in a moment." },
      ]);
      return;
    }
    setMessages((m) => [
      ...m,
      { kind: "bot", text: resp.answer },
      ...(resp.workflow ? [{ kind: "match", wf: resp.workflow, rules: resp.rules } as Msg] : []),
    ]);
  }

  function advance() {
    if (!activeWorkflow) return;
    const result = advanceSession(activeWorkflow);
    if (result.completed) {
      setMessages((m) => [...m, { kind: "bot", text: "Workflow complete. Nice work." }]);
    }
  }

  function back() {
    if (!activeWorkflow) return;
    backSession(activeWorkflow);
  }

  function end() {
    endSession();
  }

  const fabBadge = useMemo(() => {
    if (errorBadge) return "!";
    if (session && session.currentApp !== appId) return "→";
    return null;
  }, [errorBadge, session, appId]);

  const currentStep =
    session && activeWorkflow ? activeWorkflow.steps[session.stepIndex] : null;
  const isMyStep = currentStep?.appId === appId;

  return (
    <>
      {/* Error badge anchored near the offending field */}
      {errorBadge && errorBadge.rect && (
        <button
          className="helper-error-badge"
          style={{
            top: errorBadge.rect.top + errorBadge.rect.height + 6,
            left: Math.max(
              8,
              errorBadge.rect.left + errorBadge.rect.width - 240
            ),
          }}
          onClick={() => startWorkflow(errorBadge.err.suggestedWorkflowId)}
          title={errorBadge.err.message}
        >
          <span className="icon">!</span>
          Need help fixing this?
        </button>
      )}

      <button
        className="helper-fab"
        onClick={() => setOpen((o) => !o)}
        aria-label="Open AI helper"
      >
        {open ? "×" : "✦"}
        {fabBadge && <span className="helper-fab-badge">{fabBadge}</span>}
      </button>

      {open && (
        <div className={`helper-panel ${expanded ? "is-expanded" : ""}`} role="dialog">
          <div className="helper-header">
            <div className="helper-avatar">✦</div>
            <div>
              <p className="helper-title">Cross-app Helper</p>
              <p className="helper-sub">{appName} · {appId}</p>
            </div>
            <button
              className="helper-expand"
              onClick={toggleExpanded}
              aria-label={expanded ? "Shrink" : "Expand"}
              title={expanded ? "Shrink" : "Expand"}
            >
              {expanded ? "⤡" : "⤢"}
            </button>
            <button className="helper-close" onClick={() => setOpen(false)} aria-label="Close">
              ×
            </button>
          </div>

          <div className="helper-body" ref={bodyRef}>
            {/* Inline "new error detected" banner — surfaces the recovery option
                inside the panel even when the floating badge is obscured
                (e.g. anchored to a field behind the panel). */}
            {errorBadge && (
              <div className="helper-error-banner">
                <div className="helper-error-banner-row">
                  <span className="helper-error-banner-icon">!</span>
                  <div className="helper-error-banner-text">
                    <strong>Issue detected</strong>
                    <div>{errorBadge.err.message}</div>
                  </div>
                </div>
                <div className="helper-error-banner-actions">
                  <button
                    className="btn btn-ghost"
                    onClick={() => setErrorBadge(null)}
                  >
                    Dismiss
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => startWorkflow(errorBadge.err.suggestedWorkflowId)}
                  >
                    {session ? "Switch to recovery →" : "Fix this →"}
                  </button>
                </div>
              </div>
            )}

            {/* Active step card */}
            {session && activeWorkflow && currentStep && (
              <div className="helper-step">
                <div className="helper-step-meta">
                  Step {session.stepIndex + 1} of {activeWorkflow.steps.length} ·{" "}
                  {activeWorkflow.title}
                </div>
                <div className="helper-progress">
                  <div
                    className="helper-progress-bar"
                    style={{
                      width: `${
                        ((session.stepIndex + 1) / activeWorkflow.steps.length) * 100
                      }%`,
                    }}
                  />
                </div>

                {!isMyStep && (
                  <div className="helper-hand-off">
                    This step happens in{" "}
                    <strong>{currentStep.appId}</strong>. Open that app to continue, or
                    skip if you're not the right person.
                  </div>
                )}

                <h4>{currentStep.title}</h4>
                <p>{currentStep.instruction}</p>

                {currentStep.preview && (
                  <StepPreview appId={currentStep.appId} preview={currentStep.preview} />
                )}

                {currentStep.validates && currentStep.validates.length > 0 && (
                  <div className="meta">
                    {currentStep.validates.map((r) => (
                      <span key={r} className="tag">
                        Rule {r}
                      </span>
                    ))}
                  </div>
                )}

                <div className="helper-step-actions">
                  <button className="btn btn-ghost" onClick={end}>
                    Exit
                  </button>
                  <div className="spacer" />
                  {session.stepIndex > 0 && (
                    <button className="btn" onClick={back}>
                      Back
                    </button>
                  )}
                  {currentStep.navigateUrl && !isMyStep ? (
                    <a
                      className="btn btn-primary"
                      href={currentStep.navigateUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open {currentStep.appId} ↗
                    </a>
                  ) : (
                    <button className="btn btn-primary" onClick={advance}>
                      {session.stepIndex === activeWorkflow.steps.length - 1
                        ? "Finish"
                        : "Next"}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Chat messages */}
            {!session &&
              messages.map((m, i) =>
                m.kind === "match" ? (
                  <div key={i} className="helper-card">
                    <h4>{m.wf.title}</h4>
                    <p>{m.wf.description}</p>
                    <div className="meta">
                      {m.wf.category === "recovery" && (
                        <span className="tag tag-recovery">Recovery</span>
                      )}
                      {m.wf.apps.map((a) => (
                        <span key={a} className={`tag ${a === appId ? "tag-cur" : "tag-app"}`}>
                          {a}
                        </span>
                      ))}
                    </div>
                    <button className="btn btn-primary" onClick={() => startWorkflow(m.wf.id)}>
                      Start walkthrough →
                    </button>
                  </div>
                ) : (
                  <div key={i} className={`helper-msg ${m.kind === "user" ? "user" : ""}`}>
                    {m.text}
                  </div>
                )
              )}

            {!session && (
              <div className="helper-suggestions">
                {SUGGESTIONS_BY_APP[appId].map((s) => (
                  <button key={s} className="helper-suggestion" onClick={() => send(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {!session && (
            <form
              className="helper-input"
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
            >
              <input
                autoFocus
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything…"
              />
              <button type="submit" className="btn btn-primary">
                Send
              </button>
            </form>
          )}
        </div>
      )}
    </>
  );
}
