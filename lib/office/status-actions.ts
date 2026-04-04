'use server';

import { revalidatePath } from 'next/cache';
import { requireAuthenticatedUser } from '@/lib/auth/require-user';
import { syncInvoiceStatusesWithClient, syncQuoteStatusesWithClient } from '@/lib/office/maintenance';

export async function syncInvoiceStatuses() {
  const { supabase } = await requireAuthenticatedUser();
  await syncInvoiceStatusesWithClient(supabase);

  revalidatePath('/office/invoices');
  revalidatePath('/office/dashboard');
  revalidatePath('/office/reminders');
}

export async function syncQuoteStatuses() {
  const { supabase } = await requireAuthenticatedUser();
  await syncQuoteStatusesWithClient(supabase);

  revalidatePath('/office/quotes');
  revalidatePath('/office/dashboard');
}

/**
 * Centralised document status transition rules and validators.
 *
 * Each document type defines:
 *   - allowed statuses (from DB CHECK constraints)
 *   - valid transitions as a map: fromStatus → allowedActions
 *   - each action maps to a target status and optional guard function
 *
 * All status changes MUST go through validateTransition() before executing.
 */

export type DocumentType = "invoice" | "quote" | "purchase_order" | "credit_note";

export interface TransitionRule {
  action: string;
  toStatus: string;
  description: string;
  guard?: (doc: Record<string, any>) => string | null;
}

export interface TransitionResult {
  success: boolean;
  previousStatus: string;
  newStatus: string;
  action: string;
  error?: string;
}

// ============================================================
// INVOICE TRANSITIONS
// ============================================================
// Allowed statuses: Draft, Sent, Partially Paid, Paid, Overdue, Cancelled, Credit Note
//
// Rules:
//   - Paid is terminal (finance integrity)
//   - Cancelled can only reopen to Draft if amount_paid === 0
//   - Overdue is typically set by a cron job, but can be manually resolved
// ============================================================

const INVOICE_TRANSITIONS: Record<string, TransitionRule[]> = {
  Draft: [
    { action: "mark_sent", toStatus: "Sent", description: "Mark invoice as sent to client" },
    { action: "cancel", toStatus: "Cancelled", description: "Cancel draft invoice" },
  ],
  Sent: [
    { action: "mark_partially_paid", toStatus: "Partially Paid", description: "Record partial payment" },
    { action: "mark_paid", toStatus: "Paid", description: "Mark as fully paid" },
    { action: "mark_overdue", toStatus: "Overdue", description: "Mark as overdue (past due date)" },
    { action: "cancel", toStatus: "Cancelled", description: "Cancel sent invoice" },
    { action: "mark_draft", toStatus: "Draft", description: "Revert to draft" },
  ],
  "Partially Paid": [
    { action: "mark_paid", toStatus: "Paid", description: "Mark as fully paid" },
    { action: "mark_overdue", toStatus: "Overdue", description: "Mark as overdue" },
  ],
  Overdue: [
    { action: "mark_partially_paid", toStatus: "Partially Paid", description: "Record partial payment on overdue invoice" },
    { action: "mark_paid", toStatus: "Paid", description: "Mark as fully paid" },
    { action: "cancel", toStatus: "Cancelled", description: "Write off overdue invoice" },
    { action: "mark_sent", toStatus: "Sent", description: "Revert overdue to sent (e.g. after payment arrangement)" },
  ],
  Cancelled: [
    {
      action: "reopen",
      toStatus: "Draft",
      description: "Reopen cancelled invoice",
      guard: (doc) => {
        if (Number(doc.amount_paid || 0) > 0) {
          return "Cannot reopen an invoice that has payments recorded. Reverse payments first.";
        }
        return null;
      },
    },
  ],
  "Credit Note": [
    {
      action: "reopen",
      toStatus: "Sent",
      description: "Revert to sent after credit note review",
    },
  ],
};

// ============================================================
// QUOTE TRANSITIONS
// ============================================================
// Allowed statuses: Draft, Sent, Accepted, Declined, Rejected, Expired, Converted, Issued
//
// Rules:
//   - Converted and Issued are near-terminal
//   - Declined/Rejected/Expired can be reopened to Draft
//   - Accepted can be converted to invoice
// ============================================================

const QUOTE_TRANSITIONS: Record<string, TransitionRule[]> = {
  Draft: [
    { action: "mark_sent", toStatus: "Sent", description: "Send quote to client" },
    { action: "accept", toStatus: "Accepted", description: "Accept quote directly" },
  ],
  Sent: [
    { action: "accept", toStatus: "Accepted", description: "Accept quote" },
    { action: "decline", toStatus: "Declined", description: "Decline quote" },
    { action: "reject", toStatus: "Rejected", description: "Reject quote" },
    { action: "expire", toStatus: "Expired", description: "Mark quote as expired" },
    { action: "convert", toStatus: "Converted", description: "Convert quote to invoice" },
    { action: "mark_draft", toStatus: "Draft", description: "Revert to draft" },
  ],
  Accepted: [
    { action: "convert", toStatus: "Converted", description: "Convert accepted quote to invoice" },
  ],
  Declined: [
    { action: "reopen", toStatus: "Draft", description: "Reopen declined quote" },
  ],
  Rejected: [
    { action: "reopen", toStatus: "Draft", description: "Reopen rejected quote" },
  ],
  Expired: [
    { action: "reopen", toStatus: "Draft", description: "Reopen expired quote for revision" },
  ],
  Converted: [
    {
      action: "reopen",
      toStatus: "Draft",
      description: "Revert conversion (only if no invoice created yet)",
      guard: (doc) => {
        if (doc.converted_invoice_id) {
          return "Cannot revert — an invoice has already been created from this quote.";
        }
        return null;
      },
    },
  ],
};

// ============================================================
// PURCHASE ORDER TRANSITIONS
// ============================================================
// Allowed statuses: Draft, Sent, Acknowledged, Delivered, Cancelled
// ============================================================

const PO_TRANSITIONS: Record<string, TransitionRule[]> = {
  Draft: [
    { action: "mark_sent", toStatus: "Sent", description: "Send PO to supplier" },
    { action: "cancel", toStatus: "Cancelled", description: "Cancel draft PO" },
  ],
  Sent: [
    { action: "acknowledge", toStatus: "Acknowledged", description: "Mark PO as acknowledged by supplier" },
    { action: "cancel", toStatus: "Cancelled", description: "Cancel sent PO" },
  ],
  Acknowledged: [
    { action: "mark_delivered", toStatus: "Delivered", description: "Mark PO as delivered" },
    { action: "cancel", toStatus: "Cancelled", description: "Cancel acknowledged PO" },
  ],
  Delivered: [
    {
      action: "cancel",
      toStatus: "Cancelled",
      description: "Cancel delivered PO (e.g. return of goods)",
    },
  ],
  Cancelled: [
    { action: "reopen", toStatus: "Draft", description: "Reopen cancelled PO" },
  ],
};

// ============================================================
// CREDIT NOTE TRANSITIONS
// ============================================================
// Allowed statuses: Draft, Sent, Issued, Applied, Cancelled
//
// Rules:
//   - Applied is terminal (credit note has been applied to an invoice)
//   - Issued can be cancelled only if not yet applied
// ============================================================

const CN_TRANSITIONS: Record<string, TransitionRule[]> = {
  Draft: [
    { action: "issue", toStatus: "Issued", description: "Issue credit note" },
    { action: "mark_sent", toStatus: "Sent", description: "Send credit note to client" },
    { action: "cancel", toStatus: "Cancelled", description: "Cancel draft credit note" },
  ],
  Sent: [
    { action: "issue", toStatus: "Issued", description: "Issue credit note" },
    { action: "cancel", toStatus: "Cancelled", description: "Cancel sent credit note" },
  ],
  Issued: [
    { action: "apply", toStatus: "Applied", description: "Apply credit note against linked invoice (reduces invoice balance)" },
    {
      action: "cancel",
      toStatus: "Cancelled",
      description: "Cancel issued credit note",
      guard: (doc) => {
        if (doc.applied_invoice_id || Number(doc.applied_amount || 0) > 0) {
          return "Cannot cancel a credit note that has been applied to an invoice.";
        }
        return null;
      },
    },
  ],
  Applied: [],
  Cancelled: [
    { action: "reopen", toStatus: "Draft", description: "Reopen cancelled credit note" },
  ],
};

// ============================================================
// TRANSITION MAP
// ============================================================

const TRANSITION_MAP: Record<DocumentType, Record<string, TransitionRule[]>> = {
  invoice: INVOICE_TRANSITIONS,
  quote: QUOTE_TRANSITIONS,
  purchase_order: PO_TRANSITIONS,
  credit_note: CN_TRANSITIONS,
};

// ============================================================
// PUBLIC API
// ============================================================

export async function getValidActions(docType: DocumentType, currentStatus: string): Promise<TransitionRule[]> {
  const transitions = TRANSITION_MAP[docType]?.[currentStatus];
  if (!transitions) return [];
  return transitions;
}

export async function validateTransition(
  docType: DocumentType,
  currentStatus: string,
  action: string,
  doc: Record<string, any> = {}
): TransitionResult {
  const transitions = TRANSITION_MAP[docType]?.[currentStatus];

  if (!transitions || transitions.length === 0) {
    return {
      success: false,
      previousStatus: currentStatus,
      newStatus: currentStatus,
      action,
      error: `No status transitions are allowed from "${currentStatus}" for ${docType.replace("_", " ")}.`,
    };
  }

  const rule = transitions.find((r) => r.action === action);

  if (!rule) {
    const availableActions = transitions.map((r) => r.action).join(", ");
    return {
      success: false,
      previousStatus: currentStatus,
      newStatus: currentStatus,
      action,
      error: `Action "${action}" is not allowed from status "${currentStatus}". Allowed actions: ${availableActions}.`,
    };
  }

  if (rule.guard) {
    const guardError = rule.guard(doc);
    if (guardError) {
      return {
        success: false,
        previousStatus: currentStatus,
        newStatus: currentStatus,
        action,
        error: guardError,
      };
    }
  }

  return {
    success: true,
    previousStatus: currentStatus,
    newStatus: rule.toStatus,
    action,
  };
}

export async function getAllowedStatuses(docType: DocumentType): Promise<string[]> {
  const map = TRANSITION_MAP[docType];
  if (!map) return [];
  return Object.keys(map);
}

export async function describeAction(docType: DocumentType, action: string): Promise<TransitionRule | undefined> {
  const map = TRANSITION_MAP[docType];
  if (!map) return undefined;
  for (const rules of Object.values(map)) {
    const found = rules.find((r) => r.action === action);
    if (found) return found;
  }
  return undefined;
}
