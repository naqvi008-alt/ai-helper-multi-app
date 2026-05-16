import { useState } from "react";
import HelperWidget from "@shared/helper-sdk/HelperWidget";
import Queue from "./pages/Queue";
import Disburse from "./pages/Disburse";

type Page = "queue" | "disburse";

export default function App() {
  const [page, setPage] = useState<Page>("queue");
  const [selectedApp, setSelectedApp] = useState<string | null>(null);

  return (
    <div className="app-shell">
      <header className="app-bar fulfillment">
        <div className="brand">
          Acme CU
          <small>Fulfillment · :5177</small>
        </div>
        <button
          className={`nav-link ${page === "queue" ? "active" : ""}`}
          data-tour="nav-queue"
          onClick={() => setPage("queue")}
        >
          Queue
        </button>
        <button
          className={`nav-link ${page === "disburse" ? "active" : ""}`}
          data-tour="nav-disburse"
          onClick={() => setPage("disburse")}
        >
          Disburse
        </button>
        <div className="spacer" />
        <span className="pill">Signed in as · Dana Booking</span>
      </header>

      <main className="content">
        {page === "queue" && (
          <Queue
            onOpen={(id) => {
              setSelectedApp(id);
              setPage("disburse");
            }}
          />
        )}
        {page === "disburse" && (
          <Disburse appId={selectedApp} onBack={() => setPage("queue")} />
        )}
      </main>

      <HelperWidget appId="fulfillment-app" appName="Fulfillment" />
    </div>
  );
}
