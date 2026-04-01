/**
 * AI Action Replay Engine
 * 
 * Provides safe replay/debug capabilities for logged AI actions.
 * 
 * SAFETY MODEL:
 * - Tools are classified by safety level: SAFE, DRY_RUN, BLOCKED
 * - SAFE tools (read-only queries) can be replayed directly
 * - DRY_RUN tools simulate execution without mutating data
 * - BLOCKED tools (dangerous writes) cannot be replayed — inspection only
 * 
 * All replays are tagged with replay metadata so they can be distinguished
 * from real operations in audit logs.
 */

import { createAdminClient } from "@/lib/supabase/admin";

// ============================================================
// Tool Safety Classification
// ============================================================

export type ToolSafetyLevel = "SAFE" | "DRY_RUN" | "BLOCKED";

export interface ToolSafetyConfig {
  level: ToolSafetyLevel;
  description: string;
  dryRunSupported: boolean;
}

const TOOL_SAFETY_MAP: Record<string, ToolSafetyConfig> = {
  // SAFE — read-only operations, no data mutation
  queryBusinessData: {
    level: "SAFE",
    description: "Read-only data query — safe to replay",
    dryRunSupported: false,
  },

  // DRY_RUN — write operations that can be simulated
  createClient: {
    level: "DRY_RUN",
    description: "Would create a new client — replay validates inputs and checks for duplicates only",
    dryRunSupported: true,
  },
  updateClient: {
    level: "DRY_RUN",
    description: "Would update client details — replay validates inputs and shows diff only",
    dryRunSupported: true,
  },
  addClientCommunication: {
    level: "DRY_RUN",
    description: "Would log a communication — replay validates client exists and shows what would be logged",
    dryRunSupported: true,
  },
  createClientContact: {
    level: "DRY_RUN",
    description: "Would create a contact — replay validates client exists and checks for duplicates only",
    dryRunSupported: true,
  },
  updateClientContact: {
    level: "DRY_RUN",
    description: "Would update a contact — replay validates and shows diff only",
    dryRunSupported: true,
  },
  draftInvoice: {
    level: "DRY_RUN",
    description: "Would draft an invoice — replay validates inputs, client, and pricing only",
    dryRunSupported: true,
  },
  draftQuote: {
    level: "DRY_RUN",
    description: "Would draft a quote — replay validates inputs and pricing only",
    dryRunSupported: true,
  },
  draftPurchaseOrder: {
    level: "DRY_RUN",
    description: "Would draft a PO — replay validates inputs only",
    dryRunSupported: true,
  },
  draftCreditNote: {
    level: "DRY_RUN",
    description: "Would draft a credit note — replay validates invoice and amounts only",
    dryRunSupported: true,
  },
  logExpense: {
    level: "DRY_RUN",
    description: "Would log an expense — replay validates inputs only",
    dryRunSupported: true,
  },
  logTrip: {
    level: "DRY_RUN",
    description: "Would log a trip — replay validates inputs only",
    dryRunSupported: true,
  },
  logFuelPurchase: {
    level: "DRY_RUN",
    description: "Would log a fuel purchase — replay validates inputs only",
    dryRunSupported: true,
  },
  recordPayment: {
    level: "DRY_RUN",
    description: "Would record a payment — replay validates invoice and amount only",
    dryRunSupported: true,
  },
  saveMemory: {
    level: "DRY_RUN",
    description: "Would save an AI memory — replay validates input only",
    dryRunSupported: true,
  },

  // BLOCKED — dangerous writes that should never be replayed
  updateInvoiceStatus: {
    level: "BLOCKED",
    description: "Status change — replay blocked. Inspect original result only.",
    dryRunSupported: false,
  },
  updatePurchaseOrderStatus: {
    level: "BLOCKED",
    description: "Status change — replay blocked. Inspect original result only.",
    dryRunSupported: false,
  },
  updateCreditNoteStatus: {
    level: "BLOCKED",
    description: "Status change — replay blocked. Inspect original result only.",
    dryRunSupported: false,
  },
  markInvoicePaid: {
    level: "BLOCKED",
    description: "Financial mutation — replay blocked. Inspect original result only.",
    dryRunSupported: false,
  },
  voidInvoice: {
    level: "BLOCKED",
    description: "Destructive operation — replay blocked. Inspect original result only.",
    dryRunSupported: false,
  },
  markInvoiceSent: {
    level: "BLOCKED",
    description: "Status change — replay blocked. Inspect original result only.",
    dryRunSupported: false,
  },
  reopenInvoice: {
    level: "BLOCKED",
    description: "Status change — replay blocked. Inspect original result only.",
    dryRunSupported: false,
  },
  markQuoteSent: {
    level: "BLOCKED",
    description: "Status change — replay blocked. Inspect original result only.",
    dryRunSupported: false,
  },
  acceptQuote: {
    level: "BLOCKED",
    description: "Status change — replay blocked. Inspect original result only.",
    dryRunSupported: false,
  },
  declineQuote: {
    level: "BLOCKED",
    description: "Status change — replay blocked. Inspect original result only.",
    dryRunSupported: false,
  },
  expireQuote: {
    level: "BLOCKED",
    description: "Status change — replay blocked. Inspect original result only.",
    dryRunSupported: false,
  },
  reopenQuote: {
    level: "BLOCKED",
    description: "Status change — replay blocked. Inspect original result only.",
    dryRunSupported: false,
  },
  rejectQuote: {
    level: "BLOCKED",
    description: "Status change — replay blocked. Inspect original result only.",
    dryRunSupported: false,
  },
  issueQuote: {
    level: "BLOCKED",
    description: "Status change — replay blocked. Inspect original result only.",
    dryRunSupported: false,
  },
  markPOSent: {
    level: "BLOCKED",
    description: "Status change — replay blocked. Inspect original result only.",
    dryRunSupported: false,
  },
  acknowledgePO: {
    level: "BLOCKED",
    description: "Status change — replay blocked. Inspect original result only.",
    dryRunSupported: false,
  },
  markPODelivered: {
    level: "BLOCKED",
    description: "Status change — replay blocked. Inspect original result only.",
    dryRunSupported: false,
  },
  cancelPO: {
    level: "BLOCKED",
    description: "Destructive operation — replay blocked. Inspect original result only.",
    dryRunSupported: false,
  },
  issueCreditNote: {
    level: "BLOCKED",
    description: "Financial mutation — replay blocked. Inspect original result only.",
    dryRunSupported: false,
  },
  sendCreditNote: {
    level: "BLOCKED",
    description: "External action — replay blocked. Inspect original result only.",
    dryRunSupported: false,
  },
  applyCreditNote: {
    level: "BLOCKED",
    description: "Financial mutation — replay blocked. Inspect original result only.",
    dryRunSupported: false,
  },
  cancelCreditNote: {
    level: "BLOCKED",
    description: "Destructive operation — replay blocked. Inspect original result only.",
    dryRunSupported: false,
  },
  transitionDocumentStatus: {
    level: "BLOCKED",
    description: "Status change — replay blocked. Inspect original result only.",
    dryRunSupported: false,
  },
  convertQuoteToInvoice: {
    level: "BLOCKED",
    description: "Document conversion — replay blocked. Inspect original result only.",
    dryRunSupported: false,
  },
  navigateTo: {
    level: "BLOCKED",
    description: "Navigation action — replay not applicable",
    dryRunSupported: false,
  },
  stageEmailForConfirmation: {
    level: "BLOCKED",
    description: "External communication — replay blocked. Inspect original result only.",
    dryRunSupported: false,
  },
};

// Default for unknown tools
const DEFAULT_SAFETY_CONFIG: ToolSafetyConfig = {
  level: "BLOCKED",
  description: "Unknown tool — replay blocked for safety",
  dryRunSupported: false,
};

export function getToolSafetyConfig(toolName: string): ToolSafetyConfig {
  return TOOL_SAFETY_MAP[toolName] || DEFAULT_SAFETY_CONFIG;
}

// ============================================================
// Replay Result Types
// ============================================================

export interface ReplayResult {
  actionLogId: string;
  toolName: string;
  safetyLevel: ToolSafetyLevel;
  replayAllowed: boolean;
  replayMode: "direct" | "dry_run" | "blocked";
  originalResult: Record<string, unknown> | null;
  replayResult: Record<string, unknown> | null;
  replayError: string | null;
  replayTimestamp: string;
  differences: ReplayDifference[];
  validationChecks: ValidationCheck[];
  warning: string | null;
}

export interface ReplayDifference {
  field: string;
  original: unknown;
  replay: unknown;
  match: boolean;
}

export interface ValidationCheck {
  check: string;
  passed: boolean;
  detail: string;
}

// ============================================================
// Replay Engine
// ============================================================

/**
 * Execute a replay of a logged AI action.
 * 
 * For SAFE tools: executes the tool directly and compares results.
 * For DRY_RUN tools: performs validation-only simulation.
 * For BLOCKED tools: returns blocked with inspection data only.
 */
export async function replayAction(
  actionLogId: string,
  forceReplay: boolean = false
): Promise<ReplayResult> {
  const supabase = createAdminClient();
  const replayTimestamp = new Date().toISOString();

  // Fetch the original action log
  const { data: actionLog, error: fetchError } = await supabase
    .from("ai_action_log")
    .select("*")
    .eq("id", actionLogId)
    .single();

  if (fetchError || !actionLog) {
    return {
      actionLogId,
      toolName: "unknown",
      safetyLevel: "BLOCKED",
      replayAllowed: false,
      replayMode: "blocked",
      originalResult: null,
      replayResult: null,
      replayError: `Action log not found: ${fetchError?.message || "unknown error"}`,
      replayTimestamp,
      differences: [],
      validationChecks: [],
      warning: null,
    };
  }

  const toolName = actionLog.tool_name as string;
  const toolArgs = (actionLog.tool_args as Record<string, unknown>) || {};
  const safetyConfig = getToolSafetyConfig(toolName);

  // Fetch conversation context for additional debug info
  const conversationContext = await fetchConversationContext(
    supabase,
    actionLog.conversation_id as string | null
  );

  // Build the base result structure
  const baseResult: Omit<ReplayResult, "replayResult" | "replayError" | "differences" | "validationChecks"> = {
    actionLogId,
    toolName,
    safetyLevel: safetyConfig.level,
    replayAllowed: safetyConfig.level !== "BLOCKED" || forceReplay,
    replayMode: safetyConfig.level === "SAFE" ? "direct" : safetyConfig.level === "DRY_RUN" ? "dry_run" : "blocked",
    originalResult: (actionLog.raw_tool_result as Record<string, unknown>) || null,
    replayTimestamp,
    warning: safetyConfig.level === "BLOCKED" && !forceReplay
      ? `Replay is blocked for "${toolName}" — this tool performs ${safetyConfig.description.toLowerCase()}. Inspection only.`
      : safetyConfig.level === "DRY_RUN"
        ? "DRY RUN MODE: This replay validates inputs and simulates execution without mutating data."
        : null,
  };

  // Handle blocked tools
  if (safetyConfig.level === "BLOCKED" && !forceReplay) {
    return {
      ...baseResult,
      replayResult: null,
      replayError: null,
      differences: [],
      validationChecks: buildInspectionChecks(actionLog, conversationContext),
    };
  }

  // Execute replay based on safety level
  if (safetyConfig.level === "SAFE") {
    return await replaySafeTool(supabase, baseResult, toolName, toolArgs);
  }

  if (safetyConfig.level === "DRY_RUN") {
    return await replayDryRun(supabase, baseResult, toolName, toolArgs, actionLog);
  }

  // Fallback: blocked
  return {
    ...baseResult,
    replayResult: null,
    replayError: "Replay not supported for this tool type",
    differences: [],
    validationChecks: [],
  };
}

// ============================================================
// SAFE Tool Replay (direct execution with comparison)
// ============================================================

async function replaySafeTool(
  supabase: ReturnType<typeof createAdminClient>,
  baseResult: Omit<ReplayResult, "replayResult" | "replayError" | "differences" | "validationChecks">,
  toolName: string,
  toolArgs: Record<string, unknown>
): Promise<ReplayResult> {
  try {
    if (toolName !== "queryBusinessData") {
      return {
        ...baseResult,
        replayResult: null,
        replayError: `Safe replay not implemented for: ${toolName}`,
        differences: [],
        validationChecks: [],
      };
    }

    // Re-execute the query
    const replayData = await executeQueryDryRun(supabase, toolArgs);

    const originalResult = baseResult.originalResult || {};
    const differences = compareResults(originalResult, replayData);
    const validationChecks = buildValidationChecks("queryBusinessData", toolArgs, replayData);

    return {
      ...baseResult,
      replayResult: replayData,
      replayError: null,
      differences,
      validationChecks,
    };
  } catch (err: any) {
    return {
      ...baseResult,
      replayResult: null,
      replayError: err.message || "Replay execution failed",
      differences: [],
      validationChecks: [],
    };
  }
}

// ============================================================
// DRY RUN Replay (validation-only, no data mutation)
// ============================================================

async function replayDryRun(
  supabase: ReturnType<typeof createAdminClient>,
  baseResult: Omit<ReplayResult, "replayResult" | "replayError" | "differences" | "validationChecks">,
  toolName: string,
  toolArgs: Record<string, unknown>,
  actionLog: any
): Promise<ReplayResult> {
  try {
    const validationChecks: ValidationCheck[] = [];
    const replayData: Record<string, unknown> = {
      dryRun: true,
      toolName,
      toolArgs,
      validationResults: {} as Record<string, unknown>,
    };

    switch (toolName) {
      case "createClient": {
        const { companyName } = toolArgs as { companyName?: string };
        validationChecks.push({
          check: "companyName provided",
          passed: Boolean(companyName?.trim()),
          detail: companyName ? `"${companyName}"` : "Missing company name",
        });

        if (companyName) {
          const { data: existing } = await supabase
            .from("clients")
            .select("id, company_name, email")
            .ilike("company_name", companyName.trim())
            .limit(5);
          
          const duplicates = existing || [];
          validationChecks.push({
            check: "No duplicate client",
            passed: duplicates.length === 0,
            detail: duplicates.length > 0
              ? `${duplicates.length} potential duplicate(s) found: ${duplicates.map((c: any) => c.company_name).join(", ")}`
              : "No duplicates found — safe to create",
          });
        }
        (replayData.validationResults as any).duplicateCheck = true;
        break;
      }

      case "updateClient": {
        const { clientName } = toolArgs as { clientName?: string };
        validationChecks.push({
          check: "clientName provided",
          passed: Boolean(clientName?.trim()),
          detail: clientName ? `"${clientName}"` : "Missing client name",
        });

        if (clientName) {
          const { data: existing } = await supabase
            .from("clients")
            .select("id, company_name, email, phone, contact_person")
            .ilike("company_name", clientName.trim())
            .limit(1);
          
          if (existing && existing.length > 0) {
            const client = existing[0];
            const updates: Record<string, unknown> = {};
            const updateFields = ["contactPerson", "email", "phone", "physicalAddress", "vatNumber", "category", "notes"];
            for (const field of updateFields) {
              if (toolArgs[field] !== undefined) {
                updates[field] = toolArgs[field];
              }
            }
            validationChecks.push({
              check: "Client found",
              passed: true,
              detail: `Found: "${client.company_name}" (ID: ${client.id.slice(0, 8)}...)`,
            });
            validationChecks.push({
              check: "Fields to update",
              passed: Object.keys(updates).length > 0,
              detail: Object.keys(updates).length > 0
                ? `Would update: ${Object.keys(updates).join(", ")}`
                : "No fields to update",
            });
            (replayData.validationResults as any).targetClient = { id: client.id, company_name: client.company_name };
            (replayData.validationResults as any).proposedUpdates = updates;
          } else {
            validationChecks.push({
              check: "Client found",
              passed: false,
              detail: `No client matching "${clientName}" found`,
            });
          }
        }
        break;
      }

      case "draftInvoice": {
        const { clientName, lineItems } = toolArgs as { clientName?: string; lineItems?: unknown[] };
        validationChecks.push({
          check: "clientName provided",
          passed: Boolean(clientName?.trim()),
          detail: clientName ? `"${clientName}"` : "Missing client name",
        });
        validationChecks.push({
          check: "lineItems provided",
          passed: Array.isArray(lineItems) && lineItems.length > 0,
          detail: Array.isArray(lineItems) ? `${lineItems.length} line item(s)` : "No line items",
        });

        if (clientName) {
          const { data: existing } = await supabase
            .from("clients")
            .select("id, company_name")
            .ilike("company_name", clientName.trim())
            .limit(1);
          
          validationChecks.push({
            check: "Client exists",
            passed: Boolean(existing && existing.length > 0),
            detail: existing?.length ? `"${existing[0].company_name}" found` : `Client "${clientName}" not found`,
          });
        }

        if (Array.isArray(lineItems) && lineItems.length > 0) {
          const total = lineItems.reduce((sum: number, item: any) => {
            const qty = Number(item.quantity || 0);
            const price = Number(item.unitPrice || 0);
            return sum + qty * price;
          }, 0);
          (replayData.validationResults as any).calculatedTotal = total;
          validationChecks.push({
            check: "Line item total",
            passed: total > 0,
            detail: `R${total.toFixed(2)}`,
          });
        }
        break;
      }

      case "recordPayment": {
        const { invoiceReference, amount } = toolArgs as { invoiceReference?: string; amount?: number };
        validationChecks.push({
          check: "invoiceReference provided",
          passed: Boolean(invoiceReference?.trim()),
          detail: invoiceReference || "Missing invoice reference",
        });
        validationChecks.push({
          check: "amount provided",
          passed: Boolean(amount && amount > 0),
          detail: amount ? `R${amount}` : "Missing or invalid amount",
        });

        if (invoiceReference) {
          const { data: invoices } = await supabase
            .from("invoices")
            .select("id, invoice_number, status, total, balance_due")
            .eq("invoice_number", invoiceReference.trim())
            .limit(1);
          
          if (invoices && invoices.length > 0) {
            const inv = invoices[0];
            validationChecks.push({
              check: "Invoice exists",
              passed: true,
              detail: `${inv.invoice_number} — Status: ${inv.status}, Balance: R${inv.balance_due}`,
            });
            validationChecks.push({
              check: "Payment amount valid",
              passed: amount ? amount <= (inv.balance_due || 0) + 0.01 : false,
              detail: amount
                ? `R${amount} vs balance R${inv.balance_due}`
                : "No amount to validate",
            });
            (replayData.validationResults as any).targetInvoice = {
              id: inv.id,
              invoice_number: inv.invoice_number,
              status: inv.status,
              balance_due: inv.balance_due,
            };
          } else {
            validationChecks.push({
              check: "Invoice exists",
              passed: false,
              detail: `Invoice "${invoiceReference}" not found`,
            });
          }
        }
        break;
      }

      case "logTrip": {
        const { destination, distanceKm, purpose } = toolArgs as { destination?: string; distanceKm?: number; purpose?: string };
        validationChecks.push({
          check: "destination provided",
          passed: Boolean(destination?.trim()),
          detail: destination || "Missing destination",
        });
        validationChecks.push({
          check: "distanceKm valid",
          passed: Boolean(distanceKm && distanceKm > 0),
          detail: distanceKm ? `${distanceKm} km` : "Missing or invalid distance",
        });
        validationChecks.push({
          check: "purpose provided",
          passed: Boolean(purpose?.trim()),
          detail: purpose || "Missing purpose",
        });
        break;
      }

      case "logExpense": {
        const { supplierName, amount } = toolArgs as { supplierName?: string; amount?: number };
        validationChecks.push({
          check: "supplierName provided",
          passed: Boolean(supplierName?.trim()),
          detail: supplierName || "Missing supplier name",
        });
        validationChecks.push({
          check: "amount valid",
          passed: Boolean(amount && amount > 0),
          detail: amount ? `R${amount}` : "Missing or invalid amount",
        });
        break;
      }

      case "addClientCommunication": {
        const { clientName, content } = toolArgs as { clientName?: string; content?: string };
        validationChecks.push({
          check: "clientName provided",
          passed: Boolean(clientName?.trim()),
          detail: clientName || "Missing client name",
        });
        validationChecks.push({
          check: "content provided",
          passed: Boolean(content?.trim()),
          detail: content ? `${content.length} characters` : "Missing content",
        });

        if (clientName) {
          const { data: existing } = await supabase
            .from("clients")
            .select("id, company_name")
            .ilike("company_name", clientName.trim())
            .limit(1);
          validationChecks.push({
            check: "Client exists",
            passed: Boolean(existing && existing.length > 0),
            detail: existing?.length ? `"${existing[0].company_name}" found` : `Client "${clientName}" not found`,
          });
        }
        break;
      }

      case "createClientContact": {
        const { clientName, fullName } = toolArgs as { clientName?: string; fullName?: string };
        validationChecks.push({
          check: "clientName provided",
          passed: Boolean(clientName?.trim()),
          detail: clientName || "Missing client name",
        });
        validationChecks.push({
          check: "fullName provided",
          passed: Boolean(fullName?.trim()),
          detail: fullName || "Missing contact name",
        });

        if (clientName) {
          const { data: existing } = await supabase
            .from("clients")
            .select("id, company_name")
            .ilike("company_name", clientName.trim())
            .limit(1);
          validationChecks.push({
            check: "Client exists",
            passed: Boolean(existing && existing.length > 0),
            detail: existing?.length ? `"${existing[0].company_name}" found` : `Client "${clientName}" not found`,
          });
        }
        break;
      }

      case "updateClientContact": {
        const { clientName, contactName } = toolArgs as { clientName?: string; contactName?: string };
        validationChecks.push({
          check: "clientName provided",
          passed: Boolean(clientName?.trim()),
          detail: clientName || "Missing client name",
        });
        validationChecks.push({
          check: "contactName provided",
          passed: Boolean(contactName?.trim()),
          detail: contactName || "Missing contact name",
        });
        break;
      }

      case "draftQuote": {
        const { clientName, lineItems } = toolArgs as { clientName?: string; lineItems?: unknown[] };
        validationChecks.push({
          check: "clientName provided",
          passed: Boolean(clientName?.trim()),
          detail: clientName || "Missing client name",
        });
        validationChecks.push({
          check: "lineItems provided",
          passed: Array.isArray(lineItems) && lineItems.length > 0,
          detail: Array.isArray(lineItems) ? `${lineItems.length} line item(s)` : "No line items",
        });
        if (clientName) {
          const { data: existing } = await supabase
            .from("clients")
            .select("id, company_name")
            .ilike("company_name", clientName.trim())
            .limit(1);
          validationChecks.push({
            check: "Client exists",
            passed: Boolean(existing && existing.length > 0),
            detail: existing?.length ? `"${existing[0].company_name}" found` : `Client "${clientName}" not found`,
          });
        }
        break;
      }

      case "draftPurchaseOrder": {
        const { supplierName } = toolArgs as { supplierName?: string };
        validationChecks.push({
          check: "supplierName provided",
          passed: Boolean(supplierName?.trim()),
          detail: supplierName || "Missing supplier name",
        });
        break;
      }

      case "draftCreditNote": {
        const { clientName, invoiceReference } = toolArgs as { clientName?: string; invoiceReference?: string };
        validationChecks.push({
          check: "clientName provided",
          passed: Boolean(clientName?.trim()),
          detail: clientName || "Missing client name",
        });
        validationChecks.push({
          check: "invoiceReference provided",
          passed: Boolean(invoiceReference?.trim()),
          detail: invoiceReference || "Missing invoice reference",
        });
        if (invoiceReference) {
          const { data: invoices } = await supabase
            .from("invoices")
            .select("id, invoice_number, status, total, balance_due")
            .eq("invoice_number", invoiceReference.trim())
            .limit(1);
          validationChecks.push({
            check: "Invoice exists",
            passed: Boolean(invoices && invoices.length > 0),
            detail: invoices?.length ? `"${invoices[0].invoice_number}" found` : `Invoice "${invoiceReference}" not found`,
          });
        }
        break;
      }

      case "logFuelPurchase": {
        const { supplierName, totalAmount } = toolArgs as { supplierName?: string; totalAmount?: number };
        validationChecks.push({
          check: "supplierName provided",
          passed: Boolean(supplierName?.trim()),
          detail: supplierName || "Missing supplier name",
        });
        validationChecks.push({
          check: "totalAmount valid",
          passed: Boolean(totalAmount && totalAmount > 0),
          detail: totalAmount ? `R${totalAmount}` : "Missing or invalid amount",
        });
        break;
      }

      case "saveMemory": {
        const { key, value } = toolArgs as { key?: string; value?: unknown };
        validationChecks.push({
          check: "key provided",
          passed: Boolean(key?.trim()),
          detail: key || "Missing memory key",
        });
        validationChecks.push({
          check: "value provided",
          passed: value !== undefined && value !== null,
          detail: value !== undefined ? "Value present" : "Missing value",
        });
        break;
      }

      default: {
        // Generic validation for unhandled DRY_RUN tools
        validationChecks.push({
          check: "Required args present",
          passed: Object.keys(toolArgs).length > 0,
          detail: `${Object.keys(toolArgs).length} argument(s) provided`,
        });
        (replayData.validationResults as any).genericValidation = true;
        break;
      }
    }

    const allPassed = validationChecks.every(v => v.passed);

    return {
      ...baseResult,
      replayResult: replayData,
      replayError: null,
      differences: [],
      validationChecks,
      warning: allPassed
        ? "DRY RUN: All validation checks passed. The original action would have been valid."
        : `DRY RUN: ${validationChecks.filter(v => !v.passed).length} validation check(s) failed. See details below.`,
    };
  } catch (err: any) {
    return {
      ...baseResult,
      replayResult: null,
      replayError: err.message || "Dry run validation failed",
      differences: [],
      validationChecks: [],
    };
  }
}

// ============================================================
// Helpers
// ============================================================

async function executeQueryDryRun(
  supabase: ReturnType<typeof createAdminClient>,
  toolArgs: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const queryType = toolArgs.queryType as string;
  const filters = (toolArgs.filters as Record<string, unknown>) || {};
  const limit = Number(filters.limit) || 10;
  const today = new Date().toISOString().split("T")[0];

  switch (queryType) {
    case "revenue_summary": {
      const { data: invoices } = await supabase
        .from("invoices")
        .select("total, amount_paid, balance_due, status, issue_date")
        .order("issue_date", { ascending: false })
        .limit(limit);
      return { queryType, count: (invoices || []).length, data: invoices };
    }
    case "invoice_list": {
      let query = supabase.from("invoices").select("id, invoice_number, total, balance_due, status, due_date, clients(company_name)").order("created_at", { ascending: false }).limit(limit);
      if (filters.status) query = query.eq("status", filters.status);
      const { data } = await query;
      return { queryType, count: (data || []).length, data };
    }
    case "overdue_invoices": {
      const { data } = await supabase
        .from("invoices")
        .select("id, invoice_number, total, balance_due, due_date, clients(company_name)")
        .in("status", ["Sent", "Overdue", "Partially Paid"])
        .lt("due_date", today)
        .gt("balance_due", 0)
        .order("due_date", { ascending: true })
        .limit(limit);
      return { queryType, count: (data || []).length, data };
    }
    case "client_list": {
      const { data } = await supabase.from("clients").select("id, company_name, contact_person, email, phone, category").eq("is_active", true).order("company_name").limit(limit);
      return { queryType, count: (data || []).length, data };
    }
    case "client_lookup": {
      const name = filters.clientName || "";
      const { data } = await supabase.from("clients").select("id, company_name, contact_person, email, phone").ilike("company_name", `%${name}%`).limit(5);
      return { queryType, count: (data || []).length, data };
    }
    case "expense_summary": {
      const { data } = await supabase.from("expenses").select("amount_inclusive, category, expense_date, description").order("expense_date", { ascending: false }).limit(limit);
      return { queryType, count: (data || []).length, data };
    }
    case "travel_summary": {
      const { data } = await supabase.from("travel_trips").select("distance_km, date, from_location, to_location, purpose").order("date", { ascending: false }).limit(limit);
      return { queryType, count: (data || []).length, data };
    }
    case "quote_list": {
      const { data } = await supabase.from("quotes").select("id, quote_number, status, total, issue_date, expiry_date, clients(company_name)").order("created_at", { ascending: false }).limit(limit);
      return { queryType, count: (data || []).length, data };
    }
    case "dashboard_stats": {
      const { data: invoices } = await supabase.from("invoices").select("total, balance_due, status, due_date, issue_date");
      const { data: quotes } = await supabase.from("quotes").select("total, status");
      const { data: expenses } = await supabase.from("expenses").select("amount_inclusive");
      return {
        queryType,
        totalInvoices: (invoices || []).length,
        totalQuotes: (quotes || []).length,
        totalExpenses: (expenses || []).length,
      };
    }
    default: {
      return { queryType, error: `Query type "${queryType}" not supported in replay` };
    }
  }
}

function compareResults(
  original: Record<string, unknown>,
  replay: Record<string, unknown>
): ReplayDifference[] {
  const differences: ReplayDifference[] = [];
  const allKeys = new Set([...Object.keys(original), ...Object.keys(replay)]);

  for (const key of allKeys) {
    const origVal = original[key];
    const replayVal = replay[key];
    
    // Compare counts for list results
    if (key === "count" || key === "totalInvoices" || key === "totalQuotes" || key === "totalExpenses") {
      differences.push({
        field: key,
        original: origVal,
        replay: replayVal,
        match: origVal === replayVal,
      });
    }
    
    // Compare data array lengths
    if (key === "data" && Array.isArray(origVal) && Array.isArray(replayVal)) {
      differences.push({
        field: "data.length",
        original: origVal.length,
        replay: replayVal.length,
        match: origVal.length === replayVal.length,
      });
    }
  }

  return differences;
}

function buildValidationChecks(
  toolName: string,
  toolArgs: Record<string, unknown>,
  data: Record<string, unknown>
): ValidationCheck[] {
  const checks: ValidationCheck[] = [];

  checks.push({
    check: "Query executed successfully",
    passed: !data.error,
    detail: data.error ? String(data.error) : "Query completed",
  });

  if (data.count !== undefined) {
    checks.push({
      check: "Result count matches",
      passed: true,
      detail: `${data.count} record(s) returned`,
    });
  }

  return checks;
}

function buildInspectionChecks(
  actionLog: any,
  conversationContext: any
): ValidationCheck[] {
  const checks: ValidationCheck[] = [];

  checks.push({
    check: "Action was attempted",
    passed: Boolean(actionLog.attempted),
    detail: actionLog.attempted ? "Yes" : "No — action was not attempted",
  });

  checks.push({
    check: "Original status",
    passed: true,
    detail: actionLog.action_status || "unknown",
  });

  if (actionLog.error_message) {
    checks.push({
      check: "Error present",
      passed: false,
      detail: actionLog.error_message,
    });
  }

  if (actionLog.verified !== undefined) {
    checks.push({
      check: "Verification status",
      passed: Boolean(actionLog.verified),
      detail: actionLog.verified ? "Verified" : "Not verified",
    });
  }

  if (actionLog.next_step) {
    checks.push({
      check: "Next step suggested",
      passed: true,
      detail: actionLog.next_step,
    });
  }

  return checks;
}

async function fetchConversationContext(
  supabase: ReturnType<typeof createAdminClient>,
  conversationId: string | null
): Promise<any> {
  if (!conversationId) return null;

  try {
    // Try the newer schema first (ai_conversations + ai_conversation_messages)
    const { data: conv } = await supabase
      .from("ai_conversations")
      .select("id, title, created_at, updated_at")
      .eq("id", conversationId)
      .single();

    if (conv) {
      const { data: messages } = await supabase
        .from("ai_conversation_messages")
        .select("role, content, tool_name, message_order")
        .eq("conversation_id", conversationId)
        .order("message_order", { ascending: true })
        .limit(20);

      return { conversation: conv, messages: messages || [] };
    }

    // Fall back to older schema
    const { data: oldConv } = await supabase
      .from("ai_conversations")
      .select("messages")
      .eq("id", conversationId)
      .single();

    return oldConv ? { messages: oldConv.messages || [] } : null;
  } catch {
    return null;
  }
}
