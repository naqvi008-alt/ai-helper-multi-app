import { useState } from "react";
import HelperWidget from "@shared/helper-sdk/HelperWidget";
import Queue from "./pages/Queue";
import Review from "./pages/Review";

type Page = "queue" | "review";

export default function App() {
  const [page, setPage] = useState<Page>("queue");
  const [selectedApp, setSelectedApp] = useState<string | null>(null);

  return (
    <div className="app-shell">
      <header className="app-bar intake">
        <div className="brand">
          Acme CU
          <small>Intake · :5175</small>
        </div>
        <button
          className={`nav-link ${page === "queue" ? "active" : ""}`}
          data-tour="nav-queue"
          onClick={() => setPage("queue")}
        >
          Queue
        </button>
        <button
          className={`nav-link ${page === "review" ? "active" : ""}`}
          data-tour="nav-review"
          onClick={() => setPage("review")}
        >
          Review
        </button>
        <div className="spacer" />
        <span className="pill">Signed in as · Alex Intake</span>
      </header>

      <main className="content">
        {page === "queue" && (
          <Queue
            onOpen={(id) => {
              setSelectedApp(id);
              setPage("review");
            }}
          />
        )}
        {page === "review" && <Review appId={selectedApp} onBack={() => setPage("queue")} />}
      </main>

      <HelperWidget appId="intake-app" appName="Intake" />
    </div>
  );
}
