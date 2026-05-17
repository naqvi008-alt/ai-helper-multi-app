import type { AppId, StepPreview as StepPreviewData } from "../types";

type Props = {
  appId: AppId;
  preview: StepPreviewData;
};

const APP_LABELS: Record<AppId, { name: string; short: string; tone: string }> = {
  "member-portal": { name: "Acme CU · Member Portal", short: "member", tone: "blue" },
  "intake-app": { name: "Acme CU · Intake", short: "intake", tone: "green" },
  "risk-app": { name: "Acme CU · Risk", short: "risk", tone: "orange" },
  "fulfillment-app": { name: "Acme CU · Fulfillment", short: "fulfill", tone: "violet" },
};

/**
 * Renders a stylized "screenshot" of a target page inside the chat panel.
 * No DOM interaction with the host app — purely a presentation layer driven
 * by structured data in the workflow KB.
 *
 * This lets the helper reference any app (including a member-facing site)
 * regardless of which app the user is currently looking at.
 */
export default function StepPreview({ appId, preview }: Props) {
  const meta = APP_LABELS[appId];
  const kind = preview.target.kind ?? "card";

  return (
    <div className={`preview preview-${meta.tone}`}>
      {/* Fake browser chrome */}
      <div className="preview-chrome">
        <span className="preview-dot preview-dot-r" />
        <span className="preview-dot preview-dot-y" />
        <span className="preview-dot preview-dot-g" />
        <div className="preview-url">
          <span className="preview-url-host">{meta.short}.acmecu.com</span>
          {preview.path && <span className="preview-url-path">{preview.path}</span>}
        </div>
      </div>

      {/* App brand bar */}
      <div className="preview-appbar">
        <span className="preview-brand-dot" />
        <span className="preview-brand">{meta.name}</span>
      </div>

      {/* Page body */}
      <div className="preview-body">
        <div className="preview-page-title">{preview.page}</div>

        {preview.context?.map((c) => (
          <div key={c} className="preview-context">
            {c}
          </div>
        ))}

        <div className={`preview-target preview-target-${kind}`}>
          <div className="preview-target-row">
            <span className="preview-target-label">{preview.target.label}</span>
            <span className="preview-target-kind">{kindIcon(kind)}</span>
          </div>
          {preview.target.hint && (
            <div className="preview-target-hint">↑ {preview.target.hint}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function kindIcon(kind: string): string {
  switch (kind) {
    case "input":
      return "✎";
    case "button":
      return "►";
    case "nav":
      return "≡";
    case "table":
      return "▦";
    case "doc-upload":
      return "📎";
    case "validation":
      return "!";
    default:
      return "◇";
  }
}
