import type { AppId, AskResponse, BusinessRule, Workflow } from "../types.js";

// In dev, hub is on :4000. In prod (Vercel), it's a relative path because the
// hub serverless functions live on the same origin under /api/*.
const HUB =
  (import.meta.env.VITE_HUB_URL as string | undefined) ||
  (import.meta.env.PROD ? "" : "http://localhost:4000");

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${HUB}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) throw new Error(`Hub ${path} failed: ${res.status}`);
  return (await res.json()) as T;
}

/**
 * Stateless API for the helper SDK.
 *
 * Session state lives client-side in localStorage (see ./session.ts) — the
 * hub is only a KB lookup + AI matcher, so it's a pure function of (query,
 * appId) → workflow. This means cold starts and instance scaling don't
 * affect demos.
 */
export const api = {
  listWorkflows: () =>
    http<Array<Pick<Workflow, "id" | "title" | "description" | "category" | "apps">>>(
      "/api/workflows"
    ),
  getWorkflow: (id: string) => http<Workflow>(`/api/workflows/${id}`),
  getRules: (appId?: AppId) =>
    http<BusinessRule[]>(`/api/rules${appId ? `?appId=${appId}` : ""}`),
  ask: (query: string, appId: AppId) =>
    http<AskResponse>("/api/ask", {
      method: "POST",
      body: JSON.stringify({ query, appId }),
    }),
};
