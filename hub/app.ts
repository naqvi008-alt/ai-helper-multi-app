import express from "express";
import cors from "cors";
import { workflows, matchWorkflow, getWorkflow } from "../shared/kb/workflows.js";
import { rules, getRule } from "../shared/kb/rules.js";
import type { AskRequest, AskResponse, AppId } from "../shared/types.js";

/**
 * Hub Express app — STATELESS.
 *
 * Session state lives client-side in localStorage (see helper-sdk/session.ts).
 * The hub is a pure function of (query, appId) → workflow, plus KB lookups,
 * so cold starts and instance scaling don't affect demos.
 *
 * Runs in two environments:
 *  - Dev: hub/server.ts imports this and calls app.listen() on :4000.
 *  - Prod: api/index.ts re-exports this as the default handler; Vercel routes
 *    every /api/* request through it.
 */
const app = express();
app.use(cors());
app.use(express.json());

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

// ──────────────── /ask (mocked AI matcher) ────────────────
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

// ──────────────── meta ────────────────
app.get("/api/health", (_req, res) =>
  res.json({
    ok: true,
    workflows: workflows.length,
    rules: rules.length,
    stateless: true,
  })
);

export default app;
