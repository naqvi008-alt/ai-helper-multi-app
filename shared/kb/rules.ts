import type { BusinessRule } from "../types.js";

/**
 * 35 business rules spanning all 4 apps in the loan onboarding process.
 * Rule IDs follow R{appPrefix}-{number}:
 *   RM = Member Portal, RI = Intake, RR = Risk, RF = Fulfillment
 */
export const rules: BusinessRule[] = [
  // ──────────────── Member Portal (RM-01 … RM-10) ────────────────
  {
    id: "RM-01",
    appId: "member-portal",
    category: "eligibility",
    title: "Minimum age 18",
    description: "Applicant must be 18 years or older at time of application.",
    severity: "block",
    remediation: "Confirm date of birth on the Personal Info step.",
  },
  {
    id: "RM-02",
    appId: "member-portal",
    category: "eligibility",
    title: "Valid government ID number",
    description: "National ID / SSN must match the expected format for the country.",
    severity: "block",
    remediation: "Re-enter your ID number in the format XXX-XX-XXXX.",
  },
  {
    id: "RM-03",
    appId: "member-portal",
    category: "eligibility",
    title: "Income source required",
    description: "Applicant must declare a primary income source (Employed / Self-employed / Other).",
    severity: "block",
    remediation: "Select your income source on the Personal Info step.",
  },
  {
    id: "RM-04",
    appId: "member-portal",
    category: "eligibility",
    title: "Annual income greater than zero",
    description: "Annual income must be a positive number.",
    severity: "block",
    remediation: "Enter your gross annual income in USD.",
  },
  {
    id: "RM-05",
    appId: "member-portal",
    category: "eligibility",
    title: "Loan amount within bounds",
    description: "Requested loan amount must be between $1,000 and $250,000.",
    severity: "block",
    remediation: "Adjust the requested amount to fall within $1,000–$250,000.",
  },
  {
    id: "RM-06",
    appId: "member-portal",
    category: "eligibility",
    title: "Loan term within range",
    description: "Loan term must be between 12 and 84 months.",
    severity: "block",
    remediation: "Select a term between 12 and 84 months.",
  },
  {
    id: "RM-07",
    appId: "member-portal",
    category: "eligibility",
    title: "Loan purpose declared",
    description: "A loan purpose must be selected (Personal / Auto / Home / Business).",
    severity: "block",
    remediation: "Choose a loan purpose from the dropdown.",
  },
  {
    id: "RM-08",
    appId: "member-portal",
    category: "kyc",
    title: "Verified email",
    description: "Email must be a valid format and verified via OTP.",
    severity: "block",
    remediation: "Open the email we sent and click the verification link.",
  },
  {
    id: "RM-09",
    appId: "member-portal",
    category: "kyc",
    title: "Verified phone number",
    description: "Phone must be a valid format and verified via SMS OTP.",
    severity: "block",
    remediation: "Enter the 6-digit code we texted to your phone.",
  },
  {
    id: "RM-10",
    appId: "member-portal",
    category: "documents",
    title: "Required documents uploaded",
    description: "Government ID, proof of income, and address proof must all be uploaded.",
    severity: "block",
    remediation: "Upload all three documents on the Documents step.",
    recoveryWorkflowId: "wf-r-docs-missing",
  },

  // ──────────────── Intake (RI-01 … RI-10) ────────────────
  {
    id: "RI-01",
    appId: "intake-app",
    category: "kyc",
    title: "Identity document matches application",
    description: "Name, DOB, and ID number on uploaded ID must match the application form.",
    severity: "block",
    remediation: "If there's a mismatch, return the application to the applicant for correction.",
  },
  {
    id: "RI-02",
    appId: "intake-app",
    category: "compliance",
    title: "AML watchlist clear",
    description: "Applicant must not appear on the AML / OFAC watchlist.",
    severity: "block",
    remediation: "Escalate to compliance team — do not proceed.",
  },
  {
    id: "RI-03",
    appId: "intake-app",
    category: "compliance",
    title: "PEP screening",
    description:
      "If applicant is a Politically Exposed Person, enhanced due diligence is required before proceeding.",
    severity: "warn",
    remediation: "Attach EDD checklist and route to senior intake officer.",
  },
  {
    id: "RI-04",
    appId: "intake-app",
    category: "documents",
    title: "Address proof recency",
    description: "Address proof document must be dated within the last 90 days.",
    severity: "block",
    remediation: "Request a fresh utility bill or bank statement from the applicant.",
    recoveryWorkflowId: "wf-r-address-stale",
  },
  {
    id: "RI-05",
    appId: "intake-app",
    category: "credit",
    title: "No existing delinquencies",
    description:
      "No existing account with this credit union may be in delinquency over 30 days.",
    severity: "block",
    remediation:
      "Applicant must bring delinquent accounts current before a new application can proceed.",
  },
  {
    id: "RI-06",
    appId: "intake-app",
    category: "credit",
    title: "Loan-to-income ratio",
    description:
      "Personal loan amount must not exceed 5x stated annual income (4x for home, 6x for business).",
    severity: "block",
    remediation: "Reduce loan amount OR provide additional income documentation.",
    recoveryWorkflowId: "wf-r-income-ratio",
  },
  {
    id: "RI-07",
    appId: "intake-app",
    category: "credit",
    title: "Employment tenure",
    description: "Employed applicants must have ≥ 6 months at current employer.",
    severity: "warn",
    remediation:
      "If tenure < 6 months, require co-signer or previous employer reference letter.",
  },
  {
    id: "RI-08",
    appId: "intake-app",
    category: "documents",
    title: "Self-employed income proof",
    description:
      "Self-employed applicants must provide 2 years of tax returns (Schedule C/1120).",
    severity: "block",
    remediation: "Request prior years' tax returns from applicant.",
  },
  {
    id: "RI-09",
    appId: "intake-app",
    category: "kyc",
    title: "Joint application co-applicant",
    description:
      "Joint applications require complete personal info and KYC for the co-applicant.",
    severity: "block",
    remediation: "Open the Co-applicant tab and complete missing fields.",
  },
  {
    id: "RI-10",
    appId: "intake-app",
    category: "documents",
    title: "Document quality",
    description: "Uploaded documents must be legible (no blur, all corners visible, ≥ 300 DPI).",
    severity: "block",
    remediation: "Request re-upload from applicant via portal.",
    recoveryWorkflowId: "wf-r-doc-quality",
  },

  // ──────────────── Risk (RR-01 … RR-10) ────────────────
  {
    id: "RR-01",
    appId: "risk-app",
    category: "credit",
    title: "Minimum credit score",
    description:
      "Credit score must meet product floor: Personal ≥ 600, Home ≥ 650, Business ≥ 700.",
    severity: "block",
    remediation:
      "If below floor, offer secured alternative or decline. Document reason for adverse action notice.",
    recoveryWorkflowId: "wf-r-credit-floor",
  },
  {
    id: "RR-02",
    appId: "risk-app",
    category: "credit",
    title: "Debt-to-income ratio",
    description: "DTI (including this loan) must not exceed 43%.",
    severity: "block",
    remediation:
      "Reduce loan amount, extend term, or require debt consolidation prior to approval.",
    recoveryWorkflowId: "wf-r-dti",
  },
  {
    id: "RR-03",
    appId: "risk-app",
    category: "credit",
    title: "Loan-to-value (secured)",
    description: "LTV must not exceed 80% for secured loans (90% with PMI for home).",
    severity: "block",
    remediation: "Require larger down payment or revise collateral valuation.",
  },
  {
    id: "RR-04",
    appId: "risk-app",
    category: "credit",
    title: "Probability-of-default threshold",
    description: "PD model score must be below the product-specific threshold.",
    severity: "block",
    remediation: "Escalate to manual underwriting if borderline.",
  },
  {
    id: "RR-05",
    appId: "risk-app",
    category: "credit",
    title: "Manual underwriting trigger",
    description:
      "Credit scores between 600 and 649 require manual underwriter review and signoff.",
    severity: "warn",
    remediation: "Open the Manual Review panel and add reviewer notes before deciding.",
  },
  {
    id: "RR-06",
    appId: "risk-app",
    category: "credit",
    title: "Collateral valuation",
    description:
      "Secured loans require third-party collateral valuation within the last 30 days.",
    severity: "block",
    remediation: "Order or attach a fresh appraisal.",
  },
  {
    id: "RR-07",
    appId: "risk-app",
    category: "pricing",
    title: "Risk-based pricing tiers",
    description:
      "Interest rate must match the risk tier: A (740+) 6.5%, B (700-739) 8.0%, C (660-699) 10.5%, D (600-659) 13.0%.",
    severity: "block",
    remediation: "Use the auto-priced rate; manual overrides require manager approval.",
  },
  {
    id: "RR-08",
    appId: "risk-app",
    category: "operations",
    title: "Approval authority limits",
    description:
      "< $50k: auto-approve if all checks pass. $50k–$150k: branch manager. > $150k: credit committee.",
    severity: "block",
    remediation: "Route to the correct approver based on amount.",
  },
  {
    id: "RR-09",
    appId: "risk-app",
    category: "credit",
    title: "Counter-offer policy",
    description: "Counter-offers must not exceed 80% of the originally requested amount.",
    severity: "warn",
    remediation: "Calculate counter-offer using the pricing tool, then notify applicant.",
  },
  {
    id: "RR-10",
    appId: "risk-app",
    category: "credit",
    title: "Debt consolidation condition",
    description:
      "If existing unsecured debt > $10,000, approval may be conditioned on consolidating that debt.",
    severity: "info",
    remediation: "Attach a consolidation condition to the loan and notify fulfillment.",
  },

  // ──────────────── Fulfillment (RF-01 … RF-05) ────────────────
  {
    id: "RF-01",
    appId: "fulfillment-app",
    category: "operations",
    title: "Signed loan agreement on file",
    description: "Member must e-sign or wet-sign the loan agreement before booking.",
    severity: "block",
    remediation: "Send e-signature request via DocuSign. Verify completion before disbursing.",
    recoveryWorkflowId: "wf-r-esign",
  },
  {
    id: "RF-02",
    appId: "fulfillment-app",
    category: "operations",
    title: "Verified disbursement account",
    description:
      "Disbursement bank account must be verified via micro-deposit or instant verification.",
    severity: "block",
    remediation: "Request member complete account verification on member portal.",
    recoveryWorkflowId: "wf-r-bank-verify",
  },
  {
    id: "RF-03",
    appId: "fulfillment-app",
    category: "compliance",
    title: "High-value disbursement hold",
    description: "Disbursements > $100,000 require a 24-hour clearing hold per AML policy.",
    severity: "block",
    remediation: "Schedule disbursement for next-business-day +24h; notify member.",
  },
  {
    id: "RF-04",
    appId: "fulfillment-app",
    category: "operations",
    title: "Auto-debit mandate required",
    description: "An active ACH auto-debit mandate must be in place before first disbursement.",
    severity: "block",
    remediation: "Capture mandate on the Auto-debit setup step.",
  },
  {
    id: "RF-05",
    appId: "fulfillment-app",
    category: "operations",
    title: "First payment date",
    description: "First payment must be scheduled 30 days after funding date.",
    severity: "warn",
    remediation: "Confirm date is auto-populated correctly; adjust only with exception approval.",
  },
];

export function getRule(id: string) {
  return rules.find((r) => r.id === id);
}
