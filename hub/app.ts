import express from "express";
import cors from "cors";
import { workflows, matchWorkflow, getWorkflow } from "../shared/kb/workflows.js";
import { rules, getRule } from "../shared/kb/rules.js";
import type {
  AskRequest,
  AskResponse,
  AppId,
  ErrorReport,
  SessionState,
} from "../shared/types.js";

/**
 * Hub Express app.
 *
 * Runs in two environments:
 *  - Dev: hub/server.ts imports this and calls app.listen() on :4000.
 *  - Prod: api/index.ts re-exports this as the default handler; Vercel routes
 *    every /api/* request through it.
 *
 * Session state is module-scoped — it survives within one warm serverless
 * instance but resets on cold starts. Documented in the deploy README.
 */
const app = express();
app.use(cors());
app.use(express.json());

let activeSession: SessionState | null = null;

const now = () => new Date().toISOString();

// ──────────────── KB endpoints ────────────────
app.get("/api/workflows", (_req, res) => {
  res.json(
    workflows.map((w) => ({
      id: w.id,
      title: w.title,
      description: w.description,
      category: w.category,
      apps: w.apps,
    }))
  );
});

app.get("/api/workflows/:id", (req, res) => {
  const wf = getWorkflow(req.params.id);
  if (!wf) return res.status(404).json({ error: "Workflow not found" });
  res.json(wf);
});

app.get("/api/rules", (req, res) => {
  const appId = req.query.appId as AppId | undefined;
  res.json(appId ? rules.filter((r) => r.appId === appId) : rules);
});

app.get("/api/rules/:id", (req, res) => {
  const rule = getRule(req.params.id);
  if (!rule) return res.status(404).json({ error: "Rule not found" });
  res.json(rule);
});

// ──────────────── Session endpoints ────────────────
app.get("/api/session", (_req, res) => {
  res.json(activeSession);
});

app.post("/api/session/start", (req, res) => {
  const { workflowId } = req.body as { workflowId: string };
  const wf = getWorkflow(workflowId);
  if (!wf) return res.status(404).json({ error: "Workflow not found" });

  activeSession = {
    sessionId: `s-${Date.now()}`,
    workflowId,
    stepIndex: 0,
    startedAt: now(),
    updatedAt: now(),
    currentApp: wf.steps[0].appId,
    context: {},
    errors: [],
  };
  res.json(activeSession);
});

app.post("/api/session/advance", (req, res) => {
  if (!activeSession) return res.status(400).json({ error: "No active session" });
  const wf = getWorkflow(activeSession.workflowId);
  if (!wf) return res.status(404).json({ error: "Workflow gone" });

  if (activeSession.stepIndex >= wf.steps.length - 1) {
    const completed = { ...activeSession, updatedAt: now() };
    activeSession = null;
    return res.json({ completed: true, session: completed });
  }
  activeSession.stepIndex += 1;
  activeSession.currentApp = wf.steps[activeSession.stepIndex].appId;
  activeSession.updatedAt = now();
  res.json(activeSession);
});

app.post("/api/session/back", (_req, res) => {
  if (!activeSession) return res.status(400).json({ error: "No active session" });
  const wf = getWorkflow(activeSession.workflowId);
  if (!wf) return res.status(404).json({ error: "Workflow gone" });
  activeSession.stepIndex = Math.max(0, activeSession.stepIndex - 1);
  activeSession.currentApp = wf.steps[activeSession.stepIndex].appId;
  activeSession.updatedAt = now();
  res.json(activeSession);
});

app.post("/api/session/end", (_req, res) => {
  activeSession = null;
  res.json({ ok: true });
});

// ──────────────── /ask endpoint (mocked AI) ────────────────
app.post("/api/ask", (req, res) => {
  const { query, appId } = req.body as AskRequest;
  const wf = matchWorkflow(query);
  const appRules = rules.filter((r) => r.appId === appId);

  let answer: string;
  if (wf) {
    const stepsInThisApp = wf.steps.filter((s) => s.appId === appId).length;
    answer = stepsInThisApp
      ? `I can guide you through "${wf.title}". It has ${wf.steps.length} step(s) total, ${stepsInThisApp} in this app.`
      : `"${wf.title}" starts in another app. I'll hand you off when you're ready.`;
  } else {
    answer =
      "I couldn't match a workflow to your question. Try rephrasing or pick one of the suggestions.";
  }

  const response: AskResponse = {
    answer,
    workflow: wf,
    rules: wf
      ? appRules.filter((r) => wf.steps.some((s) => s.validates?.includes(r.id)))
      : [],
  };
  res.json(response);
});

// ──────────────── /errors endpoint ────────────────
app.post("/api/errors", (req, res) => {
  const err = req.body as ErrorReport;
  if (activeSession) {
    activeSession.errors.push({
      code: err.code,
      appId: err.appId,
      message: err.message,
      suggestedWorkflowId: err.suggestedWorkflowId,
      at: now(),
    });
    activeSession.updatedAt = now();
  }
  const wf = getWorkflow(err.suggestedWorkflowId);
  const rule = rules.find((r) => r.id === err.code);
  res.json({ rule, recovery: wf });
});

// ──────────────── meta ────────────────
app.get("/api/health", (_req, res) =>
  res.json({ ok: true, workflows: workflows.length, rules: rules.length })
);

export default app;
