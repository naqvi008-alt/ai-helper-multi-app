import type { Workflow } from "../types.js";

/**
 * App URLs.
 *
 * - In dev (Node server), each app runs on its own port → we use absolute URLs.
 * - In prod (single Vercel deploy with path-based routing), apps are mounted at
 *   `/`, `/intake/`, `/risk/`, `/fulfillment/` on the same origin → we use
 *   relative paths so the helper's deep-link buttons work regardless of domain.
 */
function pickUrls() {
  const isProd = typeof process !== "undefined" && process.env?.VERCEL === "1";
  if (isProd) {
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
        preview: {
          page: "Apply for a loan",
          path: "/apply",
          context: ["Personal info", "Loan details", "Contact"],
          target: { label: "Submit application", kind: "button", hint: "After all fields are filled" },
        },
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
        preview: {
          page: "Intake queue",
          path: "/queue",
          context: ["APP-22479 · Carlos Perez", "APP-22476 · Beth Wong"],
          target: { label: "APP-22481 · Jane Member · $15,000", kind: "table", hint: "Click row to open" },
        },
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
        preview: {
          page: "Application review · APP-22481",
          path: "/review",
          context: ["KYC & screening", "Documents"],
          target: { label: "Income & employment · Check ratios", kind: "card", hint: "Validates RI-05..08" },
        },
        validates: ["RI-05", "RI-06", "RI-07", "RI-08"],
        completion: "manual",
      },
      {
        appId: "risk-app",
        page: "/queue",
        title: "Risk underwriter reviews credit",
        instruction:
          "Open the Risk app, pull credit report, run DTI/LTV checks, set pricing tier.",
        preview: {
          page: "Risk queue",
          path: "/queue",
          context: ["APP-22467 · Sam O'Neill", "APP-22458 · Lin Chen"],
          target: { label: "APP-22481 · Score 678 · Tier C", kind: "table", hint: "Click to underwrite" },
        },
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
        preview: {
          page: "Underwriting decision · APP-22481",
          path: "/decision",
          context: ["Credit report", "Ratios", "Pricing"],
          target: { label: "Approve → Fulfillment", kind: "button", hint: "Or Counter / Decline" },
        },
        validates: ["RR-08", "RR-09", "RR-10"],
        completion: "manual",
      },
      {
        appId: "fulfillment-app",
        page: "/queue",
        title: "Fulfillment books the loan",
        instruction:
          "Open the Fulfillment app, verify e-signature, verify disbursement account, set up auto-debit.",
        preview: {
          page: "Fulfillment queue",
          path: "/queue",
          context: ["APP-22467 · E-sign pending", "APP-22458 · Bank verify pending"],
          target: { label: "APP-22481 · Approved · $15,000", kind: "table", hint: "Click to book" },
        },
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
        preview: {
          page: "Book APP-22481",
          path: "/disburse",
          context: ["E-signature ✓", "Account verified ✓", "Auto-debit ✓"],
          target: { label: "Disburse $15,000", kind: "button", hint: "Release funds" },
        },
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
        preview: {
          page: "Dashboard",
          path: "/",
          context: ["Welcome back, Jane", "Your accounts"],
          target: { label: "Apply for a loan →", kind: "button", hint: "In the top navigation" },
        },
        completion: "click",
      },
      {
        appId: "member-portal",
        page: "/apply",
        title: "Enter personal info",
        instruction:
          "Fill in your name, date of birth, and ID number. You must be 18+ and your ID format must match your country.",
        preview: {
          page: "Apply for a loan · Personal info",
          path: "/apply",
          context: ["Date of birth", "Government ID (SSN)"],
          target: { label: "Full name", kind: "input", hint: "Required" },
        },
        validates: ["RM-01", "RM-02"],
        completion: "manual",
      },
      {
        appId: "member-portal",
        page: "/apply",
        title: "Declare income",
        instruction: "Select your income source and enter annual income.",
        preview: {
          page: "Apply for a loan · Personal info",
          path: "/apply",
          context: ["Government ID"],
          target: { label: "Income source / Annual income", kind: "input", hint: "Required" },
        },
        validates: ["RM-03", "RM-04"],
        completion: "manual",
      },
      {
        appId: "member-portal",
        page: "/apply",
        title: "Choose loan terms",
        instruction: "Pick amount ($1,000–$250,000), term (12–84 months), and purpose.",
        preview: {
          page: "Apply for a loan · Loan details",
          path: "/apply",
          context: ["Purpose", "Term (months)"],
          target: { label: "Amount requested (USD)", kind: "input", hint: "$1,000–$250,000" },
        },
        validates: ["RM-05", "RM-06", "RM-07"],
        completion: "manual",
      },
      {
        appId: "member-portal",
        page: "/apply",
        title: "Verify contact info",
        instruction: "Confirm email and phone via OTP codes.",
        preview: {
          page: "Apply for a loan · Contact",
          path: "/apply",
          context: ["Phone"],
          target: { label: "Email", kind: "input", hint: "Will be verified" },
        },
        validates: ["RM-08", "RM-09"],
        completion: "manual",
      },
      {
        appId: "member-portal",
        page: "/apply",
        title: "Upload documents",
        instruction: "Upload ID, proof of income, and address proof.",
        preview: {
          page: "Apply for a loan · Documents",
          path: "/apply",
          context: ["Government-issued ID", "Proof of income"],
          target: { label: "Address proof", kind: "doc-upload", hint: "< 90 days old" },
        },
        validates: ["RM-10"],
        completion: "manual",
      },
      {
        appId: "member-portal",
        page: "/apply",
        title: "Submit",
        instruction: "Click Submit to send your application to intake.",
        preview: {
          page: "Apply for a loan",
          path: "/apply",
          context: ["All sections complete"],
          target: { label: "Submit application", kind: "button", hint: "Sends to intake" },
        },
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
        preview: {
          page: "Intake queue",
          path: "/queue",
          context: ["APP-22479 · Carlos Perez"],
          target: { label: "APP-22481 · Jane Member · Awaiting KYC", kind: "table", hint: "Click row" },
        },
        completion: "click",
      },
      {
        appId: "intake-app",
        page: "/review",
        title: "Run KYC check",
        instruction: "Click 'Run KYC' to validate identity against the watchlist.",
        preview: {
          page: "Review APP-22481 · KYC & screening",
          path: "/review",
          context: ["Validates RI-01..03"],
          target: { label: "Run KYC", kind: "button", hint: "Watchlist + AML + PEP" },
        },
        validates: ["RI-01", "RI-02", "RI-03"],
        completion: "click",
      },
      {
        appId: "intake-app",
        page: "/review",
        title: "Verify address proof",
        instruction: "Open the address proof and confirm it's < 90 days old.",
        preview: {
          page: "Review APP-22481 · Documents",
          path: "/review",
          context: ["KYC ✓"],
          target: { label: "Address proof · Verify", kind: "card", hint: "Must be < 90 days" },
        },
        validates: ["RI-04"],
        completion: "manual",
      },
      {
        appId: "intake-app",
        page: "/review",
        title: "Income & employment check",
        instruction:
          "Verify income, employment tenure, and ratio against requested amount.",
        preview: {
          page: "Review APP-22481 · Income & employment",
          path: "/review",
          context: ["Documents ✓"],
          target: { label: "Loan/income ratio · Check", kind: "card", hint: "Max 5×" },
        },
        validates: ["RI-05", "RI-06", "RI-07", "RI-08"],
        completion: "manual",
      },
      {
        appId: "intake-app",
        page: "/review",
        title: "Forward to risk",
        instruction: "Click 'Forward to risk' if all checks pass.",
        preview: {
          page: "Review APP-22481 · Decision",
          path: "/review",
          context: ["All checks ✓"],
          target: { label: "Forward to risk →", kind: "button", hint: "Routes to risk queue" },
        },
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
        preview: {
          page: "Risk queue",
          path: "/queue",
          context: ["APP-22467 · Tier B"],
          target: { label: "APP-22481 · Jane Member · Tier C", kind: "table", hint: "Click row" },
        },
        completion: "click",
      },
      {
        appId: "risk-app",
        page: "/decision",
        title: "Pull credit report",
        instruction: "Click 'Pull credit' to fetch the bureau report.",
        preview: {
          page: "Underwrite APP-22481 · Credit report",
          path: "/decision",
          target: { label: "Pull credit", kind: "button", hint: "Validates RR-01 (floor)" },
        },
        validates: ["RR-01"],
        completion: "click",
      },
      {
        appId: "risk-app",
        page: "/decision",
        title: "Check DTI & LTV",
        instruction: "Confirm DTI ≤ 43% and LTV ≤ 80% (for secured).",
        preview: {
          page: "Underwrite APP-22481 · Ratios",
          path: "/decision",
          context: ["Credit ✓ Tier C"],
          target: { label: "Check ratios", kind: "button", hint: "DTI must be ≤ 43%" },
        },
        validates: ["RR-02", "RR-03", "RR-04"],
        completion: "manual",
      },
      {
        appId: "risk-app",
        page: "/decision",
        title: "Apply pricing tier",
        instruction: "Use the auto-priced rate based on credit tier.",
        preview: {
          page: "Underwrite APP-22481 · Pricing",
          path: "/decision",
          context: ["Tier C → 10.5% suggested"],
          target: { label: "Apply tier pricing", kind: "button", hint: "Risk-based pricing" },
        },
        validates: ["RR-07"],
        completion: "manual",
      },
      {
        appId: "risk-app",
        page: "/decision",
        title: "Approve / Counter / Decline",
        instruction: "Make the final decision and route to the correct approver.",
        preview: {
          page: "Underwrite APP-22481 · Decision",
          path: "/decision",
          context: ["Decline", "Counter-offer"],
          target: { label: "Approve → Fulfillment", kind: "button", hint: "Routes to fulfillment" },
        },
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
        preview: {
          page: "Fulfillment queue",
          path: "/queue",
          context: ["APP-22467 · E-sign pending"],
          target: { label: "APP-22481 · Approved · $15,000", kind: "table", hint: "Click row" },
        },
        completion: "click",
      },
      {
        appId: "fulfillment-app",
        page: "/disburse",
        title: "Verify e-signature",
        instruction: "Confirm the member has e-signed the loan agreement.",
        preview: {
          page: "Book APP-22481 · E-signature",
          path: "/disburse",
          target: { label: "Mark as e-signed", kind: "button", hint: "Validates RF-01" },
        },
        validates: ["RF-01"],
        completion: "manual",
      },
      {
        appId: "fulfillment-app",
        page: "/disburse",
        title: "Verify disbursement account",
        instruction: "Confirm bank account has been micro-deposit verified.",
        preview: {
          page: "Book APP-22481 · Disbursement account",
          path: "/disburse",
          context: ["E-signature ✓"],
          target: { label: "Mark verified", kind: "button", hint: "Validates RF-02" },
        },
        validates: ["RF-02"],
        completion: "manual",
      },
      {
        appId: "fulfillment-app",
        page: "/disburse",
        title: "Set up auto-debit",
        instruction: "Capture the ACH auto-debit mandate.",
        preview: {
          page: "Book APP-22481 · Auto-debit mandate",
          path: "/disburse",
          context: ["E-signature ✓", "Account verified ✓"],
          target: { label: "Capture mandate", kind: "button", hint: "Validates RF-04, RF-05" },
        },
        validates: ["RF-04", "RF-05"],
        completion: "manual",
      },
      {
        appId: "fulfillment-app",
        page: "/disburse",
        title: "Release funds",
        instruction:
          "Click Disburse. For amounts > $100k, the system will apply a 24h hold automatically.",
        preview: {
          page: "Book APP-22481 · Release funds",
          path: "/disburse",
          context: ["E-signature ✓", "Account ✓", "Auto-debit ✓"],
          target: { label: "Disburse $15,000", kind: "button", hint: ">$100k = 24h hold (RF-03)" },
        },
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
        preview: {
          page: "Review APP-22481 · Income & employment",
          path: "/review",
          context: ["Ratio 5.3× > 5.0× cap"],
          target: { label: "Reviewer notes", kind: "input", hint: "Document the breach" },
        },
        completion: "manual",
      },
      {
        appId: "intake-app",
        page: "/review",
        title: "Choose remediation",
        instruction: "Pick: (a) ask member to reduce amount, or (b) request additional income docs.",
        preview: {
          page: "Review APP-22481 · Decision",
          path: "/review",
          context: ["Forward to risk (blocked)"],
          target: { label: "Return to applicant", kind: "button", hint: "Sends notification" },
        },
        completion: "click",
      },
      {
        appId: "member-portal",
        page: "/apply",
        title: "Member adjusts application (Member Portal)",
        instruction:
          "Member receives notification and opens the portal to reduce the amount or upload additional income proof.",
        preview: {
          page: "Apply for a loan · Loan details",
          path: "/apply",
          context: ["Term", "Purpose"],
          target: { label: "Amount requested (USD)", kind: "input", hint: "Reduce to meet 5× cap" },
        },
        navigateUrl: `${APP_URLS["member-portal"]}/apply`,
        completion: "manual",
      },
      {
        appId: "intake-app",
        page: "/review",
        title: "Re-verify",
        instruction: "Re-run the ratio check once the member responds.",
        preview: {
          page: "Review APP-22481 · Income & employment",
          path: "/review",
          context: ["Amended amount received"],
          target: { label: "Check ratios", kind: "button", hint: "Should now pass RI-06" },
        },
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
        preview: {
          page: "Review APP-22481 · Documents",
          path: "/review",
          context: ["Uploaded 120 days ago"],
          target: { label: "Address proof · Request new", kind: "button", hint: "RI-04 failed" },
        },
        completion: "click",
      },
      {
        appId: "member-portal",
        page: "/apply",
        title: "Member uploads new address proof (Member Portal)",
        instruction: "Member opens portal and uploads a utility bill dated within 90 days.",
        preview: {
          page: "Apply for a loan · Documents",
          path: "/apply",
          context: ["Government ID ✓", "Proof of income ✓"],
          target: { label: "Address proof", kind: "doc-upload", hint: "Utility bill < 90 days" },
        },
        navigateUrl: `${APP_URLS["member-portal"]}/apply`,
        completion: "manual",
      },
      {
        appId: "intake-app",
        page: "/review",
        title: "Re-verify",
        instruction: "Confirm new document and continue intake.",
        preview: {
          page: "Review APP-22481 · Documents",
          path: "/review",
          context: ["New doc received"],
          target: { label: "Address proof · Verify", kind: "card", hint: "Validates RI-04" },
        },
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
        preview: {
          page: "Review APP-22481 · Documents",
          path: "/review",
          target: { label: "Flag as illegible", kind: "button", hint: "Notifies member" },
        },
        completion: "click",
      },
      {
        appId: "member-portal",
        page: "/apply",
        title: "Member re-uploads (Member Portal)",
        instruction: "Member retakes the photo / scan and re-uploads.",
        preview: {
          page: "Apply for a loan · Documents",
          path: "/apply",
          context: ["Address proof ✓"],
          target: { label: "Government ID · Re-upload", kind: "doc-upload", hint: "Must be legible" },
        },
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
        preview: {
          page: "Apply for a loan · Documents",
          path: "/apply",
          context: ["Three checkboxes — all required"],
          target: { label: "Government ID / Income / Address", kind: "doc-upload", hint: "All three are required" },
        },
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
        preview: {
          page: "Underwrite APP-22481 · Credit report",
          path: "/decision",
          context: ["Score 587 < 600 floor"],
          target: { label: "Adverse-action notes", kind: "input", hint: "Legal text required" },
        },
        completion: "manual",
      },
      {
        appId: "risk-app",
        page: "/decision",
        title: "Offer secured alternative",
        instruction: "Counter with a secured-loan offer at adjusted pricing.",
        preview: {
          page: "Underwrite APP-22481 · Decision",
          path: "/decision",
          context: ["Decline", "Approve (blocked)"],
          target: { label: "Counter-offer (secured)", kind: "button", hint: "Routes to member" },
        },
        completion: "click",
      },
      {
        appId: "member-portal",
        page: "/apply",
        title: "Member reviews alternative (Member Portal)",
        instruction: "Member receives counter-offer and accepts or declines via portal.",
        preview: {
          page: "Loan offer · Counter",
          path: "/offer",
          context: ["Original: $15,000 unsecured", "Counter: $10,000 secured @ 13%"],
          target: { label: "Accept counter / Decline", kind: "button", hint: "Member's choice" },
        },
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
        preview: {
          page: "Underwrite APP-22481 · Ratios",
          path: "/decision",
          context: ["Existing DTI 32% + new loan = 47%"],
          target: { label: "DTI breakdown · 47% > 43% cap", kind: "validation", hint: "Reg Z fail" },
        },
        completion: "manual",
      },
      {
        appId: "risk-app",
        page: "/decision",
        title: "Pick remediation",
        instruction:
          "Choose: extend term, reduce amount, or require debt consolidation as a condition.",
        preview: {
          page: "Underwrite APP-22481 · Decision",
          path: "/decision",
          context: ["Extend term", "Decline"],
          target: { label: "Counter-offer with consolidation", kind: "button", hint: "Conditional approval" },
        },
        completion: "click",
      },
      {
        appId: "member-portal",
        page: "/apply",
        title: "Member accepts adjusted terms (Member Portal)",
        instruction: "Member opens portal and accepts new amount/term or consolidation condition.",
        preview: {
          page: "Loan offer · Adjusted terms",
          path: "/offer",
          context: ["Old: $15,000 / 36mo", "New: $12,000 / 48mo + consolidation"],
          target: { label: "Accept adjusted offer", kind: "button", hint: "Member's choice" },
        },
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
        preview: {
          page: "Book APP-22481 · E-signature",
          path: "/disburse",
          context: ["RF-01 failed"],
          target: { label: "Send e-sign request", kind: "button", hint: "DocuSign envelope" },
        },
        completion: "click",
      },
      {
        appId: "member-portal",
        page: "/apply",
        title: "Member signs (Member Portal)",
        instruction: "Member opens portal, sees signature request, and e-signs.",
        preview: {
          page: "Pending signatures",
          path: "/signatures",
          context: ["Loan agreement — 3 pages"],
          target: { label: "Sign loan agreement", kind: "button", hint: "Embedded DocuSign" },
        },
        navigateUrl: `${APP_URLS["member-portal"]}/apply`,
        completion: "manual",
      },
      {
        appId: "fulfillment-app",
        page: "/disburse",
        title: "Confirm signature on file",
        instruction: "Re-check e-signature status before disbursing.",
        preview: {
          page: "Book APP-22481 · E-signature",
          path: "/disburse",
          context: ["DocuSign status: completed"],
          target: { label: "Mark as e-signed", kind: "button", hint: "Validates RF-01" },
        },
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
        preview: {
          page: "Book APP-22481 · Disbursement account",
          path: "/disburse",
          context: ["Account •••4421 unverified"],
          target: { label: "Send micro-deposits", kind: "button", hint: "Two small deposits" },
        },
        completion: "click",
      },
      {
        appId: "member-portal",
        page: "/apply",
        title: "Member confirms deposit amounts (Member Portal)",
        instruction: "Member receives two small deposits and enters the amounts on the portal.",
        preview: {
          page: "Verify bank account",
          path: "/verify-bank",
          context: ["Two deposits sent · check your statement"],
          target: { label: "Enter the two amounts", kind: "input", hint: "e.g. $0.32, $0.17" },
        },
        navigateUrl: `${APP_URLS["member-portal"]}/apply`,
        completion: "manual",
      },
      {
        appId: "fulfillment-app",
        page: "/disburse",
        title: "Confirm verification",
        instruction: "Bank account is now verified; proceed to disburse.",
        preview: {
          page: "Book APP-22481 · Disbursement account",
          path: "/disburse",
          context: ["Status: verified ✓"],
          target: { label: "Mark verified", kind: "button", hint: "Validates RF-02" },
        },
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
