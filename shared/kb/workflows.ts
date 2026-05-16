import type { Workflow } from "../types.js";

/**
 * App URLs.
 *
 * - In dev (Node server), each app runs on its own port → we use absolute URLs.
 * - In prod (single Vercel deploy with path-based routing), apps are mounted at
 *   `/`, `/intake/`, `/risk/`, `/fulfillment/` on the same origin → we use
 *   relative paths so the helper's deep-link buttons work regardless of domain.
 *
 * Override anything by setting env vars on the hub deployment.
 */
function pickUrls() {
  // process.env is available on the Node hub. In the browser bundle the KB
  // is only read via the hub's REST API, so this code never runs client-side.
  const isProd = typeof process !== "undefined" && process.env?.VERCEL === "1";
  if (isProd) {
    // Production: same-origin path-based routing on Vercel.
    // No trailing slash so `${url}/page` concatenation produces clean URLs.
    return {
      "member-portal": process.env.MEMBER_PORTAL_URL ?? "",
      "intake-app": process.env.INTAKE_APP_URL ?? "/intake",
      "risk-app": process.env.RISK_APP_URL ?? "/risk",
      "fulfillment-app": process.env.FULFILLMENT_APP_URL ?? "/fulfillment",
    } as const;
  }
  return {
    "member-portal": "http://localhost:5174",
    "intake-app": "http://localhost:5175",
    "risk-app": "http://localhost:5176",
    "fulfillment-app": "http://localhost:5177",
  } as const;
}

const APP_URLS = pickUrls();

export const workflows: Workflow[] = [
  // ──────────────── PRIMARY: End-to-end loan onboarding ────────────────
  {
    id: "wf-loan-onboarding",
    title: "Process a new loan from application to disbursement",
    description:
      "End-to-end loan onboarding spanning the Member Portal, Intake, Risk, and Fulfillment apps.",
    aliases: [
      "onboard new loan",
      "process loan application",
      "end to end loan",
      "complete loan",
    ],
    category: "primary",
    apps: ["member-portal", "intake-app", "risk-app", "fulfillment-app"],
    steps: [
      {
        appId: "member-portal",
        page: "/apply",
        title: "Member submits loan application",
        instruction:
          "Member completes personal info, loan details, and uploads required documents on the Member Portal.",
        validates: ["RM-01", "RM-02", "RM-03", "RM-04", "RM-05", "RM-06", "RM-07", "RM-08", "RM-09", "RM-10"],
        completion: "manual",
        navigateUrl: `${APP_URLS["member-portal"]}/apply`,
      },
      {
        appId: "intake-app",
        page: "/queue",
        title: "Staff reviews intake queue",
        instruction:
          "Open the Intake app, pick the application from the queue, and run KYC + document verification.",
        validates: ["RI-01", "RI-02", "RI-03", "RI-04", "RI-09", "RI-10"],
        completion: "manual",
        navigateUrl: `${APP_URLS["intake-app"]}/queue`,
      },
      {
        appId: "intake-app",
        page: "/review",
        title: "Staff verifies income & employment",
        instruction:
          "Check income proof against application; verify employment tenure; ratio check.",
        validates: ["RI-05", "RI-06", "RI-07", "RI-08"],
        completion: "manual",
      },
      {
        appId: "risk-app",
        page: "/queue",
        title: "Risk underwriter reviews credit",
        instruction:
          "Open the Risk app, pull credit report, run DTI/LTV checks, set pricing tier.",
        validates: ["RR-01", "RR-02", "RR-03", "RR-04", "RR-05", "RR-06", "RR-07"],
        completion: "manual",
        navigateUrl: `${APP_URLS["risk-app"]}/queue`,
      },
      {
        appId: "risk-app",
        page: "/decision",
        title: "Risk makes approval decision",
        instruction:
          "Choose approve / counter-offer / decline. Route to the correct approver based on amount.",
        validates: ["RR-08", "RR-09", "RR-10"],
        completion: "manual",
      },
      {
        appId: "fulfillment-app",
        page: "/queue",
        title: "Fulfillment books the loan",
        instruction:
          "Open the Fulfillment app, verify e-signature, verify disbursement account, set up auto-debit.",
        validates: ["RF-01", "RF-02", "RF-04", "RF-05"],
        completion: "manual",
        navigateUrl: `${APP_URLS["fulfillment-app"]}/queue`,
      },
      {
        appId: "fulfillment-app",
        page: "/disburse",
        title: "Disburse funds",
        instruction:
          "Confirm amount, apply any 24h hold for high-value loans, release funds.",
        validates: ["RF-03"],
        completion: "manual",
      },
    ],
  },

  // ──────────────── PRIMARY: Member applies for loan ────────────────
  {
    id: "wf-member-apply",
    title: "Apply for a new loan (member)",
    description: "Member-facing walkthrough for submitting a loan application.",
    aliases: [
      "apply for loan",
      "new loan application",
      "how do i apply",
      "request a loan",
      "start application",
    ],
    category: "primary",
    apps: ["member-portal"],
    steps: [
      {
        appId: "member-portal",
        page: "/apply",
        title: "Open Apply for a loan",
        instruction: "Click 'Apply for a loan' on the dashboard.",
        selector: "[data-tour='nav-apply']",
        completion: "click",
      },
      {
        appId: "member-portal",
        page: "/apply",
        title: "Enter personal info",
        instruction:
          "Fill in your name, date of birth, and ID number. You must be 18+ and your ID format must match your country.",
        selector: "[data-tour='apply-name']",
        validates: ["RM-01", "RM-02"],
        completion: "manual",
      },
      {
        appId: "member-portal",
        page: "/apply",
        title: "Declare income",
        instruction: "Select your income source and enter annual income.",
        selector: "[data-tour='apply-income']",
        validates: ["RM-03", "RM-04"],
        completion: "manual",
      },
      {
        appId: "member-portal",
        page: "/apply",
        title: "Choose loan terms",
        instruction: "Pick amount ($1,000–$250,000), term (12–84 months), and purpose.",
        selector: "[data-tour='apply-amount']",
        validates: ["RM-05", "RM-06", "RM-07"],
        completion: "manual",
      },
      {
        appId: "member-portal",
        page: "/apply",
        title: "Verify contact info",
        instruction: "Confirm email and phone via OTP codes.",
        selector: "[data-tour='apply-email']",
        validates: ["RM-08", "RM-09"],
        completion: "manual",
      },
      {
        appId: "member-portal",
        page: "/apply",
        title: "Upload documents",
        instruction: "Upload ID, proof of income, and address proof.",
        selector: "[data-tour='apply-docs']",
        validates: ["RM-10"],
        completion: "manual",
      },
      {
        appId: "member-portal",
        page: "/apply",
        title: "Submit",
        instruction: "Click Submit to send your application to intake.",
        selector: "[data-tour='apply-submit']",
        completion: "click",
      },
    ],
  },

  // ──────────────── PRIMARY: Staff intake review ────────────────
  {
    id: "wf-intake-review",
    title: "Review a loan application (intake)",
    description: "Staff walkthrough to KYC and document-verify an application.",
    aliases: ["review application", "intake review", "kyc check", "verify docs"],
    category: "primary",
    apps: ["intake-app"],
    steps: [
      {
        appId: "intake-app",
        page: "/queue",
        title: "Open the intake queue",
        instruction: "Click 'Queue' and pick the next application.",
        selector: "[data-tour='nav-queue']",
        completion: "click",
      },
      {
        appId: "intake-app",
        page: "/review",
        title: "Run KYC check",
        instruction: "Click 'Run KYC' to validate identity against the watchlist.",
        selector: "[data-tour='kyc-run']",
        validates: ["RI-01", "RI-02", "RI-03"],
        completion: "click",
      },
      {
        appId: "intake-app",
        page: "/review",
        title: "Verify address proof",
        instruction: "Open the address proof and confirm it's < 90 days old.",
        selector: "[data-tour='doc-address']",
        validates: ["RI-04"],
        completion: "manual",
      },
      {
        appId: "intake-app",
        page: "/review",
        title: "Income & employment check",
        instruction:
          "Verify income, employment tenure, and ratio against requested amount.",
        selector: "[data-tour='income-check']",
        validates: ["RI-05", "RI-06", "RI-07", "RI-08"],
        completion: "manual",
      },
      {
        appId: "intake-app",
        page: "/review",
        title: "Forward to risk",
        instruction: "Click 'Forward to risk' if all checks pass.",
        selector: "[data-tour='forward-risk']",
        completion: "click",
      },
    ],
  },

  // ──────────────── PRIMARY: Risk underwriting ────────────────
  {
    id: "wf-risk-decision",
    title: "Underwrite a loan (risk)",
    description: "Underwriter walkthrough to credit-decision an application.",
    aliases: ["underwrite", "make credit decision", "risk decision", "approve loan"],
    category: "primary",
    apps: ["risk-app"],
    steps: [
      {
        appId: "risk-app",
        page: "/queue",
        title: "Open risk queue",
        instruction: "Pick the next application from the risk queue.",
        selector: "[data-tour='nav-queue']",
        completion: "click",
      },
      {
        appId: "risk-app",
        page: "/decision",
        title: "Pull credit report",
        instruction: "Click 'Pull credit' to fetch the bureau report.",
        selector: "[data-tour='pull-credit']",
        validates: ["RR-01"],
        completion: "click",
      },
      {
        appId: "risk-app",
        page: "/decision",
        title: "Check DTI & LTV",
        instruction: "Confirm DTI ≤ 43% and LTV ≤ 80% (for secured).",
        selector: "[data-tour='ratios']",
        validates: ["RR-02", "RR-03", "RR-04"],
        completion: "manual",
      },
      {
        appId: "risk-app",
        page: "/decision",
        title: "Apply pricing tier",
        instruction: "Use the auto-priced rate based on credit tier.",
        selector: "[data-tour='pricing']",
        validates: ["RR-07"],
        completion: "manual",
      },
      {
        appId: "risk-app",
        page: "/decision",
        title: "Approve / Counter / Decline",
        instruction: "Make the final decision and route to the correct approver.",
        selector: "[data-tour='decide']",
        validates: ["RR-05", "RR-08", "RR-09"],
        completion: "click",
      },
    ],
  },

  // ──────────────── PRIMARY: Fulfillment booking ────────────────
  {
    id: "wf-fulfill-book",
    title: "Book and disburse a loan (fulfillment)",
    description: "Fulfillment walkthrough to book an approved loan and disburse funds.",
    aliases: ["book loan", "disburse loan", "fund loan", "complete booking"],
    category: "primary",
    apps: ["fulfillment-app"],
    steps: [
      {
        appId: "fulfillment-app",
        page: "/queue",
        title: "Open fulfillment queue",
        instruction: "Pick the next approved loan.",
        selector: "[data-tour='nav-queue']",
        completion: "click",
      },
      {
        appId: "fulfillment-app",
        page: "/disburse",
        title: "Verify e-signature",
        instruction: "Confirm the member has e-signed the loan agreement.",
        selector: "[data-tour='esign-check']",
        validates: ["RF-01"],
        completion: "manual",
      },
      {
        appId: "fulfillment-app",
        page: "/disburse",
        title: "Verify disbursement account",
        instruction: "Confirm bank account has been micro-deposit verified.",
        selector: "[data-tour='bank-check']",
        validates: ["RF-02"],
        completion: "manual",
      },
      {
        appId: "fulfillment-app",
        page: "/disburse",
        title: "Set up auto-debit",
        instruction: "Capture the ACH auto-debit mandate.",
        selector: "[data-tour='auto-debit']",
        validates: ["RF-04", "RF-05"],
        completion: "manual",
      },
      {
        appId: "fulfillment-app",
        page: "/disburse",
        title: "Release funds",
        instruction:
          "Click Disburse. For amounts > $100k, the system will apply a 24h hold automatically.",
        selector: "[data-tour='disburse']",
        validates: ["RF-03"],
        completion: "click",
      },
    ],
  },

  // ──────────────── RECOVERY workflows (cross-app) ────────────────
  {
    id: "wf-r-income-ratio",
    title: "Fix loan-to-income ratio",
    description:
      "Triggered by RI-06. Cross-app: member must update amount or upload more income docs.",
    aliases: ["income ratio", "loan too big", "ri-06"],
    category: "recovery",
    apps: ["intake-app", "member-portal"],
    steps: [
      {
        appId: "intake-app",
        page: "/review",
        title: "Note the ratio breach",
        instruction:
          "The requested loan amount exceeds 5× the stated annual income. Add a reviewer note.",
        completion: "manual",
      },
      {
        appId: "intake-app",
        page: "/review",
        title: "Choose remediation",
        instruction: "Pick: (a) ask member to reduce amount, or (b) request additional income docs.",
        selector: "[data-tour='remediation-choice']",
        completion: "click",
      },
      {
        appId: "member-portal",
        page: "/application/edit",
        title: "Member adjusts application",
        instruction:
          "Member receives notification and opens the portal to reduce the amount or upload additional income proof.",
        navigateUrl: `${APP_URLS["member-portal"]}/apply`,
        completion: "manual",
      },
      {
        appId: "intake-app",
        page: "/review",
        title: "Re-verify",
        instruction: "Re-run the ratio check once the member responds.",
        selector: "[data-tour='income-check']",
        validates: ["RI-06"],
        completion: "click",
      },
    ],
  },
  {
    id: "wf-r-address-stale",
    title: "Refresh stale address proof",
    description:
      "Triggered by RI-04. Address proof is older than 90 days; member must upload a new one.",
    aliases: ["stale address", "address proof old", "ri-04"],
    category: "recovery",
    apps: ["intake-app", "member-portal"],
    steps: [
      {
        appId: "intake-app",
        page: "/review",
        title: "Mark address proof as stale",
        instruction: "Click 'Request new doc' to send member a notification.",
        selector: "[data-tour='doc-address']",
        completion: "click",
      },
      {
        appId: "member-portal",
        page: "/apply",
        title: "Member uploads new address proof",
        instruction: "Member opens portal and uploads a utility bill dated within 90 days.",
        navigateUrl: `${APP_URLS["member-portal"]}/apply`,
        completion: "manual",
      },
      {
        appId: "intake-app",
        page: "/review",
        title: "Re-verify",
        instruction: "Confirm new document and continue intake.",
        validates: ["RI-04"],
        completion: "click",
      },
    ],
  },
  {
    id: "wf-r-doc-quality",
    title: "Re-upload illegible document",
    description: "Triggered by RI-10. A document is blurry/unreadable.",
    aliases: ["blurry doc", "doc quality", "ri-10"],
    category: "recovery",
    apps: ["intake-app", "member-portal"],
    steps: [
      {
        appId: "intake-app",
        page: "/review",
        title: "Flag the document",
        instruction: "Tag the offending document and request re-upload.",
        completion: "click",
      },
      {
        appId: "member-portal",
        page: "/apply",
        title: "Member re-uploads",
        instruction: "Member retakes the photo / scan and re-uploads.",
        navigateUrl: `${APP_URLS["member-portal"]}/apply`,
        completion: "manual",
      },
    ],
  },
  {
    id: "wf-r-docs-missing",
    title: "Required documents missing",
    description: "Triggered by RM-10 at submission time.",
    aliases: ["missing docs", "docs not uploaded", "rm-10"],
    category: "recovery",
    apps: ["member-portal"],
    steps: [
      {
        appId: "member-portal",
        page: "/apply",
        title: "Upload all three required documents",
        instruction: "Government ID, proof of income, and address proof are all required.",
        selector: "[data-tour='apply-docs']",
        completion: "manual",
      },
    ],
  },
  {
    id: "wf-r-credit-floor",
    title: "Credit score below product floor",
    description:
      "Triggered by RR-01. Offer alternatives or decline with adverse-action notice.",
    aliases: ["low credit", "credit floor", "rr-01"],
    category: "recovery",
    apps: ["risk-app", "intake-app", "member-portal"],
    steps: [
      {
        appId: "risk-app",
        page: "/decision",
        title: "Note the credit floor breach",
        instruction:
          "Document that the pulled score is below the product floor. Choose an action.",
        completion: "manual",
      },
      {
        appId: "risk-app",
        page: "/decision",
        title: "Offer secured alternative",
        instruction: "Counter with a secured-loan offer at adjusted pricing.",
        completion: "click",
      },
      {
        appId: "member-portal",
        page: "/apply",
        title: "Member reviews alternative",
        instruction: "Member receives counter-offer and accepts or declines via portal.",
        navigateUrl: `${APP_URLS["member-portal"]}/apply`,
        completion: "manual",
      },
    ],
  },
  {
    id: "wf-r-dti",
    title: "DTI too high",
    description: "Triggered by RR-02. Options to reduce loan or consolidate debt.",
    aliases: ["dti too high", "rr-02", "debt to income"],
    category: "recovery",
    apps: ["risk-app", "member-portal"],
    steps: [
      {
        appId: "risk-app",
        page: "/decision",
        title: "Show DTI calculation",
        instruction: "Open the DTI breakdown panel — confirm including this loan, DTI > 43%.",
        selector: "[data-tour='ratios']",
        completion: "manual",
      },
      {
        appId: "risk-app",
        page: "/decision",
        title: "Pick remediation",
        instruction:
          "Choose: extend term, reduce amount, or require debt consolidation as a condition.",
        selector: "[data-tour='decide']",
        completion: "click",
      },
      {
        appId: "member-portal",
        page: "/apply",
        title: "Member accepts adjusted terms",
        instruction: "Member opens portal and accepts new amount/term or consolidation condition.",
        navigateUrl: `${APP_URLS["member-portal"]}/apply`,
        completion: "manual",
      },
    ],
  },
  {
    id: "wf-r-esign",
    title: "Member hasn't e-signed yet",
    description: "Triggered by RF-01. Send e-signature reminder.",
    aliases: ["esign", "signature missing", "rf-01"],
    category: "recovery",
    apps: ["fulfillment-app", "member-portal"],
    steps: [
      {
        appId: "fulfillment-app",
        page: "/disburse",
        title: "Send e-signature request",
        instruction: "Click 'Send e-sign request' to dispatch DocuSign envelope.",
        selector: "[data-tour='esign-check']",
        completion: "click",
      },
      {
        appId: "member-portal",
        page: "/apply",
        title: "Member signs",
        instruction: "Member opens portal, sees signature request, and e-signs.",
        navigateUrl: `${APP_URLS["member-portal"]}/apply`,
        completion: "manual",
      },
      {
        appId: "fulfillment-app",
        page: "/disburse",
        title: "Confirm signature on file",
        instruction: "Re-check e-signature status before disbursing.",
        validates: ["RF-01"],
        completion: "click",
      },
    ],
  },
  {
    id: "wf-r-bank-verify",
    title: "Bank account not verified",
    description:
      "Triggered by RF-02. Member must complete micro-deposit verification on portal.",
    aliases: ["bank verify", "micro deposit", "rf-02"],
    category: "recovery",
    apps: ["fulfillment-app", "member-portal"],
    steps: [
      {
        appId: "fulfillment-app",
        page: "/disburse",
        title: "Initiate micro-deposit",
        instruction: "Click 'Send micro-deposits' to start verification.",
        selector: "[data-tour='bank-check']",
        completion: "click",
      },
      {
        appId: "member-portal",
        page: "/apply",
        title: "Member confirms deposit amounts",
        instruction: "Member receives two small deposits and enters the amounts on the portal.",
        navigateUrl: `${APP_URLS["member-portal"]}/apply`,
        completion: "manual",
      },
      {
        appId: "fulfillment-app",
        page: "/disburse",
        title: "Confirm verification",
        instruction: "Bank account is now verified; proceed to disburse.",
        validates: ["RF-02"],
        completion: "click",
      },
    ],
  },
];

function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
}

export function matchWorkflow(query: string): Workflow | null {
  const q = normalize(query);
  if (!q) return null;
  for (const wf of workflows) {
    for (const a of [...wf.aliases, wf.title]) {
      const na = normalize(a);
      if (q === na || q.includes(na) || na.includes(q)) return wf;
    }
  }
  const tokens = q.split(" ").filter((t) => t.length > 2);
  let best: { score: number; wf: Workflow } | null = null;
  for (const wf of workflows) {
    const hay = normalize([wf.title, ...wf.aliases, wf.description].join(" "));
    let score = 0;
    for (const t of tokens) if (hay.includes(t)) score += 1;
    if (score > 0 && (!best || score > best.score)) best = { score, wf };
  }
  return best?.wf ?? null;
}

export function getWorkflow(id: string) {
  return workflows.find((w) => w.id === id);
}
