# Acme CU — Multi-App AI Helper Prototype

A prototype of the **hybrid** architecture for an in-app AI helper that works across multiple deeply-integrated apps. Each app embeds a thin SDK; a central **Hub** owns the knowledge base, workflow state, business rules, and (eventually) the AI brains.

This demonstrates how an end-to-end process — **loan onboarding from member application to disbursement** — can be guided across four separate web apps on different URLs, with a single helper experience that follows the user (and the workflow) wherever it goes.

## The architecture

```
┌────────────────┐    ┌────────────────┐    ┌────────────────┐    ┌────────────────┐
│ Member Portal  │    │ Intake App     │    │ Risk App       │    │ Fulfillment    │
│ :5174          │    │ :5175          │    │ :5176          │    │ :5177          │
│ (member-facing)│    │ (staff)        │    │ (underwriter)  │    │ (booking)      │
│   ✦ Helper SDK │    │   ✦ Helper SDK │    │   ✦ Helper SDK │    │   ✦ Helper SDK │
└───────┬────────┘    └───────┬────────┘    └───────┬────────┘    └───────┬────────┘
        │                     │                     │                     │
        └─────────────────────┴──────────┬──────────┴─────────────────────┘
                                         │ REST
                                ┌────────▼─────────┐
                                │   Hub (Express)  │
                                │     :4000        │
                                │                  │
                                │  • Workflows KB  │
                                │  • 35 biz rules  │
                                │  • Session state │
                                │  • /ask (AI)     │
                                │  • /errors       │
                                └──────────────────┘
```

**The four apps each:**
- Run on their own port (simulating different URLs / origins)
- Have their own UI, navigation, and color accent
- Embed the same `HelperWidget` from `shared/helper-sdk`
- Fire `helper:error` events when business rules fail
- Show a contextual error badge when an error is fired

**The Hub:**
- Holds the knowledge base (`shared/kb/workflows.ts`, `shared/kb/rules.ts`)
- Tracks the active session — which workflow, which step, which app
- Exposes `/api/ask` for AI-style natural language queries (currently keyword-matched, designed for a Claude swap-in)
- Receives error reports from any app and returns the suggested recovery workflow
- **The single source of truth** that survives the user navigating between apps

## Running it

Requirements: **Node.js 18+** and npm.

```bash
npm install
npm run dev
```

That starts all 5 services concurrently:
- Hub → http://localhost:4000
- Member Portal → http://localhost:5174
- Intake → http://localhost:5175
- Risk → http://localhost:5176
- Fulfillment → http://localhost:5177

Each Vite app is independent and runs separately. To start just one:

```bash
npm run hub          # Hub only
npm run member       # Member Portal only
npm run intake       # Intake only
npm run risk         # Risk only
npm run fulfillment  # Fulfillment only
```

## Demo script

**Flow 1: Cross-app workflow (the headline demo)**

1. Open **Member Portal** at http://localhost:5174.
2. Click the ✦ helper button → ask **"How do I apply for a loan?"** → click **Start walkthrough**.
3. Follow the on-screen step card. The helper highlights fields on this app.
4. Now open **Intake** at http://localhost:5175 in another tab. The helper there *already shows the workflow in progress* — because session state lives in the Hub, not in any one app.
5. Same for Risk (:5176) and Fulfillment (:5177).
6. The helper labels each step with the responsible app, and offers an "Open intake-app ↗" deep-link button when the next step is in a different app.

**Flow 2: Error-triggered help (cross-app recovery)**

1. Open **Intake** at http://localhost:5175.
2. Click any row in the queue → on the review page, click **Verify** on Address Proof. It fails rule **RI-04** (address proof > 90 days old).
3. A red "Need help fixing this?" badge appears anchored to the offending row.
4. Click it. The helper opens a **cross-app recovery workflow** (`wf-r-address-stale`) — the next step says "Member uploads new address proof on the Member Portal" with a button to open that app.
5. Try the same in **Risk** (`Check ratios` → fails RI-02 DTI) and **Fulfillment** (`Disburse` without e-signing → fails RF-01). Each triggers a different cross-app recovery.

**Flow 3: AI-style natural language**

In any app, open the helper and try free text like:
- "Why was my application returned?" (Member)
- "DTI is too high — options?" (Risk)
- "Bank account not verified — how to fix?" (Fulfillment)

The Hub's `/api/ask` matches the question to a workflow and returns it. Today this is keyword/alias matching in `shared/kb/workflows.ts:matchWorkflow()`. Swap that one function with an Anthropic Claude call to upgrade it.

## The knowledge base

**35 business rules** in `shared/kb/rules.ts`, distributed across the four apps:

| App           | Rules         | Examples                                                   |
|---------------|---------------|------------------------------------------------------------|
| Member Portal | RM-01 … RM-10 | Age ≥ 18, ID format, loan amount bounds, docs uploaded     |
| Intake        | RI-01 … RI-10 | KYC, AML, address proof recency, loan-to-income ratio      |
| Risk          | RR-01 … RR-10 | Credit floor, DTI ≤ 43%, LTV, risk-based pricing, authority |
| Fulfillment   | RF-01 … RF-05 | E-sign, bank verify, high-value hold, auto-debit, payment dates |

**Workflows** in `shared/kb/workflows.ts`:
- 5 primary workflows (end-to-end onboarding + one per app)
- 8 recovery workflows triggered by specific rule failures, several of which span apps (e.g., `wf-r-address-stale` starts in Intake and continues in Member Portal)

Every step is tagged with `appId`, instructions, and (optionally) a `selector` and `navigateUrl`. Adding new business rules or workflows is a pure data change — the apps and SDK don't need to know.

## What's working

- 4 separate Vite apps on different ports + 1 Express hub
- Shared helper SDK embedded in each app (identical bundle, app-specific config)
- Hub-coordinated session state: workflow state survives app navigation
- 35 business rules with severity, category, and recovery workflow references
- 13 workflows total (5 primary + 8 recovery), 6 of which span multiple apps
- Live error events from each app's forms → contextual help badge → recovery workflow
- Mock AI matching with a clean seam for Claude swap-in
- App-accented styling (each app has its own color band) so the cross-app handoff is visually obvious

## What's stubbed / mocked

- **No real auth** — single global session in the Hub (production: per-user, JWT).
- **No real LLM** — Hub's `/api/ask` uses keyword/alias matching; replace `matchWorkflow()` with a Claude call to upgrade.
- **No persistence** — Hub state is in-memory; restarts wipe sessions.
- **No real cross-app notifications** — the demo uses polling (1.2s) to detect Hub state changes. Production would use websockets or SSE.
- **Workflows are hand-authored TypeScript** — no admin authoring UI.
- **No screenshots in the KB yet** — instruction text only. Add image refs to each step when ready.

## Top 3 things to improve next

1. **Plug in Claude.** Replace the body of `matchWorkflow()` in `shared/kb/workflows.ts` with an Anthropic call that takes the user's question + the current `appId` + the list of workflows and returns the best match plus an explanation. The interface is already shaped for it.
2. **Authoring UI.** A web tool for non-devs to add/edit workflows and attach screenshots, writing back to the Hub. This is the single highest-leverage piece — once the hub owns the KB, content updates ship without touching app code.
3. **Real-time push.** Swap the 1.2s polling for websockets/SSE so cross-app handoffs feel instant.

## Project structure

```
multi-app-prototype/
├── package.json              one root, deps + scripts only
├── tsconfig.json
├── README.md
├── hub/
│   └── server.ts             Express hub: KB + sessions + /ask + /errors
├── shared/
│   ├── types.ts              cross-cutting types
│   ├── styles.css            shared host-app styles
│   ├── kb/
│   │   ├── rules.ts          35 business rules
│   │   └── workflows.ts      13 workflows + matchWorkflow()
│   └── helper-sdk/
│       ├── HelperWidget.tsx  the floating helper, embedded in every app
│       ├── api.ts            fetch wrappers for the Hub
│       └── helper.css        helper styling (independent of host CSS)
└── apps/
    ├── member-portal/        :5174 — member-facing
    ├── intake-app/           :5175 — staff intake review
    ├── risk-app/             :5176 — underwriting
    └── fulfillment-app/      :5177 — booking & disbursement
```
