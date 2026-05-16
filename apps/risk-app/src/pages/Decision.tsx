import { useState } from "react";
import type { ErrorReport } from "@shared/types";

type Props = { appId: string | null; onBack: () => void };
type CheckState = "pending" | "running" | "pass" | "fail";

export default function Decision({ appId, onBack }: Props) {
  const [creditPulled, setCreditPulled] = useState(false);
  const [creditCheck, setCreditCheck] = useState<CheckState>("pending");
  const [ratiosCheck, setRatiosCheck] = useState<CheckState>("pending");
  const [pricingApplied, setPricingApplied] = useState(false);
  const [decision, setDecision] = useState<string | null>(null);

  // Demo profile — designed so DTI fails on first decision attempt.
  const app = {
    id: appId ?? "APP-22481",
    member: "Jane Member",
    amount: 15000,
    income: 75000,
    creditScore: 678,
    existingDti: 0.32,
    purpose: "Personal" as const,
    secured: false,
  };

  const monthlyPayment = (app.amount / 36) + 25; // rough estimate
  const proposedDtiAdd = (monthlyPayment * 12) / app.income;
  const totalDti = app.existingDti + proposedDtiAdd;
  const tier =
    app.creditScore >= 740 ? "A" : app.creditScore >= 700 ? "B" : app.creditScore >= 660 ? "C" : "D";
  const rate = { A: 6.5, B: 8.0, C: 10.5, D: 13.0 }[tier];

  function fireError(rule: string, suggestedWorkflowId: string, anchor: string, msg: string) {
    const detail: ErrorReport = {
      code: rule,
      appId: "risk-app",
      message: msg,
      suggestedWorkflowId,
      anchorSelector: anchor,
    };
    window.dispatchEvent(new CustomEvent<ErrorReport>("helper:error", { detail }));
  }

  function pullCredit() {
    setCreditPulled(true);
    if (app.creditScore < (app.purpose === "Personal" ? 600 : 650)) {
      setCreditCheck("fail");
      fireError(
        "RR-01",
        "wf-r-credit-floor",
        "[data-tour='pull-credit']",
        `Score ${app.creditScore} below product floor.`
      );
    } else {
      setCreditCheck("pass");
    }
  }

  function checkRatios() {
    if (totalDti > 0.43) {
      setRatiosCheck("fail");
      fireError(
        "RR-02",
        "wf-r-dti",
        "[data-tour='ratios']",
        `DTI ${(totalDti * 100).toFixed(0)}% exceeds 43% cap.`
      );
    } else {
      setRatiosCheck("pass");
    }
  }

  function applyPricing() {
    setPricingApplied(true);
  }

  function decide(verdict: "approve" | "counter" | "decline") {
    if (creditCheck !== "pass" || ratiosCheck !== "pass" || !pricingApplied) {
      fireError(
        "RR-99",
        "wf-risk-decision",
        "[data-tour='decide']",
        "Complete all checks and apply pricing before deciding."
      );
      return;
    }
    window.dispatchEvent(new CustomEvent("helper:clear-error"));
    setDecision(
      verdict === "approve"
        ? "Approved. Forwarded to Fulfillment app for booking."
        : verdict === "counter"
        ? "Counter-offer prepared. Member will be notified via portal."
        : "Declined with adverse-action notice queued."
    );
  }

  function pill(s: CheckState) {
    if (s === "pending") return <span className="tag-pill">Not started</span>;
    if (s === "running") return <span className="tag-pill tag-pill-info">Running…</span>;
    if (s === "pass") return <span className="tag-pill tag-pill-success">Pass</span>;
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
            Underwrite {app.id}
          </h1>
        </div>
        <p className="page-subtitle">
          {app.member} · ${app.amount.toLocaleString()} · {app.purpose}
        </p>
      </div>

      {decision && <div className="banner banner-success">{decision}</div>}

      <div className="card">
        <h3>Credit report</h3>
        <p className="page-subtitle" style={{ marginTop: 0 }}>
          Validates rule RR-01.
        </p>
        <div className="row" data-tour="pull-credit">
          <span>
            {creditPulled
              ? `Score: ${app.creditScore} · Tier ${tier}`
              : "Credit not yet pulled"}
          </span>
          <div className="spacer" />
          {pill(creditCheck)}
          <button className="btn btn-primary" onClick={pullCredit} disabled={creditPulled}>
            Pull credit
          </button>
        </div>
      </div>

      <div className="card">
        <h3>Ratios</h3>
        <p className="page-subtitle" style={{ marginTop: 0 }}>
          Validates RR-02, RR-03, RR-04.
        </p>
        <div className="row" data-tour="ratios">
          <span>
            DTI w/ new loan: {(totalDti * 100).toFixed(0)}% · LTV: n/a (unsecured)
          </span>
          <div className="spacer" />
          {pill(ratiosCheck)}
          <button className="btn" onClick={checkRatios}>
            Check ratios
          </button>
        </div>
      </div>

      <div className="card">
        <h3>Pricing</h3>
        <p className="page-subtitle" style={{ marginTop: 0 }}>
          Validates RR-07 (risk-based pricing).
        </p>
        <div className="row" data-tour="pricing">
          <span>
            Tier {tier} → suggested rate <strong>{rate.toFixed(2)}%</strong>
          </span>
          <div className="spacer" />
          {pricingApplied ? (
            <span className="tag-pill tag-pill-success">Applied</span>
          ) : (
            <span className="tag-pill">Not applied</span>
          )}
          <button className="btn" onClick={applyPricing} disabled={pricingApplied}>
            Apply tier pricing
          </button>
        </div>
      </div>

      <div className="card">
        <h3>Decision</h3>
        <div className="row" data-tour="decide">
          <button className="btn btn-danger" onClick={() => decide("decline")}>
            Decline
          </button>
          <button className="btn" onClick={() => decide("counter")}>
            Counter-offer
          </button>
          <div className="spacer" />
          <button className="btn btn-primary" onClick={() => decide("approve")}>
            Approve → Fulfillment
          </button>
        </div>
      </div>
    </>
  );
}
