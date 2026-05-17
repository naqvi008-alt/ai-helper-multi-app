export type AppId = "member-portal" | "intake-app" | "risk-app" | "fulfillment-app";

export type RuleSeverity = "block" | "warn" | "info";

export type BusinessRule = {
  id: string;
  appId: AppId;
  category:
    | "eligibility"
    | "kyc"
    | "documents"
    | "credit"
    | "pricing"
    | "operations"
    | "compliance";
  title: string;
  description: string;
  severity: RuleSeverity;
  remediation: string;
  recoveryWorkflowId?: string;
};

export type StepPreviewTargetKind =
  | "input"
  | "button"
  | "nav"
  | "table"
  | "doc-upload"
  | "card"
  | "validation";

/**
 * Structured "screenshot" rendered inline in the chat panel.
 *
 * The helper does NOT reach into the host app's DOM — instead it renders a
 * stylized mini-preview of the target page (with the target field highlighted)
 * right inside the chat. That means the helper can reference a member-facing
 * page while the user is in an internal app, with no DOM coupling.
 */
export type StepPreview = {
  /** Friendly page name shown in the preview header (e.g., "Apply for a loan"). */
  page: string;
  /** URL path shown in the fake address bar (e.g., "/apply"). */
  path?: string;
  /** Surrounding field labels for context — rendered dimmed above/below target. */
  context?: string[];
  /** The element the user is being directed to. */
  target: {
    label: string;
    kind?: StepPreviewTargetKind;
    /** Short text shown next to the highlight ("Type here", "Click this", etc.). */
    hint?: string;
  };
};

export type WorkflowStep = {
  appId: AppId;
  page: string;
  title: string;
  instruction: string;
  preview?: StepPreview;
  validates?: string[];
  completion: "click" | "manual" | "auto";
  /** Legacy: selector used by the old DOM-overlay mode. No longer rendered. */
  selector?: string;
  navigateUrl?: string;
};

export type Workflow = {
  id: string;
  title: string;
  description: string;
  aliases: string[];
  category: "primary" | "recovery" | "subflow";
  apps: AppId[];
  steps: WorkflowStep[];
};

export type SessionState = {
  sessionId: string;
  workflowId: string;
  stepIndex: number;
  startedAt: string;
  updatedAt: string;
  currentApp: AppId;
  context: Record<string, unknown>;
  errors: Array<{
    code: string;
    appId: AppId;
    message: string;
    suggestedWorkflowId: string;
    at: string;
  }>;
};

export type AskRequest = {
  query: string;
  appId: AppId;
  page?: string;
};

export type AskResponse = {
  answer: string;
  workflow: Workflow | null;
  rules: BusinessRule[];
};

export type ErrorReport = {
  code: string;
  appId: AppId;
  message: string;
  suggestedWorkflowId: string;
  anchorSelector?: string;
};

declare global {
  interface WindowEventMap {
    "helper:error": CustomEvent<ErrorReport>;
    "helper:clear-error": CustomEvent<void>;
  }
}
