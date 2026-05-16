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

export type WorkflowStep = {
  appId: AppId;
  page: string;
  title: string;
  instruction: string;
  screenshot?: string;
  validates?: string[];
  completion: "click" | "manual" | "auto";
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
