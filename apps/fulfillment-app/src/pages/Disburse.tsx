import { useState } from "react";
import type { ErrorReport } from "@shared/types";

type Props = { appId: string | null; onBack: () => void };

export default function Disburse({ appId, onBack }: Props) {
  const [esigned, setEsigned] = useState(false);
  const [bankVerified, setBankVerified] = useState(false);
  const [autoDebit, setAutoDebit] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const app = {
    id: appId ?? "APP-22481",
    member: "Jane Member",
    amount: 15000,
  };

  function fireError(rule: string, suggestedWorkflowId: string, anchor: string, msg: string) {
    const detail: ErrorReport = {
      code: rule,
      appId: "fulfillment-app",
      message: msg,
      suggestedWorkflowId,
      anchorSelector: anchor,
    };
    window.dispatchEvent(new CustomEvent<ErrorReport>("helper:error", { detail }));
  }

  function disburse() {
    if (!esigned) {
      fireError(
        "RF-01",
        "wf-r-esign",
        "[data-tour='esign-check']",
        "Member has not e-signed the loan agreement."
      );
      return;
    }
    if (!bankVerified) {
      fireError(
        "RF-02",
        "wf-r-bank-verify",
        "[data-tour='bank-check']",
        "Disbursement bank account is not verified."
      );
      return;
    }
    if (!autoDebit) {
      fireError(
        "RF-04",
        "wf-fulfill-book",
        "[data-tour='auto-debit']",
        "Auto-debit mandate not captured."
      );
      return;
    }
    window.dispatchEvent(new CustomEvent("helper:clear-error"));
    if (app.amount > 100000) {
      setResult(
        `Disbursement of $${app.amount.toLocaleString()} scheduled with a 24h AML clearing hold (RF-03).`
      );
    } else {
      setResult(`$${app.amount.toLocaleString()} disbursed to verified account. Funded.`);
    }
  }

  return (
    <>
      <div className="page-header">
        <div className="row">
          <button className="btn btn-ghost" onClick={onBack}>
            ← Queue
          </button>
          <h1 className="page-title" style={{ margin: 0 }}>
            Book {app.id}
          </h1>
        </div>
        <p className="page-subtitle">
          {app.member} · ${app.amount.toLocaleString()}
        </p>
      </div>

      {result && <div className="banner banner-success">{result}</div>}

      <div className="card" data-tour="esign-check">
        <h3>E-signature</h3>
        <p className="page-subtitle" style={{ marginTop: 0 }}>
          Validates rule RF-01.
        </p>
        <div className="row">
          <span>{esigned ? "Member has signed. ✓" : "Not yet signed."}</span>
          <div className="spacer" />
          <button className="btn" onClick={() => setEsigned(true)} disabled={esigned}>
            Mark as e-signed
          </button>
        </div>
      </div>

      <div className="card" data-tour="bank-check">
        <h3>Disbursement account</h3>
        <p className="page-subtitle" style={{ marginTop: 0 }}>
          Validates rule RF-02.
        </p>
        <div className="row">
          <span>
            {bankVerified ? "Verified via micro-deposit. ✓" : "Awaiting verification."}
          </span>
          <div className="spacer" />
          <button
            className="btn"
            onClick={() => setBankVerified(true)}
            disabled={bankVerified}
          >
            Mark verified
          </button>
        </div>
      </div>

      <div className="card" data-tour="auto-debit">
        <h3>Auto-debit mandate</h3>
        <p className="page-subtitle" style={{ marginTop: 0 }}>
          Validates rules RF-04, RF-05.
        </p>
        <div className="row">
          <span>{autoDebit ? "Mandate captured. ✓" : "No mandate on file."}</span>
          <div className="spacer" />
          <button className="btn" onClick={() => setAutoDebit(true)} disabled={autoDebit}>
            Capture mandate
          </button>
        </div>
      </div>

      <div className="card">
        <h3>Release funds</h3>
        <div className="row">
          <div className="spacer" />
          <button className="btn btn-primary" data-tour="disburse" onClick={disburse}>
            Disburse ${app.amount.toLocaleString()}
          </button>
        </div>
      </div>
    </>
  );
}
