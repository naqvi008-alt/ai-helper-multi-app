import { useState } from "react";
import type { ErrorReport } from "@shared/types";

type Errors = Partial<Record<keyof Form, string>>;
type Form = {
  fullName: string;
  dob: string;
  idNumber: string;
  incomeSource: string;
  annualIncome: string;
  loanPurpose: string;
  amount: string;
  termMonths: string;
  email: string;
  phone: string;
  docsId: boolean;
  docsIncome: boolean;
  docsAddress: boolean;
};

const blank: Form = {
  fullName: "",
  dob: "",
  idNumber: "",
  incomeSource: "",
  annualIncome: "",
  loanPurpose: "",
  amount: "",
  termMonths: "",
  email: "",
  phone: "",
  docsId: false,
  docsIncome: false,
  docsAddress: false,
};

function validate(f: Form): { errors: Errors; firstBadRule?: string; firstBadField?: keyof Form } {
  const e: Errors = {};
  let firstRule: string | undefined;
  let firstField: keyof Form | undefined;
  const fail = (field: keyof Form, msg: string, rule: string) => {
    e[field] = msg;
    if (!firstRule) {
      firstRule = rule;
      firstField = field;
    }
  };

  if (!f.fullName.trim()) fail("fullName", "Full name is required.", "RM-01");

  if (!f.dob) {
    fail("dob", "Date of birth is required.", "RM-01");
  } else {
    const age =
      (Date.now() - new Date(f.dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    if (age < 18) fail("dob", "You must be 18 or older.", "RM-01");
  }

  if (!/^\d{3}-\d{2}-\d{4}$/.test(f.idNumber.trim()))
    fail("idNumber", "Format: XXX-XX-XXXX", "RM-02");

  if (!f.incomeSource) fail("incomeSource", "Required.", "RM-03");
  const income = parseFloat(f.annualIncome);
  if (!f.annualIncome || isNaN(income) || income <= 0)
    fail("annualIncome", "Enter an annual income > 0.", "RM-04");

  const amt = parseFloat(f.amount);
  if (!f.amount || isNaN(amt) || amt < 1000 || amt > 250000)
    fail("amount", "Amount must be $1,000–$250,000.", "RM-05");

  const term = parseInt(f.termMonths, 10);
  if (!f.termMonths || isNaN(term) || term < 12 || term > 84)
    fail("termMonths", "Term must be 12–84 months.", "RM-06");

  if (!f.loanPurpose) fail("loanPurpose", "Pick a purpose.", "RM-07");

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim()))
    fail("email", "Enter a valid email.", "RM-08");
  if (!/^[\d\s\-()+]{7,}$/.test(f.phone.trim()))
    fail("phone", "Enter a valid phone number.", "RM-09");

  if (!(f.docsId && f.docsIncome && f.docsAddress))
    fail("docsId", "Upload all three required documents.", "RM-10");

  return { errors: e, firstBadRule: firstRule, firstBadField: firstField };
}

export default function Apply() {
  const [f, setF] = useState<Form>(blank);
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState<null | string>(null);

  function set<K extends keyof Form>(k: K, v: Form[K]) {
    setF((prev) => ({ ...prev, [k]: v }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { errors: errs, firstBadRule, firstBadField } = validate(f);
    setErrors(errs);

    if (Object.keys(errs).length > 0 && firstBadRule && firstBadField) {
      // Map rule → suggested recovery workflow
      const recoveryByRule: Record<string, string> = {
        "RM-10": "wf-r-docs-missing",
      };
      const detail: ErrorReport = {
        code: firstBadRule,
        appId: "member-portal",
        message: `Validation failed on rule ${firstBadRule}`,
        suggestedWorkflowId: recoveryByRule[firstBadRule] ?? "wf-member-apply",
        anchorSelector: `[data-tour='apply-${firstBadField}']`,
      };
      window.dispatchEvent(new CustomEvent<ErrorReport>("helper:error", { detail }));
      return;
    }

    window.dispatchEvent(new CustomEvent("helper:clear-error"));
    setSubmitted(`APP-${Math.floor(10000 + Math.random() * 89999)}`);
    setF(blank);
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Apply for a loan</h1>
        <p className="page-subtitle">
          Most applications take about 10 minutes. We'll let you know within 1 business
          day.
        </p>
      </div>

      {submitted && (
        <div className="banner banner-success">
          Application <strong>{submitted}</strong> submitted. We've notified our intake
          team — track status from your dashboard.
        </div>
      )}

      <form className="card" onSubmit={onSubmit} data-tour="apply-form" noValidate>
        <h3>Personal info</h3>
        <div className="grid-2">
          <div className={`field ${errors.fullName ? "has-error" : ""}`}>
            <label>Full name</label>
            <input
              data-tour="apply-fullName"
              value={f.fullName}
              onChange={(e) => set("fullName", e.target.value)}
              placeholder="Jane Member"
            />
            {errors.fullName && <span className="error">{errors.fullName}</span>}
          </div>
          <div className={`field ${errors.dob ? "has-error" : ""}`}>
            <label>Date of birth</label>
            <input
              type="date"
              data-tour="apply-dob"
              value={f.dob}
              onChange={(e) => set("dob", e.target.value)}
            />
            {errors.dob && <span className="error">{errors.dob}</span>}
          </div>
          <div className={`field ${errors.idNumber ? "has-error" : ""}`}>
            <label>Government ID (SSN)</label>
            <input
              data-tour="apply-idNumber"
              value={f.idNumber}
              onChange={(e) => set("idNumber", e.target.value)}
              placeholder="XXX-XX-XXXX"
            />
            {errors.idNumber && <span className="error">{errors.idNumber}</span>}
            <span className="hint">Format: XXX-XX-XXXX. Required for KYC.</span>
          </div>
          <div className={`field ${errors.incomeSource ? "has-error" : ""}`}>
            <label>Income source</label>
            <select
              data-tour="apply-incomeSource"
              value={f.incomeSource}
              onChange={(e) => set("incomeSource", e.target.value)}
            >
              <option value="">Select…</option>
              <option>Employed</option>
              <option>Self-employed</option>
              <option>Retired</option>
              <option>Other</option>
            </select>
            {errors.incomeSource && <span className="error">{errors.incomeSource}</span>}
          </div>
          <div className={`field ${errors.annualIncome ? "has-error" : ""}`}>
            <label>Annual income (USD)</label>
            <input
              data-tour="apply-annualIncome"
              value={f.annualIncome}
              onChange={(e) => set("annualIncome", e.target.value)}
              placeholder="75000"
            />
            {errors.annualIncome && <span className="error">{errors.annualIncome}</span>}
          </div>
        </div>

        <h3 style={{ marginTop: 24 }}>Loan details</h3>
        <div className="grid-2">
          <div className={`field ${errors.loanPurpose ? "has-error" : ""}`}>
            <label>Loan purpose</label>
            <select
              data-tour="apply-loanPurpose"
              value={f.loanPurpose}
              onChange={(e) => set("loanPurpose", e.target.value)}
            >
              <option value="">Select…</option>
              <option>Personal</option>
              <option>Auto</option>
              <option>Home</option>
              <option>Business</option>
            </select>
            {errors.loanPurpose && <span className="error">{errors.loanPurpose}</span>}
          </div>
          <div className={`field ${errors.amount ? "has-error" : ""}`}>
            <label>Amount requested (USD)</label>
            <input
              data-tour="apply-amount"
              value={f.amount}
              onChange={(e) => set("amount", e.target.value)}
              placeholder="15000"
            />
            {errors.amount && <span className="error">{errors.amount}</span>}
            <span className="hint">$1,000 to $250,000</span>
          </div>
          <div className={`field ${errors.termMonths ? "has-error" : ""}`}>
            <label>Term (months)</label>
            <input
              data-tour="apply-termMonths"
              value={f.termMonths}
              onChange={(e) => set("termMonths", e.target.value)}
              placeholder="36"
            />
            {errors.termMonths && <span className="error">{errors.termMonths}</span>}
            <span className="hint">12 to 84 months</span>
          </div>
        </div>

        <h3 style={{ marginTop: 24 }}>Contact</h3>
        <div className="grid-2">
          <div className={`field ${errors.email ? "has-error" : ""}`}>
            <label>Email</label>
            <input
              data-tour="apply-email"
              value={f.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="jane@example.com"
            />
            {errors.email && <span className="error">{errors.email}</span>}
          </div>
          <div className={`field ${errors.phone ? "has-error" : ""}`}>
            <label>Phone</label>
            <input
              data-tour="apply-phone"
              value={f.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="(555) 123-4567"
            />
            {errors.phone && <span className="error">{errors.phone}</span>}
          </div>
        </div>

        <h3 style={{ marginTop: 24 }}>Documents</h3>
        <div className="card" data-tour="apply-docs" style={{ boxShadow: "none", background: "var(--surface-2)" }}>
          <p className="page-subtitle" style={{ marginTop: 0 }}>
            Check the boxes to simulate uploading each document.
          </p>
          <label className="row" style={{ gap: 8 }}>
            <input
              type="checkbox"
              checked={f.docsId}
              onChange={(e) => set("docsId", e.target.checked)}
            />
            Government-issued ID
          </label>
          <label className="row" style={{ gap: 8, marginTop: 6 }}>
            <input
              type="checkbox"
              checked={f.docsIncome}
              onChange={(e) => set("docsIncome", e.target.checked)}
            />
            Proof of income (paystub / tax return)
          </label>
          <label className="row" style={{ gap: 8, marginTop: 6 }}>
            <input
              type="checkbox"
              checked={f.docsAddress}
              onChange={(e) => set("docsAddress", e.target.checked)}
            />
            Address proof (utility bill, dated within 90 days)
          </label>
          {errors.docsId && <div className="error" style={{ marginTop: 8 }}>{errors.docsId}</div>}
        </div>

        <div className="row" style={{ marginTop: 20 }}>
          <div className="spacer" />
          <button type="submit" className="btn btn-primary" data-tour="apply-submit">
            Submit application
          </button>
        </div>
      </form>
    </>
  );
}
