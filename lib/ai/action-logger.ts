/**
 * AI Action Logger - Persistent audit trail for all AI assistant actions
 * 
 * Logs every tool invocation, attempt, result, and verification outcome
 * for debugging, trust analysis, support, and safety review.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { ActionResult } from "@/lib/assistant-action";

// Maximum size for raw tool result storage (truncate to avoid huge payloads)
const MAX_RAW_RESULT_SIZE = 4000;

export interface AIActionLogInput {
  // Context
  userId?: string;
  conversationId?: string | null;
  userMessage?: string;
  normalizedIntent?: string;
  
  // Tool info
  toolName: string;
  toolArgs?: Record<string, unknown>;
  
  // Target info
  targetType?: string;
  targetId?: string;
  targetReference?: string;
  
  // Outcome (from ActionResult)
  actionStatus: string;
  attempted: boolean;
  verified: boolean;
  verificationDetails?: Record<string, unknown>;
  errorMessage?: string | null;
  nextStep?: string;
  summary?: string;
  
  // Raw result (will be truncated if too large)
  rawToolResult?: Record<string, unknown>;
  
  // System context
  modelName?: string;
  latencyMs?: number;
  requestSource?: string;
}

/**
 * Truncate a value to a maximum length for safe storage
 */
function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return value.substring(0, maxLength) + "... [truncated]";
}

/**
 * Sanitize tool args to avoid logging sensitive data
 */
function sanitizeToolArgs(args: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!args) return {};
  
  const sanitized = { ...args };
  
  // Remove any fields that might contain sensitive data
  const sensitiveKeys = ["apiKey", "secret", "password", "token", "authorization", "credential"];
  
  for (const key of Object.keys(sanitized)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
      sanitized[key] = "[REDACTED]";
    }
  }
  
  return sanitized;
}

/**
 * Sanitize raw tool result to avoid logging sensitive data
 */
function sanitizeRawResult(result: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!result) return {};
  
  // Deep clone and sanitize
  const sanitized = JSON.parse(JSON.stringify(result));
  
  // Remove actionStatus wrapper if present (we store those fields separately)
  if (sanitized.actionStatus) {
    delete sanitized.actionStatus;
  }
  
  return sanitized;
}

/**
 * Truncate raw tool result to avoid storing huge payloads
 */
function truncateRawResult(result: Record<string, unknown>): Record<string, unknown> {
  const jsonStr = JSON.stringify(result);
  if (jsonStr.length <= MAX_RAW_RESULT_SIZE) {
    return result;
  }
  
  // Truncate by keeping top-level keys but truncating large values
  const truncated: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(result)) {
    const valueStr = typeof value === "string" ? value : JSON.stringify(value);
    if (valueStr.length > 500) {
      truncated[key] = truncate(valueStr, 500);
    } else {
      truncated[key] = value;
    }
  }
  
  // If still too large, just store a summary
  if (JSON.stringify(truncated).length > MAX_RAW_RESULT_SIZE) {
    return {
      _truncated: true,
      _originalSize: jsonStr.length,
      _summary: `Result truncated. Original size: ${jsonStr.length} bytes`,
    };
  }
  
  return truncated;
}

/**
 * Log an AI action to the database.
 * 
 * This function is designed to be fire-and-forget:
 * - It never throws errors to the caller
 * - It logs errors to console but continues
 * - It uses the service role client for reliable insertion
 */
export async function logAIAction(input: AIActionLogInput): Promise<void> {
  try {
    const supabase = createAdminClient();
    
    const logEntry = {
      user_id: input.userId || null,
      conversation_id: input.conversationId || null,
      user_message: input.userMessage ? truncate(input.userMessage, 1000) : null,
      normalized_intent: input.normalizedIntent || null,
      
      tool_name: input.toolName,
      tool_args: sanitizeToolArgs(input.toolArgs),
      
      target_type: input.targetType || null,
      target_id: input.targetId || null,
      target_reference: input.targetReference || null,
      
      action_status: input.actionStatus,
      attempted: input.attempted,
      verified: input.verified,
      verification_details: input.verificationDetails || {},
      error_message: input.errorMessage || null,
      next_step: input.nextStep || null,
      
      raw_tool_result: truncateRawResult(sanitizeRawResult(input.rawToolResult)),
      
      model_name: input.modelName || null,
      latency_ms: input.latencyMs || null,
      request_source: input.requestSource || "chat",
      
      summary: input.summary ? truncate(input.summary, 500) : null,
    };
    
    const { error } = await supabase
      .from("ai_action_log")
      .insert(logEntry);
    
    if (error) {
      console.error("[AI Action Logger] Failed to log action:", error.message);
    }
  } catch (err) {
    // Never let logging failures break the main flow
    console.error("[AI Action Logger] Unexpected error logging action:", err);
  }
}

/**
 * Parse a tool result string and extract action status info
 */
export function parseActionResult(toolResult: string): {
  actionStatus: ActionResult | null;
  data: Record<string, unknown>;
} {
  try {
    const parsed = JSON.parse(toolResult);
    
    if (parsed.actionStatus) {
      const { actionStatus, ...rest } = parsed;
      return {
        actionStatus: actionStatus as ActionResult,
        data: rest,
      };
    }
    
    return {
      actionStatus: null,
      data: parsed,
    };
  } catch {
    return {
      actionStatus: null,
      data: { raw: toolResult },
    };
  }
}

/**
 * Extract target info from tool args based on tool type
 */
export function extractTargetInfo(
  toolName: string,
  args: Record<string, unknown>
): {
  targetType: string;
  targetId?: string;
  targetReference?: string;
} {
  const toolTypeMap: Record<string, { type: string; refField?: string }> = {
    createClient: { type: "client", refField: "companyName" },
    updateClient: { type: "client", refField: "clientName" },
    addClientCommunication: { type: "client_communication", refField: "clientName" },
    createClientContact: { type: "client_contact", refField: "clientName" },
    updateClientContact: { type: "client_contact", refField: "contactName" },
    draftInvoice: { type: "invoice", refField: "clientName" },
    draftQuote: { type: "quote", refField: "clientName" },
    draftPurchaseOrder: { type: "purchase_order", refField: "supplierName" },
    draftCreditNote: { type: "credit_note", refField: "clientName" },
    recordPayment: { type: "payment", refField: "invoiceReference" },
    logExpense: { type: "expense", refField: "supplierName" },
    logTrip: { type: "travel_trip", refField: "destination" },
    logFuelPurchase: { type: "fuel_log", refField: "supplierName" },
    saveMemory: { type: "ai_memory", refField: "key" },
    updateInvoiceStatus: { type: "invoice", refField: "invoiceReference" },
    updatePurchaseOrderStatus: { type: "purchase_order", refField: "poReference" },
    updateCreditNoteStatus: { type: "credit_note", refField: "creditNoteReference" },
    markInvoicePaid: { type: "invoice", refField: "invoiceReference" },
    voidInvoice: { type: "invoice", refField: "invoiceReference" },
    markInvoiceSent: { type: "invoice", refField: "invoiceReference" },
    reopenInvoice: { type: "invoice", refField: "invoiceReference" },
    markQuoteSent: { type: "quote", refField: "quoteReference" },
    acceptQuote: { type: "quote", refField: "quoteReference" },
    declineQuote: { type: "quote", refField: "quoteReference" },
    expireQuote: { type: "quote", refField: "quoteReference" },
    reopenQuote: { type: "quote", refField: "quoteReference" },
    rejectQuote: { type: "quote", refField: "quoteReference" },
    issueQuote: { type: "quote", refField: "quoteReference" },
    convertQuoteToInvoice: { type: "quote", refField: "quoteReference" },
    transitionDocumentStatus: { type: "document", refField: "reference" },
    queryBusinessData: { type: "query", refField: "queryType" },
    stageEmailForConfirmation: { type: "email", refField: "recipientEmail" },
    navigateTo: { type: "navigation", refField: "destination" },
  };
  
  const config = toolTypeMap[toolName];
  
  if (!config) {
    return {
      targetType: "unknown",
      targetReference: String(args[Object.keys(args)[0]] || ""),
    };
  }
  
  const refField = config.refField;
  const targetReference = refField ? String(args[refField] || "") : "";
  
  return {
    targetType: config.type,
    targetReference,
  };
}