import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { api } from "./api";
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

  const [session, setSession] = useState<SessionState | null>(null);
  const [activeWorkflow, setActiveWorkflow] = useState<Workflow | null>(null);

  const [errorBadge, setErrorBadge] = useState<{
    err: ErrorReport;
    rect: { top: number; left: number; width: number; height: number } | null;
  } | null>(null);

  const [highlightRect, setHighlightRect] = useState<
    { top: number; left: number; width: number; height: number } | null
  >(null);

  const bodyRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  // Poll the hub for the current session so cross-app handoffs show up automatically
  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const s = await api.getSession();
        if (cancelled) return;
        setSession(s);
        if (s) {
          const wf = await api.getWorkflow(s.workflowId);
          if (!cancelled) setActiveWorkflow(wf);
        } else {
          setActiveWorkflow(null);
        }
      } catch {
        /* hub probably down — ignore */
      }
    }
    poll();
    const id = window.setInterval(poll, 1200);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  // Listen for error events from the host app
  useEffect(() => {
    function onError(e: CustomEvent<ErrorReport>) {
      setErrorBadge({ err: e.detail, rect: null });
      api.reportError(e.detail).catch(() => {});
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

  // Highlight the target element when a step is active in THIS app and has a selector
  useLayoutEffect(() => {
    if (!session || !activeWorkflow) {
      setHighlightRect(null);
      return;
    }
    const step = activeWorkflow.steps[session.stepIndex];
    if (!step || step.appId !== appId || !step.selector) {
      setHighlightRect(null);
      return;
    }
    function recompute() {
      const el = document.querySelector(step.selector!) as HTMLElement | null;
      if (!el) {
        setHighlightRect(null);
        return;
      }
      const r = el.getBoundingClientRect();
      setHighlightRect({ top: r.top, left: r.left, width: r.width, height: r.height });
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
  }, [session, activeWorkflow, appId]);

  async function startWorkflow(workflowId: string) {
    const wf = await api.getWorkflow(workflowId);
    setActiveWorkflow(wf);
    const s = await api.startSession(workflowId);
    setSession(s);
    setOpen(true);
    setErrorBadge(null);
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
        { kind: "bot", text: "Helper hub is unreachable. Make sure the hub is running on :4000." },
      ]);
      return;
    }
    setMessages((m) => [
      ...m,
      { kind: "bot", text: resp.answer },
      ...(resp.workflow ? [{ kind: "match", wf: resp.workflow, rules: resp.rules } as Msg] : []),
    ]);
  }

  async function advance() {
    const next = await api.advance();
    if ("completed" in next && next.completed) {
      setSession(null);
      setActiveWorkflow(null);
      setMessages((m) => [
        ...m,
        { kind: "bot", text: "Workflow complete. Nice work." },
      ]);
    } else {
      setSession(next as SessionState);
    }
  }

  async function back() {
    const s = await api.back();
    setSession(s);
  }

  async function endSession() {
    await api.end();
    setSession(null);
    setActiveWorkflow(null);
  }

  const fabBadge = useMemo(() => {
    if (errorBadge) return "!";
    if (session && activeWorkflow && session.currentApp === appId) return null;
    if (session) return "→";
    return null;
  }, [errorBadge, session, activeWorkflow, appId]);

  const currentStep =
    session && activeWorkflow ? activeWorkflow.steps[session.stepIndex] : null;
  const isMyStep = currentStep?.appId === appId;

  return (
    <>
      {/* Highlight box for the active step's target (only if step belongs to this app) */}
      {highlightRect && (
        <div
          className="tour-highlight"
          style={{
            top: highlightRect.top - 4,
            left: highlightRect.left - 4,
            width: highlightRect.width + 8,
            height: highlightRect.height + 8,
          }}
        />
      )}

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
        <div className="helper-panel" role="dialog">
          <div className="helper-header">
            <div className="helper-avatar">✦</div>
            <div>
              <p className="helper-title">Cross-app Helper</p>
              <p className="helper-sub">{appName} · {appId}</p>
            </div>
            <button className="helper-close" onClick={() => setOpen(false)} aria-label="Close">
              ×
            </button>
          </div>

          <div className="helper-body" ref={bodyRef}>
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
                  <button className="btn btn-ghost" onClick={endSession}>
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
