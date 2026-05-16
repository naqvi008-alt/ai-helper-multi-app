import { useState } from "react";
import HelperWidget from "@shared/helper-sdk/HelperWidget";
import Dashboard from "./pages/Dashboard";
import Apply from "./pages/Apply";

type Page = "dashboard" | "apply";

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");

  return (
    <div className="app-shell">
      <header className="app-bar member">
        <div className="brand">
          Acme CU
          <small>Member Portal · :5174</small>
        </div>
        <button
          className={`nav-link ${page === "dashboard" ? "active" : ""}`}
          onClick={() => setPage("dashboard")}
        >
          Dashboard
        </button>
        <button
          className={`nav-link ${page === "apply" ? "active" : ""}`}
          data-tour="nav-apply"
          onClick={() => setPage("apply")}
        >
          Apply for a loan
        </button>
        <div className="spacer" />
        <span className="pill">Signed in as · Jane Member</span>
      </header>

      <main className="content">
        {page === "dashboard" && <Dashboard onApply={() => setPage("apply")} />}
        {page === "apply" && <Apply />}
      </main>

      <HelperWidget appId="member-portal" appName="Member Portal" />
    </div>
  );
}
