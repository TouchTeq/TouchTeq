export type ActionStatus =
  | "confirmed"
  | "attempted"
  | "could_not_verify"
  | "failed"
  | "need_info"
  | "unsupported";

export interface ActionResult {
  action: string;
  targetType: string;
  targetReference: string;
  toolUsed: string;
  status: ActionStatus;
  attempted: boolean;
  verified: boolean;
  summary: string;
  error: string | null;
  nextStep: string;
}

export function actionSuccess(opts: {
  action: string;
  targetType: string;
  targetReference: string;
  toolUsed: string;
  summary: string;
  verified?: boolean;
  nextStep?: string;
}): ActionResult {
  return {
    action: opts.action,
    targetType: opts.targetType,
    targetReference: opts.targetReference,
    toolUsed: opts.toolUsed,
    status: opts.verified !== false ? "confirmed" : "could_not_verify",
    attempted: true,
    verified: opts.verified !== false,
    summary: opts.summary,
    error: null,
    nextStep: opts.nextStep || "",
  };
}

export function actionFailed(opts: {
  action: string;
  targetType: string;
  targetReference?: string;
  toolUsed: string;
  error: string;
  nextStep?: string;
}): ActionResult {
  return {
    action: opts.action,
    targetType: opts.targetType,
    targetReference: opts.targetReference || "",
    toolUsed: opts.toolUsed,
    status: "failed",
    attempted: true,
    verified: false,
    summary: "",
    error: opts.error,
    nextStep: opts.nextStep || "Please check the details and try again.",
  };
}

export function actionNeedInfo(opts: {
  action: string;
  targetType: string;
  toolUsed: string;
  missingFields: string[];
  nextStep?: string;
}): ActionResult {
  return {
    action: opts.action,
    targetType: opts.targetType,
    targetReference: "",
    toolUsed: opts.toolUsed,
    status: "need_info",
    attempted: false,
    verified: false,
    summary: `Missing: ${opts.missingFields.join(", ")}`,
    error: null,
    nextStep: opts.nextStep || `Please provide: ${opts.missingFields.join(", ")}.`,
  };
}

export function actionUnsupported(opts: {
  action: string;
  targetType: string;
  toolUsed: string;
  reason: string;
  nextStep?: string;
}): ActionResult {
  return {
    action: opts.action,
    targetType: opts.targetType,
    targetReference: "",
    toolUsed: opts.toolUsed,
    status: "unsupported",
    attempted: false,
    verified: false,
    summary: opts.reason,
    error: null,
    nextStep: opts.nextStep || "This action is not currently available.",
  };
}

export function actionAttempted(opts: {
  action: string;
  targetType: string;
  targetReference: string;
  toolUsed: string;
  summary: string;
  nextStep?: string;
}): ActionResult {
  return {
    action: opts.action,
    targetType: opts.targetType,
    targetReference: opts.targetReference,
    toolUsed: opts.toolUsed,
    status: "attempted",
    attempted: true,
    verified: false,
    summary: opts.summary,
    error: null,
    nextStep: opts.nextStep || "Awaiting confirmation.",
  };
}

export function wrapWithActionResult(
  result: ActionResult,
  data?: Record<string, unknown>
): string {
  return JSON.stringify({
    actionStatus: result,
    ...data,
  });
}
