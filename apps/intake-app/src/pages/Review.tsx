import { useState } from "react";
import type { ErrorReport } from "@shared/types";

type Props = { appId: string | null; onBack: () => void };

type CheckState = "pending" | "running" | "pass" | "fail";

export default function Review({ appId, onBack }: Props) {
  const [kyc, setKyc] = useState<CheckState>("pending");
  const [addressOk, setAddressOk] = useState<CheckState>("pending");
  const [incomeOk, setIncomeOk] = useState<CheckState>("pending");
  const [decision, setDecision] = useState<string | null>(null);

  // Hardcoded application profile for the demo — represents the picked record.
  const app = {
    id: appId ?? "APP-22481",
    member: "Jane Member",
    purpose: "Personal",
    amount: 15000,
    income: 75000,
    addressProofAge: 120, // days — exceeds 90, will fail RI-04
    incomeTenureMonths: 14,
    selfEmployed: false,
  };

  function fireError(rule: string, suggestedWorkflowId: string, anchor: string, msg: string) {
    const detail: ErrorReport = {
      code: rule,
      appId: "intake-app",
      message: msg,
      suggestedWorkflowId,
      anchorSelector: anchor,
    };
    window.dispatchEvent(new CustomEvent<ErrorReport>("helper:error", { detail }));
  }

  function runKyc() {
    setKyc("running");
    setTimeout(() => {
      setKyc("pass");
    }, 700);
  }

  function checkAddress() {
    if (app.addressProofAge > 90) {
      setAddressOk("fail");
      fireError(
        "RI-04",
        "wf-r-address-stale",
        "[data-tour='doc-address']",
        "Address proof is older than 90 days."
      );
    } else {
      setAddressOk("pass");
    }
  }

  function checkIncome() {
    const ratio = app.amount / app.income;
    if (ratio > 5) {
      setIncomeOk("fail");
      fireError(
        "RI-06",
        "wf-r-income-ratio",
        "[data-tour='income-check']",
        `Loan-to-income ratio ${ratio.toFixed(1)}× exceeds 5× max.`
      );
    } else {
      setIncomeOk("pass");
    }
  }

  function forwardToRisk() {
    if (kyc !== "pass" || addressOk !== "pass" || incomeOk !== "pass") {
      fireError(
        "RI-99",
        "wf-intake-review",
        "[data-tour='forward-risk']",
        "Resolve all intake checks before forwarding to risk."
      );
      return;
    }
    window.dispatchEvent(new CustomEvent("helper:clear-error"));
    setDecision("Forwarded to Risk. Open the Risk app to continue.");
  }

  function pill(state: CheckState) {
    if (state === "pending") return <span className="tag-pill">Not started</span>;
    if (state === "running") return <span className="tag-pill tag-pill-info">Running…</span>;
    if (state === "pass") return <span className="tag-pill tag-pill-success">Pass</span>;
    return <span className="tag-pill tag-pill-danger">Fail</span>;
  }

  return (
    <>
      <div className="page-header">
        <div className="row">
          <button className="btn btn-ghost" onClick={onBack}>
            ← Queue
          </button>
          <h1 className="page-title" style={{ margin: 0 }}>
            Review {app.id}
          </h1>
        </div>
        <p className="page-subtitle">
          {app.member} · {app.purpose} · ${app.amount.toLocaleString()} · income $
          {app.income.toLocaleString()}/yr
        </p>
      </div>

      {decision && <div className="banner banner-success">{decision}</div>}

      <div className="card">
        <h3>KYC & screening</h3>
        <p className="page-subtitle" style={{ marginTop: 0 }}>
          Validates rules RI-01, RI-02, RI-03.
        </p>
        <div className="row">
          {pill(kyc)}
          <div className="spacer" />
          <button
            className="btn btn-primary"
            data-tour="kyc-run"
            disabled={kyc === "running"}
            onClick={runKyc}
          >
            Run KYC
          </button>
        </div>
      </div>

      <div className="card">
        <h3>Documents</h3>
        <p className="page-subtitle" style={{ marginTop: 0 }}>
          Validates rules RI-04, RI-10.
        </p>
        <div className="row" data-tour="doc-address">
          <span>Address proof — uploaded {app.addressProofAge} days ago</span>
          <div className="spacer" />
          {pill(addressOk)}
          <button className="btn" onClick={checkAddress}>
            Verify
          </button>
        </div>
      </div>

      <div className="card">
        <h3>Income & employment</h3>
        <p className="page-subtitle" style={{ marginTop: 0 }}>
          Validates rules RI-05, RI-06, RI-07, RI-08.
        </p>
        <div className="row" data-tour="income-check">
          <span>
            Loan/income ratio: {(app.amount / app.income).toFixed(2)}× · tenure{" "}
            {app.incomeTenureMonths}mo
          </span>
          <div className="spacer" />
          {pill(incomeOk)}
          <button className="btn" onClick={checkIncome}>
            Check
          </button>
        </div>
      </div>

      <div className="card">
        <h3>Decision</h3>
        <div className="row">
          <button className="btn" data-tour="remediation-choice">
            Return to applicant
          </button>
          <div className="spacer" />
          <button
            className="btn btn-primary"
            data-tour="forward-risk"
            onClick={forwardToRisk}
          >
            Forward to risk →
          </button>
        </div>
      </div>
    </>
  );
}
