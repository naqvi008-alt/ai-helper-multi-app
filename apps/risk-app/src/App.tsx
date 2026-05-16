import { useState } from "react";
import HelperWidget from "@shared/helper-sdk/HelperWidget";
import Queue from "./pages/Queue";
import Decision from "./pages/Decision";

type Page = "queue" | "decision";

export default function App() {
  const [page, setPage] = useState<Page>("queue");
  const [selectedApp, setSelectedApp] = useState<string | null>(null);

  return (
    <div className="app-shell">
      <header className="app-bar risk">
        <div className="brand">
          Acme CU
          <small>Risk · :5176</small>
        </div>
        <button
          className={`nav-link ${page === "queue" ? "active" : ""}`}
          data-tour="nav-queue"
          onClick={() => setPage("queue")}
        >
          Queue
        </button>
        <button
          className={`nav-link ${page === "decision" ? "active" : ""}`}
          data-tour="nav-decision"
          onClick={() => setPage("decision")}
        >
          Decision
        </button>
        <div className="spacer" />
        <span className="pill">Signed in as · Priya Underwriter</span>
      </header>

      <main className="content">
        {page === "queue" && (
          <Queue
            onOpen={(id) => {
              setSelectedApp(id);
              setPage("decision");
            }}
          />
        )}
        {page === "decision" && (
          <Decision appId={selectedApp} onBack={() => setPage("queue")} />
        )}
      </main>

      <HelperWidget appId="risk-app" appName="Risk" />
    </div>
  );
}
