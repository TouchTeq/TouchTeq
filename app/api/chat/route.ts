import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { requireAuthenticatedUser, isAuthError } from "@/lib/auth/require-user";
import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getActiveApiKey } from "@/lib/api-keys/resolver";
import { createAdminClient } from "@/lib/supabase/admin";
import { ActionResult, wrapWithActionResult, actionSuccess, actionFailed, actionNeedInfo, actionUnsupported, actionAttempted } from "@/lib/assistant-action";
import { SYSTEM_PROMPT_BASE } from "@/lib/assistant-prompt";
import { validateTransition } from "@/lib/office/status-actions";
import { checkRateLimit } from "@/lib/ai/rate-limiter";
import { logAIAction, parseActionResult, extractTargetInfo } from "@/lib/ai/action-logger";
import { recordToolExecution } from "@/lib/ai/tool-telemetry";
import { saveConversationToSupabase } from "@/lib/ai/conversations";

// Server-side Supabase client for data queries
function getSupabase() {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return createAdminClient();
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}

type AiMemoryRecord = { category: string; key: string; value: string };

type VerificationResult = {
  attempted: boolean;
  verified: boolean;
  status: "confirmed" | "could_not_verify" | "failed";
  verificationDetails: Record<string, any>;
};

function verifyResult(verified: boolean, details: Record<string, any>): VerificationResult {
  return {
    attempted: true,
    verified,
    status: verified ? "confirmed" : "could_not_verify",
    verificationDetails: details,
  };
}

// ============================================================
// VERIFICATION HELPERS — re-read database rows after writes
// to confirm intended state before returning success.
// ============================================================

async function verifyInvoice(supabase: any, invoiceId: string, expected: {
  invoice_number: string;
  client_id: string;
  lineItemCount: number;
}): Promise<VerificationResult> {
  const [
    { data: invoice, error },
    { count, error: countErr },
  ] = await Promise.all([
    supabase
      .from("invoices")
      .select("id, invoice_number, client_id, subtotal, vat_amount, total, status")
      .eq("id", invoiceId)
      .maybeSingle(),
    supabase
      .from("invoice_line_items")
      .select("id", { count: "exact", head: true })
      .eq("invoice_id", invoiceId),
  ]);

  if (error || !invoice) {
    return verifyResult(false, { reason: "Invoice row not found after insert", error: error?.message });
  }

  if (invoice.invoice_number !== expected.invoice_number) {
    return verifyResult(false, { reason: "invoice_number mismatch", expected: expected.invoice_number, actual: invoice.invoice_number });
  }
  if (invoice.client_id !== expected.client_id) {
    return verifyResult(false, { reason: "client_id mismatch", expected: expected.client_id, actual: invoice.client_id });
  }
  if (!invoice.subtotal || !invoice.total) {
    return verifyResult(false, { reason: "Missing totals", subtotal: invoice.subtotal, total: invoice.total });
  }

  if (countErr) {
    return verifyResult(false, { reason: "Could not count line items", error: countErr.message });
  }
  if (count !== expected.lineItemCount) {
    return verifyResult(false, { reason: "Line item count mismatch", expected: expected.lineItemCount, actual: count });
  }

  return verifyResult(true, {
    invoice_number: invoice.invoice_number,
    client_id: invoice.client_id,
    subtotal: invoice.subtotal,
    total: invoice.total,
    status: invoice.status,
    lineItemCount: count,
  });
}

async function verifyQuote(supabase: any, quoteId: string, expected: {
  quote_number: string;
  lineItemCount: number;
}): Promise<VerificationResult> {
  const [
    { data: quote, error },
    { count, error: countErr },
  ] = await Promise.all([
    supabase
      .from("quotes")
      .select("id, quote_number, client_id, subtotal, total, status")
      .eq("id", quoteId)
      .maybeSingle(),
    supabase
      .from("quote_line_items")
      .select("id", { count: "exact", head: true })
      .eq("quote_id", quoteId),
  ]);

  if (error || !quote) {
    return verifyResult(false, { reason: "Quote row not found after insert", error: error?.message });
  }

  if (quote.quote_number !== expected.quote_number) {
    return verifyResult(false, { reason: "quote_number mismatch", expected: expected.quote_number, actual: quote.quote_number });
  }

  if (countErr) {
    return verifyResult(false, { reason: "Could not count quote line items", error: countErr.message });
  }
  if (count !== expected.lineItemCount) {
    return verifyResult(false, { reason: "Line item count mismatch", expected: expected.lineItemCount, actual: count });
  }

  return verifyResult(true, {
    quote_number: quote.quote_number,
    client_id: quote.client_id,
    total: quote.total,
    status: quote.status,
    lineItemCount: count,
  });
}

async function verifyPurchaseOrder(supabase: any, poId: string, expected: {
  po_number: string;
  lineItemCount: number;
}): Promise<VerificationResult> {
  const [
    { data: po, error },
    { count, error: countErr },
  ] = await Promise.all([
    supabase
      .from("purchase_orders")
      .select("id, po_number, supplier_name, total, status")
      .eq("id", poId)
      .maybeSingle(),
    supabase
      .from("purchase_order_items")
      .select("id", { count: "exact", head: true })
      .eq("purchase_order_id", poId),
  ]);

  if (error || !po) {
    return verifyResult(false, { reason: "PO row not found after insert", error: error?.message });
  }

  if (po.po_number !== expected.po_number) {
    return verifyResult(false, { reason: "po_number mismatch", expected: expected.po_number, actual: po.po_number });
  }

  if (countErr) {
    return verifyResult(false, { reason: "Could not count PO line items", error: countErr.message });
  }
  if (count !== expected.lineItemCount) {
    return verifyResult(false, { reason: "Line item count mismatch", expected: expected.lineItemCount, actual: count });
  }

  return verifyResult(true, {
    po_number: po.po_number,
    supplier_name: po.supplier_name,
    total: po.total,
    status: po.status,
    lineItemCount: count,
  });
}

async function verifyCreditNote(supabase: any, cnId: string, expected: {
  cn_number: string;
  lineItemCount: number;
}): Promise<VerificationResult> {
  const [
    { data: cn, error },
    { count, error: countErr },
  ] = await Promise.all([
    supabase
      .from("credit_notes")
      .select("id, cn_number, client_id, total, status")
      .eq("id", cnId)
      .maybeSingle(),
    supabase
      .from("credit_note_items")
      .select("id", { count: "exact", head: true })
      .eq("credit_note_id", cnId),
  ]);

  if (error || !cn) {
    return verifyResult(false, { reason: "Credit note row not found after insert", error: error?.message });
  }

  if (cn.cn_number !== expected.cn_number) {
    return verifyResult(false, { reason: "cn_number mismatch", expected: expected.cn_number, actual: cn.cn_number });
  }

  if (countErr) {
    return verifyResult(false, { reason: "Could not count CN line items", error: countErr.message });
  }
  if (count !== expected.lineItemCount) {
    return verifyResult(false, { reason: "Line item count mismatch", expected: expected.lineItemCount, actual: count });
  }

  return verifyResult(true, {
    cn_number: cn.cn_number,
    client_id: cn.client_id,
    total: cn.total,
    status: cn.status,
    lineItemCount: count,
  });
}

async function verifyPayment(supabase: any, invoiceId: string, expected: {
  amountPaid: number;
  expectedStatus: string;
}): Promise<VerificationResult> {
  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("id, invoice_number, total, amount_paid, balance_due, status")
    .eq("id", invoiceId)
    .maybeSingle();

  if (error || !invoice) {
    return verifyResult(false, { reason: "Invoice not found after payment", error: error?.message });
  }

  const { count, error: payErr } = await supabase
    .from("payments")
    .select("id", { count: "exact", head: true })
    .eq("invoice_id", invoiceId)
    .gte("created_at", new Date(Date.now() - 60000).toISOString());

  if (payErr) {
    return verifyResult(false, { reason: "Could not verify payment record", error: payErr.message });
  }
  if (count === 0 || count === null) {
    return verifyResult(false, { reason: "No payment record found in last 60 seconds" });
  }

  const statusMatch = invoice.status === expected.expectedStatus;
  if (!statusMatch) {
    return verifyResult(false, {
      reason: "Invoice status mismatch after payment",
      expected: expected.expectedStatus,
      actual: invoice.status,
      amount_paid: invoice.amount_paid,
      balance_due: invoice.balance_due,
    });
  }

  return verifyResult(true, {
    invoice_number: invoice.invoice_number,
    amount_paid: invoice.amount_paid,
    balance_due: invoice.balance_due,
    status: invoice.status,
    paymentRecordsFound: count,
  });
}

async function verifyClient(supabase: any, clientId: string, expected: {
  company_name: string;
}): Promise<VerificationResult> {
  const { data: client, error } = await supabase
    .from("clients")
    .select("id, company_name, is_active")
    .eq("id", clientId)
    .maybeSingle();

  if (error || !client) {
    return verifyResult(false, { reason: "Client row not found after insert", error: error?.message });
  }

  if (client.company_name !== expected.company_name) {
    return verifyResult(false, { reason: "company_name mismatch", expected: expected.company_name, actual: client.company_name });
  }

  return verifyResult(true, {
    company_name: client.company_name,
    is_active: client.is_active,
  });
}

async function verifyExpense(supabase: any, expenseId: string, expected: {
  amount_inclusive: number;
  description: string;
}): Promise<VerificationResult> {
  const { data: expense, error } = await supabase
    .from("expenses")
    .select("id, expense_date, supplier_name, description, amount_inclusive, category")
    .eq("id", expenseId)
    .maybeSingle();

  if (error || !expense) {
    return verifyResult(false, { reason: "Expense row not found after insert", error: error?.message });
  }

  if (Math.abs(Number(expense.amount_inclusive) - expected.amount_inclusive) > 0.01) {
    return verifyResult(false, {
      reason: "amount_inclusive mismatch",
      expected: expected.amount_inclusive,
      actual: expense.amount_inclusive,
    });
  }
  if (expense.description !== expected.description) {
    return verifyResult(false, {
      reason: "description mismatch",
      expected: expected.description,
      actual: expense.description,
    });
  }

  return verifyResult(true, {
    description: expense.description,
    amount_inclusive: expense.amount_inclusive,
    category: expense.category,
    supplier_name: expense.supplier_name,
  });
}

async function verifyTrip(supabase: any, tripId: string, expected: {
  to_location: string;
  distance_km: number;
  purpose: string;
}): Promise<VerificationResult> {
  const { data: trip, error } = await supabase
    .from("travel_trips")
    .select("id, date, from_location, to_location, distance_km, purpose, vehicle_id")
    .eq("id", tripId)
    .maybeSingle();

  if (error || !trip) {
    return verifyResult(false, { reason: "Trip row not found after insert", error: error?.message });
  }

  if (trip.to_location !== expected.to_location) {
    return verifyResult(false, { reason: "to_location mismatch", expected: expected.to_location, actual: trip.to_location });
  }
  if (Math.abs(Number(trip.distance_km) - expected.distance_km) > 0.01) {
    return verifyResult(false, {
      reason: "distance_km mismatch",
      expected: expected.distance_km,
      actual: trip.distance_km,
    });
  }
  if (trip.purpose !== expected.purpose) {
    return verifyResult(false, { reason: "purpose mismatch", expected: expected.purpose, actual: trip.purpose });
  }

  return verifyResult(true, {
    to_location: trip.to_location,
    distance_km: trip.distance_km,
    purpose: trip.purpose,
    from_location: trip.from_location,
  });
}

async function verifyFuelLog(supabase: any, fuelId: string, expected: {
  supplier_name: string;
  total_amount: number;
}): Promise<VerificationResult> {
  const { data: fuel, error } = await supabase
    .from("fuel_logs")
    .select("id, date, supplier_name, litres, total_amount, vehicle_id")
    .eq("id", fuelId)
    .maybeSingle();

  if (error || !fuel) {
    return verifyResult(false, { reason: "Fuel log row not found after insert", error: error?.message });
  }

  if (fuel.supplier_name !== expected.supplier_name) {
    return verifyResult(false, { reason: "supplier_name mismatch", expected: expected.supplier_name, actual: fuel.supplier_name });
  }
  if (Math.abs(Number(fuel.total_amount) - expected.total_amount) > 0.01) {
    return verifyResult(false, {
      reason: "total_amount mismatch",
      expected: expected.total_amount,
      actual: fuel.total_amount,
    });
  }

  return verifyResult(true, {
    supplier_name: fuel.supplier_name,
    total_amount: fuel.total_amount,
    litres: fuel.litres,
  });
}

async function verifyMemory(supabase: any, expected: {
  category: string;
  key: string;
  value: string;
}): Promise<VerificationResult> {
  const { data: memory, error } = await supabase
    .from("ai_memory")
    .select("category, key, value, confidence")
    .eq("category", expected.category)
    .eq("key", expected.key)
    .maybeSingle();

  if (error || !memory) {
    return verifyResult(false, { reason: "Memory row not found after upsert", error: error?.message });
  }

  if (memory.value !== expected.value) {
    return verifyResult(false, {
      reason: "value mismatch",
      expected: expected.value,
      actual: memory.value,
    });
  }

  return verifyResult(true, {
    category: memory.category,
    key: memory.key,
    value: memory.value,
    confidence: memory.confidence,
  });
}

// ============================================================
// RECORD RESOLVERS — exact-match-first lookup for write actions.
// Never silently pick a fuzzy match for writes/edits/payments.
// ============================================================

type ResolveResult<T> =
  | { kind: "exact"; record: T }
  | { kind: "fuzzy_single"; record: T }
  | { kind: "ambiguous"; candidates: T[] }
  | { kind: "not_found" };

async function resolveClientForWrite(supabase: any, name: string): Promise<ResolveResult<{
  id: string;
  company_name: string;
  email: string | null;
  phone: string | null;
  recent_invoice: string | null;
}>> {
  const trimmed = name.trim();
  if (!trimmed) return { kind: "not_found" };

  // 1. Exact match (case-insensitive)
  const { data: exact } = await supabase
    .from("clients")
    .select("id, company_name, email, phone")
    .ilike("company_name", trimmed)
    .eq("is_active", true)
    .maybeSingle();

  if (exact) {
    const { data: recent } = await supabase
      .from("invoices")
      .select("invoice_number")
      .eq("client_id", exact.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return {
      kind: "exact",
      record: {
        id: exact.id,
        company_name: exact.company_name,
        email: exact.email,
        phone: exact.phone,
        recent_invoice: recent?.invoice_number || null,
      },
    };
  }

  // 2. Fuzzy match — collect all partial matches
  const { data: fuzzy } = await supabase
    .from("clients")
    .select("id, company_name, email, phone")
    .ilike("company_name", `%${trimmed}%`)
    .eq("is_active", true)
    .limit(10);

  if (!fuzzy || fuzzy.length === 0) {
    return { kind: "not_found" };
  }

  if (fuzzy.length === 1) {
    const c = fuzzy[0];
    const { data: recent } = await supabase
      .from("invoices")
      .select("invoice_number")
      .eq("client_id", c.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return {
      kind: "fuzzy_single",
      record: {
        id: c.id,
        company_name: c.company_name,
        email: c.email,
        phone: c.phone,
        recent_invoice: recent?.invoice_number || null,
      },
    };
  }

  // Multiple matches — return candidates for disambiguation
  const candidates = await Promise.all(
    fuzzy.map(async (c: any) => {
      const { data: recent } = await supabase
        .from("invoices")
        .select("invoice_number")
        .eq("client_id", c.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      return {
        id: c.id,
        company_name: c.company_name,
        email: c.email,
        phone: c.phone,
        recent_invoice: recent?.invoice_number || null,
      };
    })
  );

  return { kind: "ambiguous", candidates };
}

async function resolveInvoiceForWrite(supabase: any, reference: string): Promise<ResolveResult<{
  id: string;
  invoice_number: string;
  client_name: string;
  total: number;
  amount_paid: number;
  balance_due: number;
  status: string;
}>> {
  const ref = reference.trim().toUpperCase();
  if (!ref) return { kind: "not_found" };

  // 1. Exact match on invoice_number
  const { data: exact } = await supabase
    .from("invoices")
    .select("id, invoice_number, total, amount_paid, balance_due, status, clients(company_name)")
    .eq("invoice_number", ref)
    .maybeSingle();

  if (exact) {
    return {
      kind: "exact",
      record: {
        id: exact.id,
        invoice_number: exact.invoice_number,
        client_name: (exact as any).clients?.company_name || "Unknown",
        total: Number(exact.total) || 0,
        amount_paid: Number(exact.amount_paid) || 0,
        balance_due: Number(exact.balance_due) || 0,
        status: exact.status,
      },
    };
  }

  // 2. Fuzzy match — partial ilike
  const { data: fuzzy } = await supabase
    .from("invoices")
    .select("id, invoice_number, total, amount_paid, balance_due, status, clients(company_name)")
    .ilike("invoice_number", `%${ref}%`)
    .limit(10);

  if (!fuzzy || fuzzy.length === 0) {
    return { kind: "not_found" };
  }

  if (fuzzy.length === 1) {
    const inv = fuzzy[0];
    return {
      kind: "fuzzy_single",
      record: {
        id: inv.id,
        invoice_number: inv.invoice_number,
        client_name: (inv as any).clients?.company_name || "Unknown",
        total: Number(inv.total) || 0,
        amount_paid: Number(inv.amount_paid) || 0,
        balance_due: Number(inv.balance_due) || 0,
        status: inv.status,
      },
    };
  }

  return {
    kind: "ambiguous",
    candidates: fuzzy.map((inv: any) => ({
      id: inv.id,
      invoice_number: inv.invoice_number,
      client_name: (inv as any).clients?.company_name || "Unknown",
      total: Number(inv.total) || 0,
      amount_paid: Number(inv.amount_paid) || 0,
      balance_due: Number(inv.balance_due) || 0,
      status: inv.status,
    })),
  };
}

async function resolveQuoteForWrite(supabase: any, reference: string): Promise<ResolveResult<{
  id: string;
  quote_number: string;
  client_name: string;
  total: number;
  status: string;
}>> {
  const ref = reference.trim().toUpperCase();
  if (!ref) return { kind: "not_found" };

  // 1. Exact match
  const { data: exact } = await supabase
    .from("quotes")
    .select("id, quote_number, total, status, clients(company_name)")
    .eq("quote_number", ref)
    .maybeSingle();

  if (exact) {
    return {
      kind: "exact",
      record: {
        id: exact.id,
        quote_number: exact.quote_number,
        client_name: (exact as any).clients?.company_name || "Unknown",
        total: Number(exact.total) || 0,
        status: exact.status,
      },
    };
  }

  // 2. Fuzzy
  const { data: fuzzy } = await supabase
    .from("quotes")
    .select("id, quote_number, total, status, clients(company_name)")
    .ilike("quote_number", `%${ref}%`)
    .limit(10);

  if (!fuzzy || fuzzy.length === 0) return { kind: "not_found" };
  if (fuzzy.length === 1) {
    const q = fuzzy[0];
    return {
      kind: "fuzzy_single",
      record: {
        id: q.id,
        quote_number: q.quote_number,
        client_name: (q as any).clients?.company_name || "Unknown",
        total: Number(q.total) || 0,
        status: q.status,
      },
    };
  }

  return {
    kind: "ambiguous",
    candidates: fuzzy.map((q: any) => ({
      id: q.id,
      quote_number: q.quote_number,
      client_name: (q as any).clients?.company_name || "Unknown",
      total: Number(q.total) || 0,
      status: q.status,
    })),
  };
}

async function resolvePOForWrite(supabase: any, reference: string): Promise<ResolveResult<{
  id: string;
  po_number: string;
  supplier_name: string;
  total: number;
  status: string;
}>> {
  const ref = reference.trim().toUpperCase();
  if (!ref) return { kind: "not_found" };

  // 1. Exact match
  const { data: exact } = await supabase
    .from("purchase_orders")
    .select("id, po_number, supplier_name, total, status")
    .eq("po_number", ref)
    .maybeSingle();

  if (exact) {
    return {
      kind: "exact",
      record: {
        id: exact.id,
        po_number: exact.po_number,
        supplier_name: exact.supplier_name,
        total: Number(exact.total) || 0,
        status: exact.status,
      },
    };
  }

  // 2. Fuzzy
  const { data: fuzzy } = await supabase
    .from("purchase_orders")
    .select("id, po_number, supplier_name, total, status")
    .ilike("po_number", `%${ref}%`)
    .limit(10);

  if (!fuzzy || fuzzy.length === 0) return { kind: "not_found" };
  if (fuzzy.length === 1) {
    const po = fuzzy[0];
    return {
      kind: "fuzzy_single",
      record: {
        id: po.id,
        po_number: po.po_number,
        supplier_name: po.supplier_name,
        total: Number(po.total) || 0,
        status: po.status,
      },
    };
  }

  return {
    kind: "ambiguous",
    candidates: fuzzy.map((po: any) => ({
      id: po.id,
      po_number: po.po_number,
      supplier_name: po.supplier_name,
      total: Number(po.total) || 0,
      status: po.status,
    })),
  };
}

async function resolveCreditNoteForWrite(supabase: any, reference: string): Promise<ResolveResult<{
  id: string;
  cn_number: string;
  client_name: string;
  total: number;
  status: string;
  invoice_id: string | null;
}>> {
  const ref = reference.trim().toUpperCase();
  if (!ref) return { kind: "not_found" };

  // 1. Exact match
  const { data: exact } = await supabase
    .from("credit_notes")
    .select("id, cn_number, total, status, invoice_id, clients(company_name)")
    .eq("cn_number", ref)
    .maybeSingle();

  if (exact) {
    return {
      kind: "exact",
      record: {
        id: exact.id,
        cn_number: exact.cn_number,
        client_name: (exact as any).clients?.company_name || "Unknown",
        total: Number(exact.total) || 0,
        status: exact.status,
        invoice_id: exact.invoice_id,
      },
    };
  }

  // 2. Fuzzy
  const { data: fuzzy } = await supabase
    .from("credit_notes")
    .select("id, cn_number, total, status, invoice_id, clients(company_name)")
    .ilike("cn_number", `%${ref}%`)
    .limit(10);

  if (!fuzzy || fuzzy.length === 0) return { kind: "not_found" };
  if (fuzzy.length === 1) {
    const cn = fuzzy[0];
    return {
      kind: "fuzzy_single",
      record: {
        id: cn.id,
        cn_number: cn.cn_number,
        client_name: (cn as any).clients?.company_name || "Unknown",
        total: Number(cn.total) || 0,
        status: cn.status,
        invoice_id: cn.invoice_id,
      },
    };
  }

  return {
    kind: "ambiguous",
    candidates: fuzzy.map((cn: any) => ({
      id: cn.id,
      cn_number: cn.cn_number,
      client_name: (cn as any).clients?.company_name || "Unknown",
      total: Number(cn.total) || 0,
      status: cn.status,
    })),
  };
}

async function executeSaveMemory(args: any): Promise<string> {
  const supabase = getSupabase();
  const category = String(args.category || "business_rule").trim();
  const key = String(args.key || "").trim();
  const value = String(args.value || "").trim();
  const confidence = Math.min(1.0, Math.max(0.0, Number(args.confidence ?? 1.0)));

  if (!key || !value) {
    return wrapWithActionResult(
      actionFailed({ action: "save_memory", targetType: "ai_memory", toolUsed: "saveMemory", error: "key and value are required.", nextStep: "Please provide both a key and a value to remember." })
    );
  }

  const { error } = await supabase
    .from("ai_memory")
    .upsert({ category, key, value, confidence }, { onConflict: "category,key" });

  if (error) {
    return wrapWithActionResult(
      actionFailed({ action: "save_memory", targetType: "ai_memory", toolUsed: "saveMemory", error: error.message })
    );
  }

  return wrapWithActionResult(
    actionSuccess({
      action: "save_memory",
      targetType: "ai_memory",
      targetReference: key,
      toolUsed: "saveMemory",
      summary: `Saved "${key}" in ${category}: ${value}`,
      verified: true,
    }),
    { saved: { category, key, value } }
  );
}

const CHAT_MODEL = "gemini-3.1-flash-lite-preview";
const TTS_MODEL = "gemini-2.5-flash-preview-tts";
const DEFAULT_VOICE = "Aoede";
const BRITISH_VOICE = "Kore";

// ============================================================
// SYSTEM PROMPT — unified canonical instruction sent to the model.
// Built by buildSystemInstruction() which merges the static
// operational rules with per-session user preferences.
// ============================================================

// SYSTEM_PROMPT_BASE is imported from "@/lib/assistant-prompt"

type AssistantPreferences = {
  requireConfirmationBeforeSend: boolean;
  conciseResponses: boolean;
  languagePreference: "south_african_english" | "british_english";
  alwaysIncludeVatInvoice: boolean;
  alwaysIncludeVatQuote: boolean;
};

type ActiveDocumentSession = {
  documentType: "invoice" | "quote" | "certificate" | null;
  documentId: string | null;
  documentData: Record<string, any> | null;
  isOpen: boolean;
} | null;

type AttachmentInput = {
  name?: string;
  type?: string;
  size?: number;
  dataUrl?: string;
};

type SessionContextInput = {
  businessProfile?: {
    business_name?: string;
    vat_number?: string;
    address?: string;
    email?: string;
  } | null;
  clients?: Array<{
    id?: string;
    company_name?: string;
    email?: string;
    phone?: string;
  }>;
  aiMemory?: AiMemoryRecord[];
};

function parseAssistantPreferences(value: any): AssistantPreferences {
  return {
    requireConfirmationBeforeSend: value?.requireConfirmationBeforeSend !== false,
    conciseResponses: value?.conciseResponses !== false,
    languagePreference: value?.languagePreference === "british_english" ? "british_english" : "south_african_english",
    alwaysIncludeVatInvoice: value?.alwaysIncludeVatInvoice !== false,
    alwaysIncludeVatQuote: value?.alwaysIncludeVatQuote !== false,
  };
}

// ============================================================
// SYSTEM INSTRUCTION BUILDER
//
// This is the ONLY function that constructs the system prompt.
// It merges:
//   1. SYSTEM_PROMPT_BASE — static operational rules, decision tree, tool mapping
//   2. Active document session context — live state of open documents
//   3. User preference injections — send confirmation mode, brevity, language, VAT defaults
//
// Old helpers that were removed:
//   - buildBehaviorInstruction() — was a redundant subset that only used BEHAVIOR_PROMPT
//   - Old buildSystemInstruction() — was defined but never called
//   - BEHAVIOR_PROMPT constant — was a condensed duplicate of SYSTEM_PROMPT_BASE
// ============================================================

function buildSystemInstruction(
  preferences: AssistantPreferences,
  activeDocumentSession: ActiveDocumentSession
): string {
  // --- Section 1: Static operational rules (always sent) ---
  const sections: string[] = [SYSTEM_PROMPT_BASE.trim()];

  // --- Section 2: Active document session (dynamic per-request) ---
  if (activeDocumentSession?.isOpen && activeDocumentSession.documentType) {
    const docType = activeDocumentSession.documentType;
    const docData = activeDocumentSession.documentData;
    const lineItems = Array.isArray(docData?.lineItems) ? docData.lineItems : [];
    const itemCount = lineItems.length;
    const total = lineItems.reduce((sum: number, item: any) => {
      const qty = Number(item?.quantity ?? 0);
      const price = Number(item?.unitPrice ?? item?.unit_price ?? 0);
      return sum + qty * price;
    }, 0);

    sections.push(`## ACTIVE DOCUMENT SESSION (CRITICAL)
A ${docType} is currently OPEN in the user's browser. Document ID: ${activeDocumentSession.documentId || 'new'}.
Current state: ${itemCount} line items, subtotal R${total.toFixed(2)}.
${lineItems.length > 0 ? `Current line items:\n${lineItems.map((item: any, i: number) => `  ${i + 1}. ${item.description || 'Untitled'} — Qty: ${item.quantity ?? 1}, Price: R${Number(item.unitPrice ?? item.unit_price ?? 0).toFixed(2)}`).join('\n')}` : 'No line items yet.'}
${docData?.clientName ? `Client: ${docData.clientName}` : ''}

RULES FOR THIS SESSION:
- Do NOT call openInvoiceManager or openQuotationBuilder — the document is already open.
- Use addLineItem() to add new items to this document.
- Use removeLineItem() to remove items (by index, 0-based).
- Use updateLineItem() to change description, quantity, or unitPrice of existing items.
- Use updateDocumentField() to change client name, notes, dates, etc.
- Use saveDocument() when the user wants to save.
- Use closeDocument() when the user wants to close.
- Confirm each action with a brief summary including updated item count and total.`);
  } else {
    sections.push(`## NO ACTIVE DOCUMENT
No invoice, quote, or certificate is currently open. If the user wants to create or edit a document:
- For new documents: Extract details (client/supplier, type, site, line items, prices), confirm with user, then call draftInvoice, draftQuote, draftPurchaseOrder, or draftCreditNote.
- For existing documents: Use openExistingDocument() with the reference number (INV-, QT-, CERT-).
- For all other actions: Use the appropriate tool directly (logTrip, createClient, logExpense, recordPayment, queryBusinessData, etc.).`);
  }

  // --- Section 3: User preference injections (dynamic per-session) ---

  // Send confirmation mode
  const modeInstruction = preferences.requireConfirmationBeforeSend
    ? `Before any send action, always call stageEmailForConfirmation and wait for explicit user confirmation.`
    : `When all required send details are present, call stageEmailForConfirmation immediately so the app can execute send without extra conversational confirmation.`;

  // Response brevity
  const brevityInstruction = preferences.conciseResponses
    ? `Keep every normal response to a maximum of 3 sentences.`
    : `You may provide full detailed responses when needed.`;

  // Language preference
  const languageInstruction =
    preferences.languagePreference === "british_english"
      ? `Use British English spelling and phrasing.`
      : `Use South African English phrasing and local business tone.`;

  // VAT defaults
  const vatInstruction = `For invoices, ${preferences.alwaysIncludeVatInvoice ? 'default to including VAT (15%) unless the user explicitly asks to remove it' : 'ask whether VAT (15%) should be included before finalising totals'}. For quotations, ${preferences.alwaysIncludeVatQuote ? 'default to including VAT (15%) unless the user explicitly asks to remove it' : 'ask whether VAT (15%) should be included before finalising totals'}.`;

  sections.push(modeInstruction);
  sections.push(brevityInstruction);
  sections.push(languageInstruction);
  sections.push(vatInstruction);

  return sections.join("\n\n");
}

const tools = [
  {
    functionDeclarations: [
      // === SERVER-SIDE DOCUMENT GENERATION ===
      {
        name: "draftQuote",
        description: "Creates a new Quote directly in the database. ALWAYS use this when the user asks to generate, create, make, or draft a quote. This is completely automated and executes server-side.",
        parametersJsonSchema: {
          type: "object",
          properties: {
            clientName: { type: "string", description: "Name of the client." },
            lineItems: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  description: { type: "string" },
                  quantity: { type: "number" },
                  unitPrice: { type: "number" },
                },
                required: ["description", "quantity", "unitPrice"]
              },
            },
            notes: { type: "string", description: "Additional notes for the quote." },
          },
          required: ["clientName", "lineItems"],
        },
      },
      {
        name: "draftInvoice",
        description: "Creates a new Invoice directly in the database. ALWAYS use this when the user asks to generate, create, make, or draft an invoice. This is completely automated and executes server-side.",
        parametersJsonSchema: {
          type: "object",
          properties: {
            clientName: { type: "string", description: "Name of the client." },
            lineItems: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  description: { type: "string" },
                  quantity: { type: "number" },
                  unitPrice: { type: "number" },
                },
                required: ["description", "quantity", "unitPrice"]
              },
            },
            notes: { type: "string" },
            isRecurring: { type: "boolean" },
            recurringFrequency: { type: "string", description: "'weekly', 'monthly', 'quarterly', 'annually'" },
          },
          required: ["clientName", "lineItems"],
        },
      },
      {
        name: "draftPurchaseOrder",
        description: "Creates a new Purchase Order directly in the database. Use when the user asks to generate a PO for a supplier.",
        parametersJsonSchema: {
          type: "object",
          properties: {
            supplierName: { type: "string" },
            lineItems: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  description: { type: "string" },
                  quantity: { type: "number" },
                  unitPrice: { type: "number" },
                },
                required: ["description", "quantity", "unitPrice"]
              },
            },
            notes: { type: "string" },
          },
          required: ["supplierName", "lineItems"],
        },
      },
      {
        name: "draftCreditNote",
        description: "Creates a new Credit Note directly in the database. Usually linked to an existing invoice.",
        parametersJsonSchema: {
          type: "object",
          properties: {
            clientName: { type: "string" },
            invoiceReference: { type: "string", description: "The INV- numerical reference number if known." },
            reason: { type: "string" },
            lineItems: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  description: { type: "string" },
                  quantity: { type: "number" },
                  unitPrice: { type: "number" },
                },
                required: ["description", "quantity", "unitPrice"]
              },
            },
          },
          required: ["clientName", "lineItems"],
        },
      },

      // === DOCUMENT CREATION (only when no document is open) ===
      {
        name: "openQuotationBuilder",
        description: "Opens the quotation builder UI only. Use this ONLY when the user explicitly asks to open the builder, form, or blank quotation editor. Do not use this to actually create a quote in the database.",
        parametersJsonSchema: {
          type: "object",
          properties: {
            clientName: { type: "string", description: "Name of the client. Strip numerical digits." },
            lineItems: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  description: { type: "string" },
                  quantity: { type: "number" },
                  unitPrice: { type: "number" },
                },
              },
            },
            notes: { type: "string", description: "Additional notes or scope." },
          },
          required: ["clientName"],
        },
      },
      {
        name: "openInvoiceManager",
        description: "Opens the invoice builder UI only. Use this ONLY when the user explicitly asks to open the builder, form, or blank invoice editor. Do not use this to actually create an invoice in the database.",
        parametersJsonSchema: {
          type: "object",
          properties: {
            clientName: { type: "string", description: "Name of the client." },
            lineItems: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  description: { type: "string" },
                  quantity: { type: "number" },
                  unitPrice: { type: "number" },
                },
              },
            },
            invoiceDate: { type: "string", description: "ISO date format (YYYY-MM-DD)." },
            dueDate: { type: "string", description: "ISO date format (YYYY-MM-DD)." },
            notes: { type: "string" },
          },
          required: ["clientName"],
        },
      },
      {
        name: "generateCertificate",
        description: "Opens the certificate builder to create a NEW compliance document. Supported types: commissioning, hac, sat, as_built, installation, maintenance, sil.",
        parametersJsonSchema: {
          type: "object",
          properties: {
            clientName: { type: "string", description: "Name of the client." },
            certificateType: { type: "string", description: "Type: 'commissioning', 'hac', 'sat', 'as_built', 'installation', 'maintenance', 'sil'." },
            siteName: { type: "string", description: "Name of the facility or site." },
            siteAddress: { type: "string", description: "Physical address of the site." },
            projectReference: { type: "string", description: "Project reference number." },
            inspectionDate: { type: "string", description: "ISO date (YYYY-MM-DD)." },
            notes: { type: "string" },
          },
          required: ["clientName", "certificateType"],
        },
      },

      // === DIRECT DOCUMENT EDITING (for open documents) ===
      {
        name: "addLineItem",
        description: "Adds a new line item to the currently open invoice or quote. Use this when the user asks to add items to an already-open document. Call once per item to add.",
        parametersJsonSchema: {
          type: "object",
          properties: {
            description: { type: "string", description: "Description of the line item." },
            quantity: { type: "number", description: "Quantity. Default 1 if not specified." },
            unitPrice: { type: "number", description: "Unit price in ZAR. Default 0 if not specified." },
          },
          required: ["description"],
        },
      },
      {
        name: "removeLineItem",
        description: "Removes a line item from the currently open invoice or quote by its index (0-based). Line 1 = index 0, line 2 = index 1, etc.",
        parametersJsonSchema: {
          type: "object",
          properties: {
            index: { type: "number", description: "0-based index of the line item to remove. Line 1 = index 0." },
          },
          required: ["index"],
        },
      },
      {
        name: "updateLineItem",
        description: "Updates a specific field of a line item in the currently open document. Can update description, quantity, or unitPrice.",
        parametersJsonSchema: {
          type: "object",
          properties: {
            index: { type: "number", description: "0-based index of the line item to update. Line 1 = index 0." },
            field: { type: "string", description: "Field to update: 'description', 'quantity', or 'unitPrice'." },
            value: { type: "string", description: "The new value. Numbers should be provided as strings (e.g., '5' for quantity, '15000' for price)." },
          },
          required: ["index", "field", "value"],
        },
      },
      {
        name: "updateDocumentField",
        description: "Updates a top-level field on the currently open document (e.g., clientName, notes, issue_date, due_date, internal_notes).",
        parametersJsonSchema: {
          type: "object",
          properties: {
            field: { type: "string", description: "Field name: 'clientName', 'notes', 'internal_notes', 'issue_date', 'due_date'." },
            value: { type: "string", description: "The new value for the field." },
          },
          required: ["field", "value"],
        },
      },

      // === DOCUMENT LIFECYCLE ===
      {
        name: "saveDocument",
        description: "Saves the currently open invoice or quote. Use when the user says 'save', 'save it', 'save the invoice', etc.",
        parametersJsonSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "closeDocument",
        description: "Closes the currently open invoice or quote (saves first). Use when the user says 'close', 'close the invoice', 'I'm done with this', etc.",
        parametersJsonSchema: {
          type: "object",
          properties: {
            navigateTo: { type: "string", description: "Optional destination after closing: 'dashboard', 'invoices', 'quotes', 'clients', etc." },
          },
        },
      },

      // === NAVIGATION ===
      {
        name: "navigateTo",
        description: "Navigates to a specific section of the Touch Teq Office dashboard. Use when the user says 'go to dashboard', 'open clients', 'take me to reports', 'show expenses', etc.",
        parametersJsonSchema: {
          type: "object",
          properties: {
            destination: {
              type: "string",
              description: "The destination to navigate to. Valid values: 'dashboard', 'invoices', 'quotes', 'clients', 'expenses', 'reports', 'settings', 'emails', 'travel', 'vat', 'reminders', 'timeline', 'certificates'.",
            },
          },
          required: ["destination"],
        },
      },
      {
        name: "openExistingDocument",
        description: "Opens an existing invoice or quote by its reference number (e.g., INV-0001, QT-0023). Use when the user says 'open invoice INV-0001' or 'edit quote QT-0023'.",
        parametersJsonSchema: {
          type: "object",
          properties: {
            documentType: { type: "string", description: "'invoice', 'quote', or 'certificate'." },
            reference: { type: "string", description: "The document reference number (e.g., 'INV-0001', 'QT-0023', 'CERT-COM-2025-001')." },
          },
          required: ["documentType", "reference"],
        },
      },

      // === EMAIL ===
      {
        name: "composeEmail",
        description: "Opens the email drafting tool with pre-populated content.",
        parametersJsonSchema: {
          type: "object",
          properties: {
            to: { type: "string", description: "Recipient email address." },
            subject: { type: "string" },
            body: { type: "string" },
          },
          required: ["to", "subject", "body"],
        },
      },
      {
        name: "stageEmailForConfirmation",
        description: "Prepares an email (quotation, invoice, or message) for the user to confirm before sending via Brevo. Always call this before sending — never send directly.",
        parametersJsonSchema: {
          type: "object",
          properties: {
            recipientEmail: { type: "string", description: "The resolved email address of the recipient." },
            recipientName: { type: "string", description: "The name of the recipient." },
            subject: { type: "string", description: "Email subject line." },
            htmlBody: { type: "string", description: "The full HTML content of the email, including branding and professional formatting." },
            documentType: { type: "string", description: "Type of document: 'quotation', 'invoice', 'certificate', or 'message'." },
            documentReference: { type: "string", description: "The reference number (e.g., QT-0001 or INV-0001)." },
          },
          required: ["recipientEmail", "subject", "htmlBody"],
        },
      },

      // === TRAVEL LOGBOOK ===
      {
        name: "logTrip",
        description: "Logs a business trip to the travel logbook. Use when user says things like 'log a trip', 'record my travel', 'I drove to...'. This executes server-side and saves directly — no confirmation needed.",
        parametersJsonSchema: {
          type: "object",
          properties: {
            date: { type: "string", description: "Date of the trip in ISO format (YYYY-MM-DD). Default to today if not specified." },
            destination: { type: "string", description: "The destination or 'to' location. Keep as-is including numbers." },
            distanceKm: { type: "number", description: "Distance in kilometres." },
            purpose: { type: "string", description: "Purpose of the trip, e.g. 'Site visit', 'Client meeting', 'Inspection'. Keep as-is." },
            clientName: { type: "string", description: "Name of the client visited (optional)." },
            vehicleName: { type: "string", description: "Name or description of the vehicle used (optional). If not specified, the default vehicle will be used." },
            fromLocation: { type: "string", description: "The starting location. Default to 'Office' if not specified." },
          },
          required: ["destination", "distanceKm", "purpose"],
        },
      },
      {
        name: "logFuelPurchase",
        description: "Logs a fuel purchase to the fuel tracker. Extracts date, station, litres, price, and total amount. This triggers a confirmation UI for the user to verify details before saving.",
        parametersJsonSchema: {
          type: "object",
          properties: {
            date: { type: "string", description: "Date of purchase (YYYY-MM-DD)." },
            supplierName: { type: "string", description: "Name of the fuel station / supplier." },
            fuelType: { type: "string", description: "Type: 'Diesel', 'Petrol 95' or 'Petrol 93'." },
            litres: { type: "number", description: "Number of litres purchased." },
            pricePerLitre: { type: "number", description: "Price per litre in ZAR." },
            totalAmount: { type: "number", description: "Total spend in ZAR." },
            odometer: { type: "number", description: "Odometer reading at fill-up." },
            vehicleName: { type: "string", description: "Description or registration of the vehicle." },
            paymentMethod: { type: "string", description: "Method: 'Card', 'Cash', or 'Company Account'." },
          },
          required: ["supplierName", "totalAmount"],
        },
      },

      // === DATA QUERYING ===
      {
        name: "queryBusinessData",
        description: "Queries real business data from the database to answer the user's question. Call this whenever the user asks about their financial data, invoices, quotes, clients, expenses, travel, certificates, or any business metrics. This returns real data — never make up numbers.",
        parametersJsonSchema: {
          type: "object",
          properties: {
            queryType: {
              type: "string",
              description: "Type of query: 'revenue_summary', 'invoice_list', 'overdue_invoices', 'quote_list', 'client_list', 'client_lookup', 'client_data_quality', 'expense_summary', 'travel_summary', 'certificate_list', 'vat_summary', 'dashboard_stats', 'purchase_order_list', 'credit_note_list', 'recurring_invoice_list', 'communication_log'.",
            },
            filters: {
              type: "object",
              description: "Optional filters like { clientName: '...', status: '...', dateFrom: 'YYYY-MM-DD', dateTo: 'YYYY-MM-DD', limit: 10 }.",
              properties: {
                clientName: { type: "string" },
                status: { type: "string" },
                dateFrom: { type: "string" },
                dateTo: { type: "string" },
                limit: { type: "number" },
              },
            },
          },
          required: ["queryType"],
        },
      },

      // === CLIENT MANAGEMENT ===
      {
        name: "createClient",
        description: "Creates a new client in the client database. Use when user says 'add a client', 'new client', 'register ABC company'. Executes server-side and saves directly.",
        parametersJsonSchema: {
          type: "object",
          properties: {
            companyName: { type: "string", description: "Company or client name. Required." },
            contactPerson: { type: "string", description: "Primary contact person's name." },
            email: { type: "string", description: "Email address." },
            phone: { type: "string", description: "Phone number." },
            physicalAddress: { type: "string", description: "Physical address." },
            vatNumber: { type: "string", description: "VAT registration number." },
            notes: { type: "string", description: "Additional notes." },
          },
          required: ["companyName"],
        },
      },
      {
        name: "updateClient",
        description: "Updates an existing client's details. Use when user says 'update client', 'change client email', 'fix client phone', 'update Sasol's address'. Only whitelisted fields can be updated. Executes server-side with exact-match-first lookup.",
        parametersJsonSchema: {
          type: "object",
          properties: {
            clientName: { type: "string", description: "The client company name to identify the client. Exact match preferred." },
            contactPerson: { type: "string", description: "Updated contact person name." },
            email: { type: "string", description: "Updated email address." },
            phone: { type: "string", description: "Updated phone number." },
            physicalAddress: { type: "string", description: "Updated physical address." },
            vatNumber: { type: "string", description: "Updated VAT registration number." },
            category: { type: "string", description: "Updated client category." },
            notes: { type: "string", description: "Updated notes (appends to existing)." },
          },
          required: ["clientName"],
        },
      },
      {
        name: "addClientCommunication",
        description: "Logs a communication event for a client. Use when user says 'log a call', 'add a note', 'record meeting', 'follow-up note', 'email summary'. Automatically updates last_contact_at and last_contact_summary on the client.",
        parametersJsonSchema: {
          type: "object",
          properties: {
            clientName: { type: "string", description: "The client company name. Exact match preferred." },
            noteType: { type: "string", description: "Type of interaction: 'Phone Call', 'Site Visit', 'Meeting', 'WhatsApp', 'Follow-up', 'Other'." },
            content: { type: "string", description: "The note content, call summary, or meeting minutes." },
            subject: { type: "string", description: "Optional subject line for the communication." },
          },
          required: ["clientName", "content"],
        },
      },
      {
        name: "createClientContact",
        description: "Creates a new contact person for an existing client. Use when user says 'add contact', 'new contact for Sasol', 'add John as technical contact'. Prevents duplicates by checking existing contacts.",
        parametersJsonSchema: {
          type: "object",
          properties: {
            clientName: { type: "string", description: "The client company name. Exact match preferred." },
            fullName: { type: "string", description: "Full name of the contact person. Required." },
            contactType: { type: "string", description: "Contact type: 'Technical', 'Finance', or 'General'." },
            jobTitle: { type: "string", description: "Job title of the contact." },
            email: { type: "string", description: "Contact email address." },
            cellNumber: { type: "string", description: "Cell/mobile number." },
            landlineNumber: { type: "string", description: "Office landline number." },
            extension: { type: "string", description: "Phone extension." },
            isPrimary: { type: "boolean", description: "Set as primary contact for this client." },
            notes: { type: "string", description: "Additional notes about this contact." },
          },
          required: ["clientName", "fullName"],
        },
      },
      {
        name: "updateClientContact",
        description: "Updates an existing client contact. Use when user says 'update contact', 'change contact email', 'fix contact phone'. Identifies contact by client name + contact name.",
        parametersJsonSchema: {
          type: "object",
          properties: {
            clientName: { type: "string", description: "The client company name. Exact match preferred." },
            contactName: { type: "string", description: "The existing contact's full name to identify them." },
            fullName: { type: "string", description: "Updated full name." },
            contactType: { type: "string", description: "Updated contact type: 'Technical', 'Finance', or 'General'." },
            jobTitle: { type: "string", description: "Updated job title." },
            email: { type: "string", description: "Updated email address." },
            cellNumber: { type: "string", description: "Updated cell/mobile number." },
            landlineNumber: { type: "string", description: "Updated office landline." },
            extension: { type: "string", description: "Updated phone extension." },
            isPrimary: { type: "boolean", description: "Set as primary contact." },
            notes: { type: "string", description: "Updated notes." },
          },
          required: ["clientName", "contactName"],
        },
      },

      // === EXPENSE MANAGEMENT ===
      {
        name: "logExpense",
        description: "Records a business expense. Use when user says 'log expense', 'record expense', 'I spent R500 on...'. Executes server-side and saves directly.",
        parametersJsonSchema: {
          type: "object",
          properties: {
            supplierName: { type: "string", description: "Name of the supplier or vendor." },
            description: { type: "string", description: "Description of the expense." },
            amountInclusive: { type: "number", description: "Total amount including VAT in ZAR." },
            category: { type: "string", description: "Expense category: 'Materials', 'Equipment', 'Fuel', 'Insurance', 'Office Supplies', 'Software', 'Subscriptions', 'Professional Fees', 'Travel', 'Maintenance', 'Marketing', 'Telecommunications', 'Utilities', 'Other'." },
            expenseDate: { type: "string", description: "Date of the expense in YYYY-MM-DD format. Defaults to today." },
            vatClaimable: { type: "boolean", description: "Whether VAT can be claimed. Defaults to true." },
            notes: { type: "string", description: "Additional notes." },
          },
          required: ["supplierName", "description", "amountInclusive"],
        },
      },

      // === PAYMENT RECORDING ===
      {
        name: "recordPayment",
        description: "Records a payment against an existing invoice. Use when user says 'record payment', 'client paid', 'received R10000 for invoice INV-0001'. Automatically updates invoice status to Paid if fully settled, or Partially Paid if partially settled.",
        parametersJsonSchema: {
          type: "object",
          properties: {
            invoiceReference: { type: "string", description: "Invoice reference number (e.g., 'INV-0001'). Required." },
            amount: { type: "number", description: "Payment amount in ZAR. Required." },
            paymentDate: { type: "string", description: "Date of the payment in YYYY-MM-DD format. Defaults to today." },
            paymentMethod: { type: "string", description: "Payment method: 'EFT', 'Cash', 'Card', 'Cheque', 'PayFast', 'Other'. Defaults to 'EFT'." },
            reference: { type: "string", description: "Payment reference or transaction ID (optional)." },
            notes: { type: "string", description: "Additional notes." },
          },
          required: ["invoiceReference", "amount"],
        },
      },

      // === PERSISTENT AI MEMORY ===
      {
        name: "saveMemory",
        description: "Saves a fact, preference, or business rule to persistent memory so it can be recalled in future sessions. Use when the user explicitly tells you to remember something, or when you learn a reliable recurring fact (e.g. standard rates, preferred suppliers, client contacts). Upserts by category+key so duplicates are updated, not added.",
        parametersJsonSchema: {
          type: "object",
          properties: {
            category: {
              type: "string",
              description: "Memory category: 'client_preference', 'pricing_pattern', 'supplier_preference', 'communication_style', 'business_rule', or 'reminder'.",
            },
            key: { type: "string", description: "Short unique label for this memory (e.g. 'site_commissioning_rate', 'sasol_procurement_contact')." },
            value: { type: "string", description: "The fact or rule to remember (e.g. 'R9,500 per site commissioning job', 'John Smith — +27 82 000 0000')." },
            confidence: { type: "number", description: "Confidence level 0.0–1.0. Default 1.0 for explicit user instruction." },
          },
          required: ["category", "key", "value"],
        },
      },

      // === INVOICE STATUS MANAGEMENT ===
      {
        name: "updateInvoiceStatus",
        description: "Updates the status of an existing invoice. Use when the user asks to mark an invoice as sent, mark it as overdue, or change its status. Do NOT use this to mark an invoice as paid — use markInvoicePaid for that. Do NOT use this to cancel/void — use voidInvoice for that.",
        parametersJsonSchema: {
          type: "object",
          properties: {
            invoiceReference: { type: "string", description: "The invoice number (e.g., 'INV-0001') or a description that identifies the invoice." },
            newStatus: { type: "string", description: "The new status to set. Only 'Draft', 'Sent', and 'Overdue' are allowed." },
          },
          required: ["invoiceReference", "newStatus"],
        },
      },
      {
        name: "updatePurchaseOrderStatus",
        description: "Updates the status of a purchase order. Use this when the user asks to mark a PO as sent, acknowledged, delivered, or cancelled.",
        parametersJsonSchema: {
          type: "object",
          properties: {
            poReference: { type: "string", description: "The purchase order number (e.g., 'PO-0001') or a description that identifies the PO." },
            newStatus: {
              type: "string",
              enum: ["Draft", "Sent", "Acknowledged", "Delivered", "Cancelled"],
              description: "The new status to set.",
            },
          },
          required: ["poReference", "newStatus"],
        },
      },
      {
        name: "updateCreditNoteStatus",
        description: "Updates the status of a credit note. Use this when the user asks to issue, apply, send, or cancel a credit note.",
        parametersJsonSchema: {
          type: "object",
          properties: {
            creditNoteReference: { type: "string", description: "The credit note number (e.g., 'CN-0001') or a description that identifies the credit note." },
            newStatus: {
              type: "string",
              enum: ["Draft", "Sent", "Issued", "Applied", "Cancelled"],
              description: "The new status to set.",
            },
          },
          required: ["creditNoteReference", "newStatus"],
        },
      },
      {
        name: "markInvoicePaid",
        description: "Marks an invoice as fully paid and sets the balance due to zero. Use when the user says an invoice has been paid, is settled, or should be closed. This does NOT record a payment transaction — use recordPayment if the user wants to log a specific payment amount and method.",
        parametersJsonSchema: {
          type: "object",
          properties: {
            invoiceReference: { type: "string", description: "The invoice number (e.g., 'INV-0001') or a description that identifies the invoice." },
          },
          required: ["invoiceReference"],
        },
      },
      {
        name: "voidInvoice",
        description: "Cancels/voids an invoice by setting its status to Cancelled. Use when the user asks to cancel, void, delete, or remove an invoice. This does not delete the record — it marks it as Cancelled. An invoice that has been paid or partially paid cannot be voided — a credit note should be issued instead.",
        parametersJsonSchema: {
          type: "object",
          properties: {
            invoiceReference: { type: "string", description: "The invoice number (e.g., 'INV-0001') or a description that identifies the invoice." },
          },
          required: ["invoiceReference"],
        },
      },
      {
        name: "markInvoiceSent",
        description: "Marks an invoice as Sent. Use when the user says the invoice has been sent to the client, emailed, or dispatched.",
        parametersJsonSchema: {
          type: "object",
          properties: {
            invoiceReference: { type: "string", description: "The invoice number (e.g., 'INV-0001')." },
          },
          required: ["invoiceReference"],
        },
      },
      {
        name: "reopenInvoice",
        description: "Reopens a cancelled invoice back to Draft. Only allowed if the invoice has no payments recorded.",
        parametersJsonSchema: {
          type: "object",
          properties: {
            invoiceReference: { type: "string", description: "The invoice number (e.g., 'INV-0001')." },
          },
          required: ["invoiceReference"],
        },
      },
      {
        name: "markQuoteSent",
        description: "Marks a quote as Sent. Use when the user says the quote has been sent to the client.",
        parametersJsonSchema: {
          type: "object",
          properties: {
            quoteReference: { type: "string", description: "The quote number (e.g., 'QT-0001')." },
          },
          required: ["quoteReference"],
        },
      },
      {
        name: "acceptQuote",
        description: "Marks a quote as Accepted. Use when the client has accepted the quotation.",
        parametersJsonSchema: {
          type: "object",
          properties: {
            quoteReference: { type: "string", description: "The quote number (e.g., 'QT-0001')." },
          },
          required: ["quoteReference"],
        },
      },
      {
        name: "declineQuote",
        description: "Marks a quote as Declined. Use when the client has declined the quotation.",
        parametersJsonSchema: {
          type: "object",
          properties: {
            quoteReference: { type: "string", description: "The quote number (e.g., 'QT-0001')." },
          },
          required: ["quoteReference"],
        },
      },
      {
        name: "expireQuote",
        description: "Marks a quote as Expired. Use when the quote validity period has passed.",
        parametersJsonSchema: {
          type: "object",
          properties: {
            quoteReference: { type: "string", description: "The quote number (e.g., 'QT-0001')." },
          },
          required: ["quoteReference"],
        },
      },
      {
        name: "reopenQuote",
        description: "Reopens a declined, rejected, or expired quote back to Draft for revision.",
        parametersJsonSchema: {
          type: "object",
          properties: {
            quoteReference: { type: "string", description: "The quote number (e.g., 'QT-0001')." },
          },
          required: ["quoteReference"],
        },
      },
      {
        name: "rejectQuote",
        description: "Marks a quote as Rejected. Use when the quote has been formally rejected by the client or internally.",
        parametersJsonSchema: {
          type: "object",
          properties: {
            quoteReference: { type: "string", description: "The quote number (e.g., 'QT-0001')." },
          },
          required: ["quoteReference"],
        },
      },
      {
        name: "issueQuote",
        description: "Marks a quote as Issued. Use when the quote has been formally issued to the client.",
        parametersJsonSchema: {
          type: "object",
          properties: {
            quoteReference: { type: "string", description: "The quote number (e.g., 'QT-0001')." },
          },
          required: ["quoteReference"],
        },
      },
      {
        name: "markPOSent",
        description: "Marks a purchase order as Sent to the supplier.",
        parametersJsonSchema: {
          type: "object",
          properties: {
            poReference: { type: "string", description: "The PO number (e.g., 'PO-0001')." },
          },
          required: ["poReference"],
        },
      },
      {
        name: "acknowledgePO",
        description: "Marks a purchase order as Acknowledged by the supplier.",
        parametersJsonSchema: {
          type: "object",
          properties: {
            poReference: { type: "string", description: "The PO number (e.g., 'PO-0001')." },
          },
          required: ["poReference"],
        },
      },
      {
        name: "markPODelivered",
        description: "Marks a purchase order as Delivered.",
        parametersJsonSchema: {
          type: "object",
          properties: {
            poReference: { type: "string", description: "The PO number (e.g., 'PO-0001')." },
          },
          required: ["poReference"],
        },
      },
      {
        name: "cancelPO",
        description: "Cancels a purchase order. Allowed from any status except Cancelled.",
        parametersJsonSchema: {
          type: "object",
          properties: {
            poReference: { type: "string", description: "The PO number (e.g., 'PO-0001')." },
          },
          required: ["poReference"],
        },
      },
      {
        name: "issueCreditNote",
        description: "Issues a credit note (changes status from Draft/Sent to Issued).",
        parametersJsonSchema: {
          type: "object",
          properties: {
            cnReference: { type: "string", description: "The credit note number (e.g., 'CN-0001')." },
          },
          required: ["cnReference"],
        },
      },
      {
        name: "sendCreditNote",
        description: "Marks a credit note as Sent to the client.",
        parametersJsonSchema: {
          type: "object",
          properties: {
            cnReference: { type: "string", description: "The credit note number (e.g., 'CN-0001')." },
          },
          required: ["cnReference"],
        },
      },
      {
        name: "applyCreditNote",
        description: "Applies a credit note against its linked invoice (changes status to Applied).",
        parametersJsonSchema: {
          type: "object",
          properties: {
            cnReference: { type: "string", description: "The credit note number (e.g., 'CN-0001')." },
          },
          required: ["cnReference"],
        },
      },
      {
        name: "cancelCreditNote",
        description: "Cancels a credit note. Not allowed if the credit note has already been applied.",
        parametersJsonSchema: {
          type: "object",
          properties: {
            cnReference: { type: "string", description: "The credit note number (e.g., 'CN-0001')." },
          },
          required: ["cnReference"],
        },
      },
      {
        name: "convertQuoteToInvoice",
        description: "Converts an accepted quote into an invoice. Copies all line items, totals, and client details from the quote to create a new invoice. The quote status is updated to 'Converted'. Use this when the user says 'convert this quote to an invoice', 'invoice this quote', 'raise an invoice from quote [number]', or after a quote has been accepted and the user wants to proceed.",
        parametersJsonSchema: {
          type: "object",
          properties: {
            quoteReference: {
              type: "string",
              description: "The quote number (e.g., 'QUO-0001') to convert.",
            },
            paymentTermsDays: {
              type: "number",
              description: "Payment terms in days for the invoice. If not specified, the business profile default will be used.",
            },
          },
          required: ["quoteReference"],
        },
      },
      {
        name: "transitionDocumentStatus",
        description: "Transitions the status of an invoice, quote, purchase order, or credit note following strict lifecycle rules. Use this for specific transitions like 'mark_sent', 'void', 'reopen', etc.",
        parametersJsonSchema: {
          type: "object",
          properties: {
            documentType: {
              type: "string",
              enum: ["invoice", "quote", "purchase_order", "credit_note"],
              description: "The type of document to transition."
            },
            reference: {
              type: "string",
              description: "The document number (e.g., 'INV-0001', 'QT-0001')."
            },
            action: {
              type: "string",
              description: "The transition action to perform (e.g., 'mark_sent', 'accept', 'decline', 'void', 'reopen', 'issue', 'acknowledge', 'mark_delivered', 'cancel')."
            },
          },
          required: ["documentType", "reference", "action"],
        },
      },
      {
        name: "createTask",
        description: "Creates a new task or to-do item. Use this when the user asks to create a task, add a to-do, set a reminder, or when they say things like 'remind me to...', 'I need to...', 'don't forget to...', 'schedule...', or 'add to my list...'.",
        parametersJsonSchema: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description: "The task title — a clear, concise description of what needs to be done."
            },
            description: {
              type: "string",
              description: "Optional longer description with additional details or context."
            },
            priority: {
              type: "string",
              enum: ["low", "medium", "high", "urgent"],
              description: "Task priority. Default to 'medium' if the user does not specify. Use 'urgent' only if the user explicitly says urgent, critical, or ASAP. Use 'high' if they say important or high priority."
            },
            dueDate: {
              type: "string",
              description: "Due date in YYYY-MM-DD format. Interpret natural language: 'tomorrow', 'next Tuesday', 'end of the week', 'next month', etc. If the user says 'remind me' with a date, use that as the due date."
            },
            dueTime: {
              type: "string",
              description: "Optional due time in HH:MM format (24-hour). Only set if the user specifies a specific time."
            },
            category: {
              type: "string",
              description: "Task category. Common categories: Admin, Site Visit, Follow-up, Procurement, Documentation, Maintenance, Client Communication, Invoicing, Safety. Infer from context if not explicitly stated."
            },
            clientName: {
              type: "string",
              description: "Client name to link the task to, if the task relates to a specific client. Will be looked up by name."
            },
            tags: {
              type: "array",
              items: { type: "string" },
              description: "Optional tags for the task."
            },
            notes: {
              type: "string",
              description: "Optional additional notes."
            }
          },
          required: ["title"]
        },
      },
      {
        name: "updateTask",
        description: "Updates an existing task. Use this when the user asks to change a task's priority, due date, description, status, or any other field. Also use this when the user asks to 'start working on' a task (set status to in_progress).",
        parametersJsonSchema: {
          type: "object",
          properties: {
            taskIdentifier: {
              type: "string",
              description: "The task title or a description that identifies the task. Will be searched by title."
            },
            title: { type: "string", description: "New title, if changing." },
            description: { type: "string", description: "New description, if changing." },
            priority: {
              type: "string",
              enum: ["low", "medium", "high", "urgent"],
              description: "New priority, if changing."
            },
            status: {
              type: "string",
              enum: ["todo", "in_progress", "done", "cancelled"],
              description: "New status, if changing."
            },
            dueDate: { type: "string", description: "New due date in YYYY-MM-DD format, if changing." },
            dueTime: { type: "string", description: "New due time in HH:MM format, if changing." },
            category: { type: "string", description: "New category, if changing." },
            notes: { type: "string", description: "New notes, if changing." }
          },
          required: ["taskIdentifier"]
        },
      },
      {
        name: "completeTask",
        description: "Marks a task as done/completed. Use this when the user says 'done', 'finished', 'completed', 'tick off', or 'mark as done' for a specific task.",
        parametersJsonSchema: {
          type: "object",
          properties: {
            taskIdentifier: {
              type: "string",
              description: "The task title or description that identifies the task."
            }
          },
          required: ["taskIdentifier"]
        },
      },
      {
        name: "queryTasks",
        description: "Queries tasks based on filters. Use this when the user asks 'what do I need to do today?', 'show me my overdue tasks', 'what tasks are due this week?', 'what are my high priority tasks?', 'how many tasks do I have?', or any question about their task list.",
        parametersJsonSchema: {
          type: "object",
          properties: {
            queryType: {
              type: "string",
              enum: ["today", "overdue", "this_week", "all_open", "by_priority", "by_client", "by_category", "stats", "search"],
              description: "The type of query to run."
            },
            priority: {
              type: "string",
              enum: ["low", "medium", "high", "urgent"],
              description: "Filter by priority (for by_priority query)."
            },
            clientName: {
              type: "string",
              description: "Client name to filter by (for by_client query)."
            },
            category: {
              type: "string",
              description: "Category to filter by (for by_category query)."
            },
            searchTerm: {
              type: "string",
              description: "Search term for task titles and descriptions (for search query)."
            }
          },
          required: ["queryType"]
        },
      },
      {
        name: "deleteTask",
        description: "Deletes a task permanently. Use this when the user explicitly asks to delete or remove a task. For tasks the user just wants to dismiss or skip, suggest marking as cancelled instead.",
        parametersJsonSchema: {
          type: "object",
          properties: {
            taskIdentifier: {
              type: "string",
              description: "The task title or description that identifies the task to delete."
            }
          },
          required: ["taskIdentifier"]
        },
      },
      {
        name: "createNote",
        description: "Creates a new note. Use this when the user says 'take a note', 'note that...', 'jot down...', 'write down...', 'remember that...', or describes something they want to record. For phone calls, use note_type 'call'. For meetings, use 'meeting'. For site visits, use 'site_visit'. For quick one-liners, use 'quick'. For everything else, use 'general'.",
        parametersJsonSchema: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description: "Optional title for the note. Generate a short descriptive title if the user does not provide one."
            },
            content: {
              type: "string",
              description: "The note content. Capture what the user said, organized clearly. For call notes, structure as: who was called, what was discussed, outcomes. For site visits: site name, observations, action items."
            },
            noteType: {
              type: "string",
              enum: ["general", "call", "meeting", "site_visit", "quick"],
              description: "The type of note. Infer from context: if the user mentions a phone call, use 'call'. If they mention a meeting, use 'meeting'. If they mention a site visit or being on site, use 'site_visit'. If it is a brief note or reminder-style, use 'quick'. Default to 'general'."
            },
            contactName: {
              type: "string",
              description: "For call/meeting notes: the name of the person contacted or who attended."
            },
            contactPhone: {
              type: "string",
              description: "For call notes: the phone number if mentioned."
            },
            callDirection: {
              type: "string",
              enum: ["inbound", "outbound"],
              description: "For call notes: whether the call was inbound or outbound."
            },
            meetingAttendees: {
              type: "array",
              items: { type: "string" },
              description: "For meeting notes: list of attendee names."
            },
            siteName: {
              type: "string",
              description: "For site visit notes: the name of the site."
            },
            clientName: {
              type: "string",
              description: "Client to link this note to, if it relates to a specific client."
            },
            followUpRequired: {
              type: "boolean",
              description: "Whether a follow-up action is needed. Set to true if the user mentions needing to follow up, get back to someone, or take further action."
            },
            followUpDate: {
              type: "string",
              description: "If follow-up is required, the date by which it should happen (YYYY-MM-DD). Interpret natural language dates."
            },
            followUpNotes: {
              type: "string",
              description: "Brief description of the follow-up action needed."
            },
            tags: {
              type: "array",
              items: { type: "string" },
              description: "Optional tags for categorising the note."
            }
          },
          required: ["content"]
        },
      },
      {
        name: "searchNotes",
        description: "Searches through existing notes. Use this when the user asks 'what did I note about...', 'find my notes on...', 'show me notes about...', 'what did we discuss with [client]...', 'any notes about [topic]...', or 'show me my follow-ups'.",
        parametersJsonSchema: {
          type: "object",
          properties: {
            searchTerm: {
              type: "string",
              description: "Text to search for in note titles and content."
            },
            noteType: {
              type: "string",
              enum: ["general", "call", "meeting", "site_visit", "quick", "all"],
              description: "Filter by note type. Default to 'all'."
            },
            clientName: {
              type: "string",
              description: "Filter notes by client name."
            },
            followUpPending: {
              type: "boolean",
              description: "If true, only return notes with pending (not completed) follow-ups."
            },
            limit: {
              type: "number",
              description: "Maximum number of notes to return. Default 10."
            }
          },
          required: []
        },
      },
      {
        name: "logCallNote",
        description: "Quickly logs a phone call note. Use this when the user explicitly mentions a phone call: 'just got off the phone with...', 'called [person/company]...', 'log a call with...', '[person] called about...'. This is a shortcut that pre-sets the note type to 'call'.",
        parametersJsonSchema: {
          type: "object",
          properties: {
            contactName: {
              type: "string",
              description: "Who the call was with."
            },
            clientName: {
              type: "string",
              description: "The client company, if applicable."
            },
            callDirection: {
              type: "string",
              enum: ["inbound", "outbound"],
              description: "Whether the user called them (outbound) or they called the user (inbound). Infer from context: 'I called' = outbound, 'they called' or '[person] called' = inbound."
            },
            content: {
              type: "string",
              description: "What was discussed, decisions made, outcomes, and any action items. Structure the content clearly."
            },
            followUpRequired: {
              type: "boolean",
              description: "Whether follow-up is needed."
            },
            followUpDate: {
              type: "string",
              description: "Follow-up date if needed (YYYY-MM-DD)."
            },
            followUpNotes: {
              type: "string",
              description: "What the follow-up should involve."
            }
          },
          required: ["contactName", "content"]
        },
      },
      {
        name: "createCalendarEvent",
        description: "Creates a new calendar event or appointment. Use this when the user asks to schedule a meeting, add an appointment, block time, set up a call, or when they say 'book...', 'schedule...', 'set up...', 'add to calendar...', or 'I have a meeting with...'.",
        parametersJsonSchema: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description: "The event title — what the event is called."
            },
            description: {
              type: "string",
              description: "Optional longer description with additional details."
            },
            eventType: {
              type: "string",
              enum: ["appointment", "meeting", "site_visit", "deadline", "reminder", "travel", "other"],
              description: "Type of event. Default to 'appointment' if not specified."
            },
            startDate: {
              type: "string",
              description: "Start date in YYYY-MM-DD format. Interpret natural language: 'tomorrow', 'next Tuesday', 'next week', etc."
            },
            startTime: {
              type: "string",
              description: "Start time in HH:MM format (24-hour). Only set if the user specifies a specific time."
            },
            endDate: {
              type: "string",
              description: "End date in YYYY-MM-DD format. If not set, defaults to start date."
            },
            endTime: {
              type: "string",
              description: "End time in HH:MM format (24-hour)."
            },
            allDay: {
              type: "boolean",
              description: "Whether this is an all-day event. Default false."
            },
            location: {
              type: "string",
              description: "Where the event takes place."
            },
            clientName: {
              type: "string",
              description: "Client name to link the event to, if applicable. Will be looked up by name."
            },
            status: {
              type: "string",
              enum: ["scheduled", "completed", "cancelled", "rescheduled"],
              description: "Event status. Default to 'scheduled'."
            },
            colour: {
              type: "string",
              description: "Event colour in hex format (e.g., '#3B82F6'). Optional."
            },
            notes: {
              type: "string",
              description: "Internal/private notes about the event."
            }
          },
          required: ["title", "startDate"]
        },
      },
      {
        name: "queryCalendarEvents",
        description: "Queries calendar events for a specific date range or searches for events. Use this when the user asks 'what's on my calendar', 'what meetings do I have', 'show me my schedule', 'any events on [date]', 'what's happening today/tomorrow/this week', or 'do I have anything scheduled'.",
        parametersJsonSchema: {
          type: "object",
          properties: {
            startDate: {
              type: "string",
              description: "Start date in YYYY-MM-DD format. If not set, defaults to today."
            },
            endDate: {
              type: "string",
              description: "End date in YYYY-MM-DD format. If not set, defaults to start date."
            },
            eventType: {
              type: "string",
              enum: ["appointment", "meeting", "site_visit", "deadline", "reminder", "travel", "other"],
              description: "Filter by event type."
            },
            clientName: {
              type: "string",
              description: "Filter events by client name."
            },
            status: {
              type: "string",
              enum: ["scheduled", "completed", "cancelled", "rescheduled"],
              description: "Filter by event status."
            },
            limit: {
              type: "number",
              description: "Maximum number of events to return. Default 20."
            }
          },
          required: []
        },
      },
      {
        name: "updateCalendarEvent",
        description: "Updates an existing calendar event. Use this when the user asks to change an event's time, location, title, status, or any other field.",
        parametersJsonSchema: {
          type: "object",
          properties: {
            eventIdentifier: {
              type: "string",
              description: "The event title or description that identifies the event. Will be searched by title."
            },
            title: {
              type: "string",
              description: "New event title."
            },
            description: {
              type: "string",
              description: "New description."
            },
            eventType: {
              type: "string",
              enum: ["appointment", "meeting", "site_visit", "deadline", "reminder", "travel", "other"],
              description: "New event type."
            },
            startDate: {
              type: "string",
              description: "New start date in YYYY-MM-DD format."
            },
            startTime: {
              type: "string",
              description: "New start time in HH:MM format."
            },
            endDate: {
              type: "string",
              description: "New end date in YYYY-MM-DD format."
            },
            endTime: {
              type: "string",
              description: "New end time in HH:MM format."
            },
            allDay: {
              type: "boolean",
              description: "Whether this is an all-day event."
            },
            location: {
              type: "string",
              description: "New location."
            },
            status: {
              type: "string",
              enum: ["scheduled", "completed", "cancelled", "rescheduled"],
              description: "New status."
            },
            notes: {
              type: "string",
              description: "New internal notes."
            }
          },
          required: ["eventIdentifier"]
        },
      },
      {
        name: "createReminder",
        description: "Creates a new reminder or follow-up. Use this when the user asks to set a reminder, be reminded about something, follow up on something, or says 'remind me to...', 'don't forget to...', 'I need to follow up on...'.",
        parametersJsonSchema: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description: "The reminder title — what needs to be reminded."
            },
            description: {
              type: "string",
              description: "Optional longer description with additional details."
            },
            reminderType: {
              type: "string",
              enum: ["task", "follow_up", "meeting", "call", "custom"],
              description: "Type of reminder. Default to 'custom' if not specified."
            },
            reminderAt: {
              type: "string",
              description: "When the reminder should trigger in ISO 8601 format. Interpret natural language: 'tomorrow at 9am', 'next Friday at 2pm', 'in 30 minutes'."
            },
            clientName: {
              type: "string",
              description: "Client name to link the reminder to, if applicable. Will be looked up by name."
            },
            isRecurring: {
              type: "boolean",
              description: "Whether this is a recurring reminder. Default false."
            },
            recurringFrequency: {
              type: "string",
              enum: ["daily", "weekly", "monthly", "yearly"],
              description: "If recurring, how often."
            }
          },
          required: ["title", "reminderAt"]
        },
      },
      {
        name: "queryReminders",
        description: "Queries reminders for a specific date range or searches for pending/due reminders. Use this when the user asks 'what reminders do I have', 'show my follow-ups', 'what's due today', 'what am I forgetting', or 'any overdue reminders'.",
        parametersJsonSchema: {
          type: "object",
          properties: {
            status: {
              type: "string",
              enum: ["pending", "completed", "cancelled", "all"],
              description: "Filter by status. Default to 'pending'."
            },
            startDate: {
              type: "string",
              description: "Start date in YYYY-MM-DD format."
            },
            endDate: {
              type: "string",
              description: "End date in YYYY-MM-DD format."
            },
            reminderType: {
              type: "string",
              enum: ["task", "follow_up", "meeting", "call", "custom"],
              description: "Filter by reminder type."
            },
            clientName: {
              type: "string",
              description: "Filter reminders by client name."
            },
            limit: {
              type: "number",
              description: "Maximum number of reminders to return. Default 20."
            }
          },
          required: []
        },
      },
      {
        name: "updateReminder",
        description: "Updates an existing reminder. Use this when the user asks to change a reminder's time, reschedule it, or mark it complete.",
        parametersJsonSchema: {
          type: "object",
          properties: {
            reminderIdentifier: {
              type: "string",
              description: "The reminder title that identifies the reminder. Will be searched by title."
            },
            title: {
              type: "string",
              description: "New reminder title."
            },
            description: {
              type: "string",
              description: "New description."
            },
            reminderAt: {
              type: "string",
              description: "New reminder time in ISO 8601 format."
            },
            reminderType: {
              type: "string",
              enum: ["task", "follow_up", "meeting", "call", "custom"],
              description: "New reminder type."
            },
            status: {
              type: "string",
              enum: ["pending", "completed", "cancelled"],
              description: "New status. Use 'completed' to mark as done, 'cancelled' to cancel."
            },
            snoozeMinutes: {
              type: "number",
              description: "Snooze the reminder by this many minutes."
            }
          },
          required: ["reminderIdentifier"]
        },
      },
      {
        name: "queryAgenda",
        description: "Queries today's agenda combining tasks due today, overdue tasks, calendar events, and pending reminders. Use this when the user asks 'What's on my agenda today?', 'What's my day look like?', 'Morning briefing', 'What do I have today?', or 'What do I need to do today?'.",
        parametersJsonSchema: {
          type: "object",
          properties: {
            date: {
              type: "string",
              description: "Date to query in YYYY-MM-DD format. Defaults to today."
            },
            includeOverdue: {
              type: "boolean",
              description: "Include overdue items. Default true."
            },
            includeReminders: {
              type: "boolean",
              description: "Include reminders. Default true."
            },
            includeCalendar: {
              type: "boolean",
              description: "Include calendar events. Default true."
            }
          },
          required: []
        },
      },
      {
        name: "convertNoteToTasks",
        description: "Converts a note into one or more tasks. Use this when the user asks to 'convert this note to tasks', 'create tasks from this note', 'turn this note into a to-do list', or when the user mentions action items in a note that should become tasks.",
        parametersJsonSchema: {
          type: "object",
          properties: {
            noteIdentifier: {
              type: "string",
              description: "The note title or content that identifies the note to convert. Search by title or content."
            },
            tasks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  priority: { type: "string", enum: ["low", "medium", "high", "urgent"] },
                  dueDate: { type: "string", description: "YYYY-MM-DD" },
                  category: { type: "string" }
                },
                required: ["title"]
              },
              description: "List of tasks to create from the note. Parse action items and specific tasks mentioned in the note."
            }
          },
          required: ["noteIdentifier", "tasks"]
        },
      },
      {
        name: "openWhatsApp",
        description: "Opens a WhatsApp click-to-chat with a client or contact. Use this when the user says 'WhatsApp [client]', 'send a WhatsApp to [client]', 'message [client] on WhatsApp', or 'WhatsApp about the overdue invoice'. Does not execute server-side — the client handles opening the URL.",
        parametersJsonSchema: {
          type: "object",
          properties: {
            clientName: {
              type: "string",
              description: "The client company name to WhatsApp."
            },
            messageType: {
              type: "string",
              enum: ["general", "invoice", "quote", "payment_reminder"],
              description: "Type of pre-filled message. 'general' opens with a greeting, 'invoice' includes invoice details, 'quote' includes quote details, 'payment_reminder' includes overdue info."
            },
            invoiceReference: {
              type: "string",
              description: "Invoice number if messageType is 'invoice' or 'payment_reminder' (e.g., 'INV-0001')."
            },
            quoteReference: {
              type: "string",
              description: "Quote number if messageType is 'quote' (e.g., 'QT-0001')."
            }
          },
          required: ["clientName"],
        },
      },
    ],
  },
];

// ============================================================
// SERVER-SIDE TOOL EXECUTORS
// ============================================================

// Tools that execute server-side and return data for a follow-up AI call
// Tools that execute server-side and return data for a follow-up AI call
const SERVER_SIDE_TOOLS = new Set(["queryBusinessData", "logTrip", "createClient", "updateClient", "addClientCommunication", "createClientContact", "updateClientContact", "logExpense", "recordPayment", "draftQuote", "draftInvoice", "draftPurchaseOrder", "draftCreditNote", "saveMemory", "logFuelPurchase", "updateInvoiceStatus", "updatePurchaseOrderStatus", "updateCreditNoteStatus", "markInvoicePaid", "voidInvoice", "markInvoiceSent", "reopenInvoice", "markQuoteSent", "acceptQuote", "declineQuote", "expireQuote", "reopenQuote", "rejectQuote", "issueQuote", "markPOSent", "acknowledgePO", "markPODelivered", "cancelPO", "issueCreditNote", "sendCreditNote", "applyCreditNote", "cancelCreditNote", "transitionDocumentStatus", "convertQuoteToInvoice", "createTask", "updateTask", "completeTask", "queryTasks", "deleteTask", "createNote", "searchNotes", "logCallNote", "createCalendarEvent", "queryCalendarEvents", "updateCalendarEvent", "createReminder", "queryReminders", "updateReminder", "queryAgenda", "convertNoteToTasks"]);

async function executeLogTrip(args: any): Promise<string> {
  const supabase = getSupabase();
  const today = new Date().toISOString().split("T")[0];

  // Find vehicle
  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("id, vehicle_description, registration_number, is_default")
    .eq("is_active", true)
    .order("is_default", { ascending: false })
    .limit(10);

  let vehicleId = vehicles?.find((v: any) => v.is_default)?.id || vehicles?.[0]?.id;

  if (args.vehicleName && vehicles) {
    const clean = String(args.vehicleName).toLowerCase().trim();
    const match = vehicles.find(
      (v: any) =>
        v.vehicle_description.toLowerCase().includes(clean) ||
        v.registration_number.toLowerCase().replace(/\s/g, "").includes(clean.replace(/\s/g, ""))
    );
    if (match) vehicleId = match.id;
  }

  if (!vehicleId) {
    return wrapWithActionResult(
      actionFailed({ action: "log_trip", targetType: "travel_trip", toolUsed: "logTrip", error: "No active vehicle found. Add a vehicle in Travel Settings first.", nextStep: "Go to Travel Logbook Settings and add a vehicle." })
    );
  }

  // Get last odometer reading
  const { data: lastTrip } = await supabase
    .from("travel_trips")
    .select("odometer_end")
    .eq("vehicle_id", vehicleId)
    .order("date", { ascending: false })
    .limit(1)
    .single();

  const estimatedStartOdo = lastTrip?.odometer_end || 0;
  const distanceKm = Number(args.distanceKm) || 0;

  // Resolve client if provided — safe exact-match-first lookup
  let clientId: string | null = null;
  if (args.clientName) {
    const resolved = await resolveClientForWrite(supabase, String(args.clientName));
    if (resolved.kind === "exact" || resolved.kind === "fuzzy_single") {
      clientId = resolved.record.id;
    } else if (resolved.kind === "ambiguous") {
      return wrapWithActionResult(
        actionNeedInfo({
          action: "log_trip",
          targetType: "travel_trip",
          toolUsed: "logTrip",
          missingFields: ["clientName"],
          nextStep: `Multiple clients match "${args.clientName}". Please specify which one: ${resolved.candidates.map((c: any) => `${c.company_name} (${c.email || "no email"})`).join(", ")}`,
        }),
        { disambiguation: { type: "client", query: args.clientName, candidates: resolved.candidates } }
      );
    }
    // not_found — proceed without client_id (trip doesn't require a client)
  }

  const tripData = {
    date: args.date || today,
    from_location: args.fromLocation || "Office",
    to_location: String(args.destination || "").trim(),
    odometer_start: estimatedStartOdo,
    odometer_end: estimatedStartOdo + distanceKm,
    distance_km: distanceKm,
    purpose: String(args.purpose || "").trim(),
    vehicle_id: vehicleId,
    client_id: clientId,
    notes: `Logged via AI on ${today}`,
    source: "AI",
  };

  const { data: insertedTrip, error } = await supabase.from("travel_trips").insert(tripData).select("id").single();

  if (error) {
    console.error("[logTrip] Failed to insert trip:", error);
    return wrapWithActionResult(
      actionFailed({ action: "log_trip", targetType: "travel_trip", toolUsed: "logTrip", error: error.message })
    );
  }

  const verification = await verifyTrip(supabase, insertedTrip.id, {
    to_location: tripData.to_location,
    distance_km: tripData.distance_km,
    purpose: tripData.purpose,
  });

  console.log("[logTrip] Successfully logged trip to:", tripData.to_location);
  return wrapWithActionResult(
    actionSuccess({
      action: "log_trip",
      targetType: "travel_trip",
      targetReference: `${tripData.to_location}`,
      toolUsed: "logTrip",
      summary: `Trip logged: ${tripData.from_location} → ${tripData.to_location}, ${distanceKm}km, ${tripData.purpose}`,
      verified: verification.status === "confirmed",
    }),
    {
      trip: {
        date: tripData.date,
        from: tripData.from_location,
        to: tripData.to_location,
        distanceKm,
        purpose: tripData.purpose,
        odometerStart: tripData.odometer_start,
        odometerEnd: tripData.odometer_end,
      },
      verification,
    }
  );
}

async function executeLogFuelPurchase(args: any): Promise<string> {
  const supabase = getSupabase();
  const today = new Date().toISOString().split("T")[0];

  const supplierName = String(args.supplierName || "").trim();
  const totalAmount = Number(args.totalAmount) || 0;

  if (!supplierName || totalAmount <= 0) {
    return wrapWithActionResult(
      actionFailed({ action: "log_fuel_purchase", targetType: "fuel_log", toolUsed: "logFuelPurchase", error: "Supplier name and a positive total amount are required.", nextStep: "Please provide the fuel station name and total amount." })
    );
  }

  // Find vehicle
  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("id, vehicle_description, registration_number, is_default")
    .eq("is_active", true)
    .order("is_default", { ascending: false })
    .limit(10);

  let vehicleId = vehicles?.find((v: any) => v.is_default)?.id || vehicles?.[0]?.id;

  if (args.vehicleName && vehicles) {
    const clean = String(args.vehicleName).toLowerCase().trim();
    const match = vehicles.find(
      (v: any) =>
        v.vehicle_description.toLowerCase().includes(clean) ||
        v.registration_number.toLowerCase().replace(/\s/g, "").includes(clean.replace(/\s/g, ""))
    );
    if (match) vehicleId = match.id;
  }

  const fuelData = {
    date: args.date || today,
    supplier_name: supplierName,
    fuel_type: args.fuelType || "Diesel",
    litres: Number(args.litres) || 0,
    price_per_litre: Number(args.pricePerLitre) || 0,
    total_amount: totalAmount,
    odometer: Number(args.odometer) || null,
    vehicle_id: vehicleId || null,
    payment_method: args.paymentMethod || "Card",
  };

  const { data: newFuel, error } = await supabase.from("fuel_logs").insert(fuelData).select("id").single();
  if (error) {
    console.error("[logFuelPurchase] Failed to insert fuel log:", error);
    return wrapWithActionResult(
      actionFailed({ action: "log_fuel_purchase", targetType: "fuel_log", toolUsed: "logFuelPurchase", error: error.message })
    );
  }

  const verification = await verifyFuelLog(supabase, newFuel.id, {
    supplier_name: fuelData.supplier_name,
    total_amount: fuelData.total_amount,
  });

  console.log("[logFuelPurchase] Successfully logged fuel at:", supplierName);
  return wrapWithActionResult(
    actionSuccess({
      action: "log_fuel_purchase",
      targetType: "fuel_log",
      targetReference: supplierName,
      toolUsed: "logFuelPurchase",
      summary: `Fuel logged: ${supplierName}, ${fuelData.litres}L at R${fuelData.price_per_litre}/L, total R${totalAmount.toFixed(2)}`,
      verified: verification.status === "confirmed",
    }),
    { fuelLog: { id: newFuel.id, supplier: supplierName, totalAmount: totalAmount.toFixed(2), litres: fuelData.litres }, verification }
  );
}

async function executeQueryBusinessData(args: any): Promise<string> {
  const supabase = getSupabase();
  const filters = args.filters || {};
  const limit = filters.limit || 20;
  const today = new Date().toISOString().split("T")[0];

  try {
    switch (args.queryType) {
      case "revenue_summary": {
        const [{ data: invoices }, { data: credits }] = await Promise.all([
          supabase
            .from("invoices")
            .select("total, amount_paid, balance_due, status, due_date")
            .order("created_at", { ascending: false }),
          supabase.from("credit_notes").select("total").neq("status", "Cancelled"),
        ]);

        const all = invoices || [];
        const allCredits = credits || [];
        
        const totalInvoicedRaw = all.reduce((s: number, i: any) => s + Number(i.total || 0), 0);
        const totalCredited = allCredits.reduce((s: number, c: any) => s + Number(c.total || 0), 0);
        const totalInvoiced = totalInvoicedRaw - totalCredited;
        
        const totalPaid = all.reduce((s: number, i: any) => s + Number(i.amount_paid || 0), 0);
        const totalOutstanding = all.reduce((s: number, i: any) => s + Number(i.balance_due || 0), 0) - totalCredited;
        
        const overdueCount = all.filter((i: any) => i.status !== "Paid" && i.due_date && i.due_date < today).length;
        const paidCount = all.filter((i: any) => i.status === "Paid").length;
        const draftCount = all.filter((i: any) => i.status === "Draft").length;
        const sentCount = all.filter((i: any) => i.status === "Sent").length;

        return JSON.stringify({
          totalInvoices: all.length,
          totalInvoiced: totalInvoiced.toFixed(2),
          totalPaid: totalPaid.toFixed(2),
          totalOutstanding: totalOutstanding.toFixed(2),
          overdueCount,
          paidCount,
          draftCount,
          sentCount,
          currency: "ZAR",
        });
      }

      case "invoice_list": {
        let query = supabase
          .from("invoices")
          .select("id, invoice_number, status, total, balance_due, issue_date, due_date, created_at, clients(company_name)")
          .order("created_at", { ascending: false })
          .limit(limit);

        if (filters.status) query = query.eq("status", filters.status);
        if (filters.dateFrom) query = query.gte("issue_date", filters.dateFrom);
        if (filters.dateTo) query = query.lte("issue_date", filters.dateTo);

        const { data } = await query;
        return JSON.stringify({ invoices: data || [], count: (data || []).length });
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

        return JSON.stringify({ overdueInvoices: data || [], count: (data || []).length });
      }

      case "quote_list": {
        let query = supabase
          .from("quotes")
          .select("id, quote_number, status, total, issue_date, expiry_date, clients(company_name)")
          .order("created_at", { ascending: false })
          .limit(limit);

        if (filters.status) query = query.eq("status", filters.status);
        const { data } = await query;
        return JSON.stringify({ quotes: data || [], count: (data || []).length });
      }

      case "client_list": {
        const { data } = await supabase
          .from("clients")
          .select("id, company_name, contact_person, email, phone, category, email_missing, is_active")
          .eq("is_active", true)
          .order("company_name")
          .limit(limit);

        return JSON.stringify({ clients: data || [], count: (data || []).length });
      }

      case "client_data_quality": {
        const { data } = await supabase
          .from("clients")
          .select("id, company_name, contact_person, email, phone, category, is_active, email_missing")
          .eq("is_active", true)
          .order("company_name")
          .limit(Math.max(limit, 200));

        const clients = data || [];
        const missingContactName = clients.filter((client: any) => !String(client.contact_person || "").trim());
        const missingCategory = clients.filter((client: any) => !String(client.category || "").trim());
        const missingEmail = clients.filter((client: any) => !String(client.email || "").trim() || client.email_missing);

        return JSON.stringify({
          totalClients: clients.length,
          missingContactNameCount: missingContactName.length,
          missingCategoryCount: missingCategory.length,
          missingEmailCount: missingEmail.length,
          missingContactName: missingContactName.map((client: any) => ({
            id: client.id,
            company_name: client.company_name,
            email: client.email,
            phone: client.phone,
          })),
          missingCategory: missingCategory.map((client: any) => ({
            id: client.id,
            company_name: client.company_name,
            contact_person: client.contact_person,
            email: client.email,
          })),
          missingEmail: missingEmail.map((client: any) => ({
            id: client.id,
            company_name: client.company_name,
            contact_person: client.contact_person,
            phone: client.phone,
          })),
        });
      }

      case "client_lookup": {
        const name = filters.clientName || "";
        const { data } = await supabase
          .from("clients")
          .select("id, company_name, contact_person, email, phone, physical_address, vat_number")
          .ilike("company_name", `%${name}%`)
          .limit(5);

        return JSON.stringify({ clients: data || [], count: (data || []).length });
      }

      case "expense_summary": {
        let query = supabase
          .from("expenses")
          .select("amount_inclusive, category, expense_date, description, supplier_name")
          .order("expense_date", { ascending: false })
          .limit(limit);

        if (filters.dateFrom) query = query.gte("expense_date", filters.dateFrom);
        if (filters.dateTo) query = query.lte("expense_date", filters.dateTo);

        const { data } = await query;
        const all = data || [];
        const totalExpenses = all.reduce((s: number, e: any) => s + Number(e.amount_inclusive || 0), 0);

        // Group by category
        const byCategory: Record<string, number> = {};
        all.forEach((e: any) => {
          const cat = e.category || "Uncategorised";
          byCategory[cat] = (byCategory[cat] || 0) + Number(e.amount_inclusive || 0);
        });

        return JSON.stringify({ totalExpenses: totalExpenses.toFixed(2), count: all.length, byCategory, recentExpenses: all.slice(0, 5), currency: "ZAR" });
      }

      case "travel_summary": {
        const { data } = await supabase
          .from("travel_trips")
          .select("distance_km, date, from_location, to_location, purpose")
          .order("date", { ascending: false })
          .limit(100);

        const all = data || [];
        const totalKm = all.reduce((s: number, t: any) => s + Number(t.distance_km || 0), 0);
        const tripCount = all.length;

        // Get fuel price
        const { data: settings } = await supabase.from("travel_settings").select("fuel_price_per_litre").limit(1).single();
        const fuelPrice = Number(settings?.fuel_price_per_litre || 22.5);
        const estimatedFuelCost = (totalKm / 10) * fuelPrice; // rough 10km/l
        const saraRate = 4.64; // SARS rate per km
        const saraClaimable = totalKm * saraRate;

        return JSON.stringify({
          tripCount,
          totalKm,
          estimatedFuelCostZAR: estimatedFuelCost.toFixed(2),
          sarsClaimableZAR: saraClaimable.toFixed(2),
          recentTrips: all.slice(0, 5),
          currency: "ZAR",
        });
      }

      case "purchase_order_list": {
        const { data } = await supabase
          .from("purchase_orders")
          .select("id, po_number, supplier_name, total, status, date_raised")
          .order("created_at", { ascending: false })
          .limit(limit);
        return JSON.stringify({ purchaseOrders: data || [], count: (data || []).length });
      }

      case "credit_note_list": {
        const { data } = await supabase
          .from("credit_notes")
          .select("id, cn_number, total, status, date_issued, clients(company_name)")
          .order("created_at", { ascending: false })
          .limit(limit);
        return JSON.stringify({ creditNotes: data || [], count: (data || []).length });
      }

      case "recurring_invoice_list": {
        const { data } = await supabase
          .from("invoices")
          .select("id, invoice_number, total, recurring_frequency, recurring_next_date, clients(company_name)")
          .eq("is_recurring", true)
          .order("recurring_next_date", { ascending: true })
          .limit(limit);
        return JSON.stringify({ recurringInvoices: data || [], count: (data || []).length });
      }

      case "certificate_list": {
        let query = supabase
          .from("certificates")
          .select("id, certificate_number, certificate_type, status, issue_date, site_name, clients(company_name)")
          .order("created_at", { ascending: false })
          .limit(limit);

        if (filters.status) query = query.eq("status", filters.status);
        const { data } = await query;
        return JSON.stringify({ certificates: data || [], count: (data || []).length });
      }

      case "communication_log": {
        // Resolve clientId from clientName if not provided directly
        let resolvedClientId = filters.clientId || null;
        if (!resolvedClientId && filters.clientName) {
          const { data: clientMatch } = await supabase
            .from("clients")
            .select("id, company_name, last_contact_at, last_contact_summary")
            .ilike("company_name", `%${String(filters.clientName).trim()}%`)
            .limit(1)
            .maybeSingle();
          if (clientMatch) {
            resolvedClientId = clientMatch.id;
          }
        }

        let query = supabase
          .from("client_communications")
          .select("id, timestamp, type, subject, status, content, note_type, is_manual, metadata")
          .order("timestamp", { ascending: false })
          .limit(limit);

        if (resolvedClientId) query = query.eq("client_id", resolvedClientId);

        const { data } = await query;

        // Also pull the client's cached last_contact fields for a quick summary
        let clientSummary: any = null;
        if (resolvedClientId) {
          const { data: cl } = await supabase
            .from("clients")
            .select("company_name, last_contact_at, last_contact_summary")
            .eq("id", resolvedClientId)
            .maybeSingle();
          clientSummary = cl;
        }

        return JSON.stringify({
          communications: data || [],
          count: (data || []).length,
          client: clientSummary,
        });
      }

      case "vat_summary": {
        const { data } = await supabase
          .from("vat_periods")
          .select("*")
          .order("period_start", { ascending: false })
          .limit(6);

        return JSON.stringify({ vatPeriods: data || [], count: (data || []).length });
      }

      case "dashboard_stats": {
        const [invoicesRes, quotesRes, clientsRes, expensesRes, tripsRes, certsRes] = await Promise.all([
          supabase.from("invoices").select("total, amount_paid, balance_due, status, due_date"),
          supabase.from("quotes").select("total, status"),
          supabase.from("clients").select("id").eq("is_active", true),
          supabase.from("expenses").select("amount_inclusive"),
          supabase.from("travel_trips").select("distance_km"),
          supabase.from("certificates").select("id, status"),
        ]);

        const invoices = invoicesRes.data || [];
        const totalRevenue = invoices.reduce((s: number, i: any) => s + Number(i.total || 0), 0);
        const totalPaid = invoices.reduce((s: number, i: any) => s + Number(i.amount_paid || 0), 0);
        const totalOutstanding = invoices.reduce((s: number, i: any) => s + Number(i.balance_due || 0), 0);
        const overdueCount = invoices.filter((i: any) => 
          ["Sent", "Overdue", "Partially Paid"].includes(i.status) && 
          i.due_date && 
          i.due_date < today &&
          i.balance_due > 0
        ).length;

        const quotes = quotesRes.data || [];
        const totalQuoted = quotes.reduce((s: number, q: any) => s + Number(q.total || 0), 0);

        const expenses = expensesRes.data || [];
        const totalExpenses = expenses.reduce((s: number, e: any) => s + Number(e.amount_inclusive || 0), 0);

        const trips = tripsRes.data || [];
        const totalKm = trips.reduce((s: number, t: any) => s + Number(t.distance_km || 0), 0);

        return JSON.stringify({
          invoiceCount: invoices.length,
          totalRevenue: totalRevenue.toFixed(2),
          totalPaid: totalPaid.toFixed(2),
          totalOutstanding: totalOutstanding.toFixed(2),
          overdueCount,
          quoteCount: quotes.length,
          totalQuoted: totalQuoted.toFixed(2),
          clientCount: (clientsRes.data || []).length,
          expenseCount: expenses.length,
          totalExpenses: totalExpenses.toFixed(2),
          tripCount: trips.length,
          totalKmDriven: totalKm,
          certificateCount: (certsRes.data || []).length,
          currency: "ZAR",
        });
      }

      default:
        return JSON.stringify({ error: `Unknown queryType: ${args.queryType}` });
    }
  } catch (err: any) {
    return JSON.stringify({ error: err.message || "Query failed" });
  }
}

async function executeCreateClient(args: any): Promise<string> {
  const supabase = getSupabase();

  const companyName = String(args.companyName || "").trim();
  if (!companyName) {
    return wrapWithActionResult(
      actionFailed({ action: "create_client", targetType: "client", toolUsed: "createClient", error: "Company name is required.", nextStep: "Please provide the client company name." })
    );
  }

  // Check for existing client before creating — with disambiguation
  const { data: existing, error: existingError } = await supabase
    .from("clients")
    .select("id, company_name, email, contact_person")
    .ilike("company_name", `%${companyName}%`)
    .limit(5);

  if (existingError) {
    return wrapWithActionResult(
      actionFailed({ action: "create_client", targetType: "client", toolUsed: "createClient", error: `Database error checking for duplicates: ${existingError.message}`, nextStep: "Please try again." })
    );
  }

  if (existing && existing.length > 0) {
    const exactDuplicate = existing.find(
      (c: any) => c.company_name.toLowerCase() === companyName.toLowerCase()
    );
    if (exactDuplicate) {
      return wrapWithActionResult(
        actionFailed({ action: "create_client", targetType: "client", toolUsed: "createClient", targetReference: exactDuplicate.company_name, error: `A client named "${exactDuplicate.company_name}" already exists.`, nextStep: "Do you want to create a new invoice for them instead?" })
      );
    } else {
      const similarList = existing.map((c: any) => `"${c.company_name}"${c.contact_person ? ` (contact: ${c.contact_person})` : ""}`).join(", ");
      return wrapWithActionResult(
        actionFailed({ action: "create_client", targetType: "client", toolUsed: "createClient", error: `Similar client names already exist: ${similarList}.`, nextStep: `Do you still want to create a new client called "${companyName}", or did you mean one of these?` })
      );
    }
  }

  const clientData = {
    company_name: companyName,
    contact_person: args.contactPerson || null,
    email: args.email || null,
    phone: args.phone || null,
    physical_address: args.physicalAddress || null,
    vat_number: args.vatNumber || null,
    notes: args.notes || null,
    is_active: true,
  };

  const { data, error } = await supabase
    .from("clients")
    .insert(clientData)
    .select("id, company_name")
    .single();

  if (error) {
    return wrapWithActionResult(
      actionFailed({ action: "create_client", targetType: "client", toolUsed: "createClient", error: error.message })
    );
  }

  const verification = await verifyClient(supabase, data.id, { company_name: clientData.company_name });

  return wrapWithActionResult(
    actionSuccess({
      action: "create_client",
      targetType: "client",
      targetReference: data.company_name,
      toolUsed: "createClient",
      summary: `Client "${data.company_name}" created successfully`,
      verified: verification.status === "confirmed",
    }),
    {
      client: {
        id: data.id,
        companyName: data.company_name,
        contactPerson: clientData.contact_person,
        email: clientData.email,
        phone: clientData.phone,
      },
      verification,
    }
  );
}

// ============================================================
// CLIENT UPDATE TOOL
// ============================================================

// Whitelisted fields for client updates — prevents unsafe patching
const CLIENT_UPDATE_WHITELIST = new Set([
  "contact_person",
  "email",
  "phone",
  "physical_address",
  "vat_number",
  "category",
  "notes",
]);

async function executeUpdateClient(args: any): Promise<string> {
  const supabase = getSupabase();

  const clientName = String(args.clientName || "").trim();
  if (!clientName) {
    return wrapWithActionResult(
      actionFailed({ action: "update_client", targetType: "client", toolUsed: "updateClient", error: "Client name is required.", nextStep: "Please provide the client company name." })
    );
  }

  // Resolve client — safe exact-match-first lookup
  const resolved = await resolveClientForWrite(supabase, clientName);

  if (resolved.kind === "not_found") {
    return wrapWithActionResult(
      actionFailed({ action: "update_client", targetType: "client", toolUsed: "updateClient", error: `Could not find a client matching "${clientName}".`, nextStep: "Please check the spelling or create the client first." })
    );
  }

  if (resolved.kind === "ambiguous") {
    return wrapWithActionResult(
      actionNeedInfo({
        action: "update_client",
        targetType: "client",
        toolUsed: "updateClient",
        missingFields: ["clientName"],
        nextStep: `Multiple clients match "${clientName}". Please specify which one: ${resolved.candidates.map((c: any) => `${c.company_name} (${c.email || "no email"})`).join("; ")}`,
      }),
      { disambiguation: { type: "client", query: clientName, candidates: resolved.candidates } }
    );
  }

  const client = resolved.record;

  // Build update payload from whitelisted fields only
  const updatePayload: Record<string, any> = {};
  const fieldMap: Record<string, string> = {
    contactPerson: "contact_person",
    email: "email",
    phone: "phone",
    physicalAddress: "physical_address",
    vatNumber: "vat_number",
    category: "category",
    notes: "notes",
  };

  let hasUpdates = false;
  for (const [argKey, dbKey] of Object.entries(fieldMap)) {
    if (args[argKey] !== undefined && args[argKey] !== null) {
      if (CLIENT_UPDATE_WHITELIST.has(dbKey)) {
        if (dbKey === "notes") {
          // Append to existing notes
          const { data: existing } = await supabase
            .from("clients")
            .select("notes")
            .eq("id", client.id)
            .maybeSingle();
          const existingNotes = existing?.notes || "";
          updatePayload[dbKey] = existingNotes
            ? `${existingNotes}\n${String(args[argKey])}`
            : String(args[argKey]);
        } else {
          updatePayload[dbKey] = String(args[argKey]);
        }
        hasUpdates = true;
      }
    }
  }

  if (!hasUpdates) {
    return wrapWithActionResult(
      actionFailed({
        action: "update_client",
        targetType: "client",
        toolUsed: "updateClient",
        targetReference: client.company_name,
        error: "No valid update fields provided.",
        nextStep: "Allowed fields: contactPerson, email, phone, physicalAddress, vatNumber, category, notes.",
      })
    );
  }

  // Execute update
  const { error: updateError } = await supabase
    .from("clients")
    .update(updatePayload)
    .eq("id", client.id);

  if (updateError) {
    return wrapWithActionResult(
      actionFailed({ action: "update_client", targetType: "client", toolUsed: "updateClient", targetReference: client.company_name, error: updateError.message })
    );
  }

  // Read-after-write verification
  const { data: verified, error: verifyError } = await supabase
    .from("clients")
    .select("company_name, contact_person, email, phone, physical_address, vat_number, category")
    .eq("id", client.id)
    .maybeSingle();

  if (verifyError || !verified) {
    return wrapWithActionResult(
      actionSuccess({
        action: "update_client",
        targetType: "client",
        targetReference: client.company_name,
        toolUsed: "updateClient",
        summary: `Client "${client.company_name}" updated, but verification could not be completed.`,
        verified: false,
      }),
      { updates: updatePayload }
    );
  }

  // Build summary of what changed
  const changedFields = Object.keys(updatePayload).map(k => {
    const displayKey = Object.entries(fieldMap).find(([, v]) => v === k)?.[0] || k;
    return displayKey;
  });

  return wrapWithActionResult(
    actionSuccess({
      action: "update_client",
      targetType: "client",
      targetReference: verified.company_name,
      toolUsed: "updateClient",
      summary: `Client "${verified.company_name}" updated. Changed: ${changedFields.join(", ")}.`,
      verified: true,
    }),
    {
      client: {
        companyName: verified.company_name,
        contactPerson: verified.contact_person,
        email: verified.email,
        phone: verified.phone,
        physicalAddress: verified.physical_address,
        vatNumber: verified.vat_number,
        category: verified.category,
      },
      updatedFields: changedFields,
    }
  );
}

// ============================================================
// CLIENT COMMUNICATION LOGGING TOOL
// ============================================================

const VALID_NOTE_TYPES = ["Phone Call", "Site Visit", "Meeting", "WhatsApp", "Follow-up", "Other"];

async function executeAddClientCommunication(args: any): Promise<string> {
  const supabase = getSupabase();

  const clientName = String(args.clientName || "").trim();
  const content = String(args.content || "").trim();

  if (!clientName) {
    return wrapWithActionResult(
      actionFailed({ action: "add_communication", targetType: "client_communication", toolUsed: "addClientCommunication", error: "Client name is required.", nextStep: "Please provide the client company name." })
    );
  }

  if (!content) {
    return wrapWithActionResult(
      actionFailed({ action: "add_communication", targetType: "client_communication", toolUsed: "addClientCommunication", error: "Content is required.", nextStep: "Please provide the note content or call summary." })
    );
  }

  // Resolve client — safe exact-match-first lookup
  const resolved = await resolveClientForWrite(supabase, clientName);

  if (resolved.kind === "not_found") {
    return wrapWithActionResult(
      actionFailed({ action: "add_communication", targetType: "client_communication", toolUsed: "addClientCommunication", error: `Could not find a client matching "${clientName}".`, nextStep: "Please check the spelling or create the client first." })
    );
  }

  if (resolved.kind === "ambiguous") {
    return wrapWithActionResult(
      actionNeedInfo({
        action: "add_communication",
        targetType: "client_communication",
        toolUsed: "addClientCommunication",
        missingFields: ["clientName"],
        nextStep: `Multiple clients match "${clientName}". Please specify which one: ${resolved.candidates.map((c: any) => `${c.company_name} (${c.email || "no email"})`).join("; ")}`,
      }),
      { disambiguation: { type: "client", query: clientName, candidates: resolved.candidates } }
    );
  }

  const client = resolved.record;

  // Validate note type
  const noteType = String(args.noteType || "Other").trim();
  const validNoteType = VALID_NOTE_TYPES.includes(noteType) ? noteType : "Other";

  // Build subject
  const subject = args.subject
    ? String(args.subject)
    : `${validNoteType}: ${content.substring(0, 50)}${content.length > 50 ? "..." : ""}`;

  // Insert communication record
  const commData = {
    client_id: client.id,
    type: "General",
    subject: subject,
    content: content,
    note_type: validNoteType,
    is_manual: true,
    status: "Recorded",
    timestamp: new Date().toISOString(),
  };

  const { data: inserted, error: insertError } = await supabase
    .from("client_communications")
    .insert(commData)
    .select("id, timestamp")
    .single();

  if (insertError) {
    return wrapWithActionResult(
      actionFailed({ action: "add_communication", targetType: "client_communication", toolUsed: "addClientCommunication", error: insertError.message })
    );
  }

  // Verify the communication was saved and last_contact_at was updated
  const { data: verifiedComm, error: verifyError } = await supabase
    .from("client_communications")
    .select("id, timestamp, note_type, content")
    .eq("id", inserted.id)
    .maybeSingle();

  const { data: updatedClient } = await supabase
    .from("clients")
    .select("last_contact_at, last_contact_summary")
    .eq("id", client.id)
    .maybeSingle();

  const isVerified = !!verifiedComm;

  return wrapWithActionResult(
    actionSuccess({
      action: "add_communication",
      targetType: "client_communication",
      targetReference: `${client.company_name} — ${validNoteType}`,
      toolUsed: "addClientCommunication",
      summary: `${validNoteType} logged for ${client.company_name}. ${content.length > 80 ? content.substring(0, 80) + "..." : content}`,
      verified: isVerified,
    }),
    {
      communication: {
        id: inserted.id,
        clientName: client.company_name,
        noteType: validNoteType,
        subject: subject,
        content: content,
        timestamp: inserted.timestamp,
      },
      clientLastContact: {
        lastContactAt: updatedClient?.last_contact_at || null,
        lastContactSummary: updatedClient?.last_contact_summary || null,
      },
    }
  );
}

// ============================================================
// CLIENT CONTACT CREATION TOOL
// ============================================================

const VALID_CONTACT_TYPES = ["Technical", "Finance", "General"];

async function executeCreateClientContact(args: any): Promise<string> {
  const supabase = getSupabase();

  const clientName = String(args.clientName || "").trim();
  const fullName = String(args.fullName || "").trim();

  if (!clientName) {
    return wrapWithActionResult(
      actionFailed({ action: "create_contact", targetType: "client_contact", toolUsed: "createClientContact", error: "Client name is required.", nextStep: "Please provide the client company name." })
    );
  }

  if (!fullName) {
    return wrapWithActionResult(
      actionFailed({ action: "create_contact", targetType: "client_contact", toolUsed: "createClientContact", error: "Contact full name is required.", nextStep: "Please provide the contact person's full name." })
    );
  }

  // Resolve client — safe exact-match-first lookup
  const resolved = await resolveClientForWrite(supabase, clientName);

  if (resolved.kind === "not_found") {
    return wrapWithActionResult(
      actionFailed({ action: "create_contact", targetType: "client_contact", toolUsed: "createClientContact", error: `Could not find a client matching "${clientName}".`, nextStep: "Please check the spelling or create the client first." })
    );
  }

  if (resolved.kind === "ambiguous") {
    return wrapWithActionResult(
      actionNeedInfo({
        action: "create_contact",
        targetType: "client_contact",
        toolUsed: "createClientContact",
        missingFields: ["clientName"],
        nextStep: `Multiple clients match "${clientName}". Please specify which one: ${resolved.candidates.map((c: any) => `${c.company_name} (${c.email || "no email"})`).join("; ")}`,
      }),
      { disambiguation: { type: "client", query: clientName, candidates: resolved.candidates } }
    );
  }

  const client = resolved.record;

  // Check for duplicate contact by name
  const { data: existingContacts } = await supabase
    .from("client_contacts")
    .select("id, full_name, contact_type, email")
    .eq("client_id", client.id)
    .ilike("full_name", fullName)
    .limit(5);

  if (existingContacts && existingContacts.length > 0) {
    const exactDupe = existingContacts.find((c: any) => c.full_name.toLowerCase() === fullName.toLowerCase());
    if (exactDupe) {
      return wrapWithActionResult(
        actionFailed({
          action: "create_contact",
          targetType: "client_contact",
          toolUsed: "createClientContact",
          targetReference: `${client.company_name} — ${fullName}`,
          error: `A contact named "${exactDupe.full_name}" already exists for ${client.company_name}.`,
          nextStep: "Use updateClientContact to modify the existing contact instead.",
        })
      );
    }
  }

  // Validate contact type
  const contactType = String(args.contactType || "General").trim();
  const validContactType = VALID_CONTACT_TYPES.includes(contactType) ? contactType : "General";

  // Handle isPrimary — if setting as primary, clear existing primary for this client
  const isPrimary = args.isPrimary === true;
  if (isPrimary) {
    await supabase
      .from("client_contacts")
      .update({ is_primary: false })
      .eq("client_id", client.id)
      .eq("is_primary", true);
  }

  const contactData = {
    client_id: client.id,
    full_name: fullName,
    contact_type: validContactType,
    job_title: args.jobTitle || null,
    email: args.email || null,
    cell_number: args.cellNumber || null,
    landline_number: args.landlineNumber || null,
    extension: args.extension || null,
    is_primary: isPrimary,
    notes: args.notes || null,
  };

  const { data: inserted, error: insertError } = await supabase
    .from("client_contacts")
    .insert(contactData)
    .select("id, full_name, contact_type, email, cell_number, is_primary")
    .single();

  if (insertError) {
    return wrapWithActionResult(
      actionFailed({ action: "create_contact", targetType: "client_contact", toolUsed: "createClientContact", error: insertError.message })
    );
  }

  // Verify
  const { data: verified } = await supabase
    .from("client_contacts")
    .select("id, full_name, contact_type, email, cell_number, is_primary")
    .eq("id", inserted.id)
    .maybeSingle();

  const isVerified = !!verified;

  return wrapWithActionResult(
    actionSuccess({
      action: "create_contact",
      targetType: "client_contact",
      targetReference: `${client.company_name} — ${fullName}`,
      toolUsed: "createClientContact",
      summary: `Contact "${fullName}" (${validContactType}) created for ${client.company_name}.${isPrimary ? " Set as primary contact." : ""}`,
      verified: isVerified,
    }),
    {
      contact: {
        id: inserted.id,
        clientName: client.company_name,
        fullName: inserted.full_name,
        contactType: inserted.contact_type,
        email: inserted.email,
        cellNumber: inserted.cell_number,
        isPrimary: inserted.is_primary,
      },
    }
  );
}

// ============================================================
// CLIENT CONTACT UPDATE TOOL
// ============================================================

const CONTACT_UPDATE_WHITELIST = new Set([
  "full_name",
  "contact_type",
  "job_title",
  "email",
  "cell_number",
  "landline_number",
  "extension",
  "is_primary",
  "notes",
]);

async function executeUpdateClientContact(args: any): Promise<string> {
  const supabase = getSupabase();

  const clientName = String(args.clientName || "").trim();
  const contactName = String(args.contactName || "").trim();

  if (!clientName) {
    return wrapWithActionResult(
      actionFailed({ action: "update_contact", targetType: "client_contact", toolUsed: "updateClientContact", error: "Client name is required.", nextStep: "Please provide the client company name." })
    );
  }

  if (!contactName) {
    return wrapWithActionResult(
      actionFailed({ action: "update_contact", targetType: "client_contact", toolUsed: "updateClientContact", error: "Contact name is required to identify the contact.", nextStep: "Please provide the existing contact's full name." })
    );
  }

  // Resolve client
  const resolved = await resolveClientForWrite(supabase, clientName);

  if (resolved.kind === "not_found") {
    return wrapWithActionResult(
      actionFailed({ action: "update_contact", targetType: "client_contact", toolUsed: "updateClientContact", error: `Could not find a client matching "${clientName}".`, nextStep: "Please check the spelling." })
    );
  }

  if (resolved.kind === "ambiguous") {
    return wrapWithActionResult(
      actionNeedInfo({
        action: "update_contact",
        targetType: "client_contact",
        toolUsed: "updateClientContact",
        missingFields: ["clientName"],
        nextStep: `Multiple clients match "${clientName}". Please specify which one: ${resolved.candidates.map((c: any) => `${c.company_name} (${c.email || "no email"})`).join("; ")}`,
      }),
      { disambiguation: { type: "client", query: clientName, candidates: resolved.candidates } }
    );
  }

  const client = resolved.record;

  // Find the contact by name within this client
  const { data: contacts, error: contactErr } = await supabase
    .from("client_contacts")
    .select("id, full_name, contact_type, email, cell_number, is_primary")
    .eq("client_id", client.id)
    .ilike("full_name", `%${contactName}%`)
    .limit(10);

  if (contactErr || !contacts || contacts.length === 0) {
    return wrapWithActionResult(
      actionFailed({
        action: "update_contact",
        targetType: "client_contact",
        toolUsed: "updateClientContact",
        error: `No contact found matching "${contactName}" for ${client.company_name}.`,
        nextStep: "Please check the contact name or create the contact first.",
      })
    );
  }

  if (contacts.length > 1) {
    const exactMatch = contacts.find((c: any) => c.full_name.toLowerCase() === contactName.toLowerCase());
    if (!exactMatch) {
      const contactList = contacts.map((c: any) => `"${c.full_name}" (${c.contact_type})`).join(", ");
      return wrapWithActionResult(
        actionNeedInfo({
          action: "update_contact",
          targetType: "client_contact",
          toolUsed: "updateClientContact",
          missingFields: ["contactName"],
          nextStep: `Multiple contacts match "${contactName}": ${contactList}. Please specify the exact name.`,
        }),
        { disambiguation: { type: "contact", query: contactName, candidates: contacts } }
      );
    }
  }

  const targetContact = contacts.find((c: any) => c.full_name.toLowerCase() === contactName.toLowerCase()) || contacts[0];

  // Build update payload from whitelisted fields
  const updatePayload: Record<string, any> = {};
  const fieldMap: Record<string, string> = {
    fullName: "full_name",
    contactType: "contact_type",
    jobTitle: "job_title",
    email: "email",
    cellNumber: "cell_number",
    landlineNumber: "landline_number",
    extension: "extension",
    isPrimary: "is_primary",
    notes: "notes",
  };

  let hasUpdates = false;
  for (const [argKey, dbKey] of Object.entries(fieldMap)) {
    if (args[argKey] !== undefined && args[argKey] !== null) {
      if (CONTACT_UPDATE_WHITELIST.has(dbKey)) {
        if (dbKey === "contact_type") {
          const val = String(args[argKey]);
          updatePayload[dbKey] = VALID_CONTACT_TYPES.includes(val) ? val : "General";
        } else if (dbKey === "is_primary") {
          updatePayload[dbKey] = args[argKey] === true;
        } else if (dbKey === "notes") {
          // Append to existing
          const { data: existing } = await supabase
            .from("client_contacts")
            .select("notes")
            .eq("id", targetContact.id)
            .maybeSingle();
          const existingNotes = existing?.notes || "";
          updatePayload[dbKey] = existingNotes
            ? `${existingNotes}\n${String(args[argKey])}`
            : String(args[argKey]);
        } else {
          updatePayload[dbKey] = String(args[argKey]);
        }
        hasUpdates = true;
      }
    }
  }

  if (!hasUpdates) {
    return wrapWithActionResult(
      actionFailed({
        action: "update_contact",
        targetType: "client_contact",
        toolUsed: "updateClientContact",
        error: "No valid update fields provided.",
        nextStep: "Allowed fields: fullName, contactType, jobTitle, email, cellNumber, landlineNumber, extension, isPrimary, notes.",
      })
    );
  }

  // If setting as primary, clear existing primary
  if (updatePayload.is_primary === true) {
    await supabase
      .from("client_contacts")
      .update({ is_primary: false })
      .eq("client_id", client.id)
      .eq("is_primary", true)
      .neq("id", targetContact.id);
  }

  // Execute update
  const { error: updateError } = await supabase
    .from("client_contacts")
    .update(updatePayload)
    .eq("id", targetContact.id);

  if (updateError) {
    return wrapWithActionResult(
      actionFailed({ action: "update_contact", targetType: "client_contact", toolUsed: "updateClientContact", error: updateError.message })
    );
  }

  // Verify
  const { data: verified } = await supabase
    .from("client_contacts")
    .select("id, full_name, contact_type, email, cell_number, job_title, is_primary")
    .eq("id", targetContact.id)
    .maybeSingle();

  const changedFields = Object.keys(updatePayload).map(k => {
    const displayKey = Object.entries(fieldMap).find(([, v]) => v === k)?.[0] || k;
    return displayKey;
  });

  return wrapWithActionResult(
    actionSuccess({
      action: "update_contact",
      targetType: "client_contact",
      targetReference: `${client.company_name} — ${verified?.full_name || targetContact.full_name}`,
      toolUsed: "updateClientContact",
      summary: `Contact "${verified?.full_name || targetContact.full_name}" updated for ${client.company_name}. Changed: ${changedFields.join(", ")}.`,
      verified: !!verified,
    }),
    {
      contact: {
        id: targetContact.id,
        clientName: client.company_name,
        fullName: verified?.full_name,
        contactType: verified?.contact_type,
        email: verified?.email,
        cellNumber: verified?.cell_number,
        jobTitle: verified?.job_title,
        isPrimary: verified?.is_primary,
      },
      updatedFields: changedFields,
    }
  );
}

async function executeLogExpense(args: any): Promise<string> {
  const supabase = getSupabase();
  const today = new Date().toISOString().split("T")[0];

  const supplierName = String(args.supplierName || "").trim();
  const description = String(args.description || "").trim();
  const amountInclusive = Number(args.amountInclusive) || 0;

  if (!supplierName || !description || amountInclusive <= 0) {
    return wrapWithActionResult(
      actionFailed({ action: "log_expense", targetType: "expense", toolUsed: "logExpense", error: "Supplier name, description, and a positive amount are required.", nextStep: "Please provide all three details." })
    );
  }

  const vatClaimable = args.vatClaimable !== false; // default true
  const vatAmount = vatClaimable ? (amountInclusive * 15) / 115 : 0;
  const amountExclusive = amountInclusive - vatAmount;

  const expenseData = {
    expense_date: args.expenseDate || today,
    supplier_name: supplierName,
    description: description,
    category: args.category || "Other",
    amount_inclusive: amountInclusive,
    vat_claimable: vatClaimable,
    notes: args.notes || `Logged via AI on ${today}`,
  };

  const { data, error } = await supabase
    .from("expenses")
    .insert(expenseData)
    .select("id")
    .single();

  if (error) {
    return wrapWithActionResult(
      actionFailed({ action: "log_expense", targetType: "expense", toolUsed: "logExpense", error: error.message })
    );
  }

  const verification = await verifyExpense(supabase, data.id, {
    amount_inclusive: expenseData.amount_inclusive,
    description: expenseData.description,
  });

  return wrapWithActionResult(
    actionSuccess({
      action: "log_expense",
      targetType: "expense",
      targetReference: `${supplierName} — ${description}`,
      toolUsed: "logExpense",
      summary: `Expense logged: ${supplierName}, ${description}, R${amountInclusive.toFixed(2)} (${expenseData.category})`,
      verified: verification.status === "confirmed",
    }),
    {
      expense: {
        id: data.id,
        supplier: supplierName,
        description: description,
        amountInclusive: amountInclusive.toFixed(2),
        amountExclusive: amountExclusive.toFixed(2),
        vatAmount: vatAmount.toFixed(2),
        vatClaimable,
        category: expenseData.category,
        date: expenseData.expense_date,
      },
      verification,
      currency: "ZAR",
    }
  );
}

async function executeRecordPayment(args: any): Promise<string> {
  const supabase = getSupabase();
  const today = new Date().toISOString().split("T")[0];

  const invoiceRef = String(args.invoiceReference || "").trim().toUpperCase();
  const amount = Number(args.amount) || 0;

  if (!invoiceRef || amount <= 0) {
    return wrapWithActionResult(
      actionFailed({ action: "record_payment", targetType: "payment", toolUsed: "recordPayment", error: "Invoice reference and a positive payment amount are required.", nextStep: "Please provide the invoice number (e.g., INV-0001) and payment amount." })
    );
  }

  // Look up the invoice — safe exact-match-first resolver
  const resolved = await resolveInvoiceForWrite(supabase, invoiceRef);

  if (resolved.kind === "not_found") {
    return wrapWithActionResult(
      actionFailed({ action: "record_payment", targetType: "payment", toolUsed: "recordPayment", targetReference: invoiceRef, error: `Invoice "${invoiceRef}" not found.`, nextStep: "Please check the invoice reference number." })
    );
  }

  if (resolved.kind === "ambiguous") {
    return wrapWithActionResult(
      actionNeedInfo({
        action: "record_payment",
        targetType: "payment",
        toolUsed: "recordPayment",
        missingFields: ["invoiceReference"],
        nextStep: `Multiple invoices match "${invoiceRef}". Please specify which one: ${resolved.candidates.map((c: any) => `${c.invoice_number} — ${c.client_name} (R${c.total}, ${c.status})`).join("; ")}`,
      }),
      { disambiguation: { type: "invoice", query: invoiceRef, candidates: resolved.candidates } }
    );
  }

  const invoice = resolved.kind === "exact" ? resolved.record : resolved.record;

  // Atomic payment recording via DB function
  const { data: result, error: rpcError } = await supabase.rpc("record_invoice_payment", {
    p_invoice_id: invoice.id,
    p_amount: amount,
    p_payment_date: args.paymentDate || today,
    p_payment_method: args.paymentMethod || "EFT",
    p_reference: args.reference || null,
    p_notes: args.notes || `Recorded via AI on ${today}`,
  });

  if (rpcError) {
    return wrapWithActionResult(
      actionFailed({ action: "record_payment", targetType: "payment", toolUsed: "recordPayment", targetReference: invoiceRef, error: rpcError.message, nextStep: rpcError.message.includes("overpayment") ? "The payment amount exceeds the remaining balance." : "Please check the invoice and try again." })
    );
  }

  if (!result || !result.success) {
    return wrapWithActionResult(
      actionFailed({ action: "record_payment", targetType: "payment", toolUsed: "recordPayment", targetReference: invoiceRef, error: result?.error || "Payment recording failed." })
    );
  }

  const clientName = (invoice as any).clients?.company_name || "Unknown";

  const verification = await verifyPayment(supabase, invoice.id, {
    amountPaid: amount,
    expectedStatus: result.new_status,
  });

  return wrapWithActionResult(
    actionSuccess({
      action: "record_payment",
      targetType: "payment",
      targetReference: invoice.invoice_number,
      toolUsed: "recordPayment",
      summary: `Payment of R${amount.toFixed(2)} recorded against ${invoice.invoice_number} (${clientName}). Status: ${result.previous_status} → ${result.new_status}. Balance: R${Number(result.balance_due).toFixed(2)}.`,
      verified: verification.status === "confirmed",
    }),
    {
      payment: {
        invoiceNumber: invoice.invoice_number,
        clientName,
        amountPaid: amount.toFixed(2),
        totalPaid: Number(result.amount_paid).toFixed(2),
        invoiceTotal: Number(result.invoice_total).toFixed(2),
        remainingBalance: Number(result.balance_due).toFixed(2),
        newStatus: result.new_status,
        paymentMethod: args.paymentMethod || "EFT",
        date: args.paymentDate || today,
      },
      verification,
      currency: "ZAR",
    }
  );
}

async function executeDraftQuote(args: any): Promise<string> {
  const supabase = getSupabase();

  const clientName = String(args.clientName || "").trim();
  if (!clientName) {
    return wrapWithActionResult(
      actionFailed({ action: "draft_quote", targetType: "quote", toolUsed: "draftQuote", error: "Client name is required.", nextStep: "Please provide the client name." })
    );
  }

  const lineItems = args.lineItems || [];
  if (!Array.isArray(lineItems) || lineItems.length === 0) {
    return wrapWithActionResult(
      actionFailed({ action: "draft_quote", targetType: "quote", toolUsed: "draftQuote", error: "At least one line item is required.", nextStep: "Please provide line items with description, quantity, and unitPrice." })
    );
  }

  // Resolve client — safe exact-match-first lookup
  const resolved = await resolveClientForWrite(supabase, clientName);

  if (resolved.kind === "not_found") {
    return wrapWithActionResult(
      actionFailed({ action: "draft_quote", targetType: "quote", toolUsed: "draftQuote", error: `Could not find a client matching "${clientName}".`, nextStep: "Please create the client first or check the spelling." })
    );
  }

  if (resolved.kind === "ambiguous") {
    return wrapWithActionResult(
      actionNeedInfo({
        action: "draft_quote",
        targetType: "quote",
        toolUsed: "draftQuote",
        missingFields: ["clientName"],
        nextStep: `Multiple clients match "${clientName}". Please specify which one: ${resolved.candidates.map((c: any) => `${c.company_name} (${c.email || "no email"})`).join("; ")}`,
      }),
      { disambiguation: { type: "client", query: clientName, candidates: resolved.candidates } }
    );
  }

  const client = resolved.kind === "exact" ? resolved.record : resolved.record;

  // Prepare line items as JSONB array for the atomic DB function
  const itemsJson = lineItems.map((item: any) => ({
    description: String(item.description || "").trim(),
    quantity: Number(item.quantity) || 1,
    unit_price: Number(item.unitPrice) || 0,
  }));

  // Call atomic DB function — header + items + totals in one transaction
  const { data: result, error: rpcError } = await supabase.rpc("create_quote_with_items", {
    p_client_id: client.id,
    p_line_items: itemsJson,
    p_notes: args.notes || null,
    p_internal_notes: `Drafted by AI on ${new Date().toISOString().split("T")[0]}`,
  });

  if (rpcError || !result) {
    console.error("[draftQuote] Atomic creation failed:", rpcError);
    return wrapWithActionResult(
      actionFailed({ action: "draft_quote", targetType: "quote", toolUsed: "draftQuote", error: rpcError?.message || "Quote creation failed.", nextStep: "Please try again or check the quote list." })
    );
  }

  const quoteNumber = result.document_number;
  const total = Number(result.total) || 0;

  console.log("[draftQuote] Atomically created quote:", quoteNumber, "for client:", client.company_name);

  const verification = await verifyQuote(supabase, result.id, {
    quote_number: quoteNumber,
    lineItemCount: result.line_item_count,
  });

  return wrapWithActionResult(
    actionSuccess({
      action: "draft_quote",
      targetType: "quote",
      targetReference: quoteNumber,
      toolUsed: "draftQuote",
      summary: `Quote ${quoteNumber} created for ${client.company_name} — R${total.toFixed(2)}`,
      verified: verification.status === "confirmed",
    }),
    {
      quote: { id: result.id, quoteNumber, clientName: result.client_name, total: total.toFixed(2), status: result.status },
      verification,
    }
  );
}

async function executeDraftInvoice(args: any): Promise<string> {
  const supabase = getSupabase();

  const clientName = String(args.clientName || "").trim();
  if (!clientName) {
    return wrapWithActionResult(
      actionFailed({ action: "draft_invoice", targetType: "invoice", toolUsed: "draftInvoice", error: "Client name is required.", nextStep: "Please provide the client name." })
    );
  }

  const lineItems = args.lineItems || [];
  if (!Array.isArray(lineItems) || lineItems.length === 0) {
    return wrapWithActionResult(
      actionFailed({ action: "draft_invoice", targetType: "invoice", toolUsed: "draftInvoice", error: "At least one line item is required.", nextStep: "Please provide line items with description, quantity, and unitPrice." })
    );
  }

  // Resolve client — safe exact-match-first lookup
  const resolved = await resolveClientForWrite(supabase, clientName);

  if (resolved.kind === "not_found") {
    return wrapWithActionResult(
      actionFailed({ action: "draft_invoice", targetType: "invoice", toolUsed: "draftInvoice", error: `Could not find a client matching "${clientName}".`, nextStep: "Please create the client first or check the spelling." })
    );
  }

  if (resolved.kind === "ambiguous") {
    return wrapWithActionResult(
      actionNeedInfo({
        action: "draft_invoice",
        targetType: "invoice",
        toolUsed: "draftInvoice",
        missingFields: ["clientName"],
        nextStep: `Multiple clients match "${clientName}". Please specify which one: ${resolved.candidates.map((c: any) => `${c.company_name} (${c.email || "no email"})`).join("; ")}`,
      }),
      { disambiguation: { type: "client", query: clientName, candidates: resolved.candidates } }
    );
  }

  const client = resolved.kind === "exact" ? resolved.record : resolved.record;

  const itemsJson = lineItems.map((item: any) => ({
    description: String(item.description || "").trim(),
    quantity: Number(item.quantity) || 1,
    unit_price: Number(item.unitPrice) || 0,
  }));

  const { data: result, error: rpcError } = await supabase.rpc("create_invoice_with_items", {
    p_client_id: client.id,
    p_line_items: itemsJson,
    p_notes: args.notes || null,
    p_internal_notes: `Drafted by AI on ${new Date().toISOString().split("T")[0]}`,
    p_is_recurring: !!args.isRecurring,
    p_recurring_freq: args.recurringFrequency || null,
  });

  if (rpcError || !result) {
    console.error("[draftInvoice] Atomic creation failed:", rpcError);
    return wrapWithActionResult(
      actionFailed({ action: "draft_invoice", targetType: "invoice", toolUsed: "draftInvoice", error: rpcError?.message || "Invoice creation failed.", nextStep: "Please try again or check the invoice list." })
    );
  }

  const invoiceNumber = result.document_number;
  const total = Number(result.total) || 0;

  console.log("[draftInvoice] Atomically created invoice:", invoiceNumber, "for client:", client.company_name);

  const verification = await verifyInvoice(supabase, result.id, {
    invoice_number: invoiceNumber,
    client_id: result.client_id,
    lineItemCount: result.line_item_count,
  });

  return wrapWithActionResult(
    actionSuccess({
      action: "draft_invoice",
      targetType: "invoice",
      targetReference: invoiceNumber,
      toolUsed: "draftInvoice",
      summary: `Invoice ${invoiceNumber} created for ${client.company_name} — R${total.toFixed(2)}`,
      verified: verification.status === "confirmed",
    }),
    {
      invoice: { id: result.id, invoiceNumber, clientName: result.client_name, total: total.toFixed(2), status: result.status },
      verification,
    }
  );
}

async function executeDraftPurchaseOrder(args: any): Promise<string> {
  const supabase = getSupabase();

  const supplierName = String(args.supplierName || "").trim();
  if (!supplierName) {
    return wrapWithActionResult(
      actionFailed({ action: "draft_purchase_order", targetType: "purchase_order", toolUsed: "draftPurchaseOrder", error: "Supplier name is required.", nextStep: "Please provide the supplier name." })
    );
  }

  const lineItems = args.lineItems || [];
  if (!Array.isArray(lineItems) || lineItems.length === 0) {
    return wrapWithActionResult(
      actionFailed({ action: "draft_purchase_order", targetType: "purchase_order", toolUsed: "draftPurchaseOrder", error: "At least one line item is required.", nextStep: "Please provide line items with description, quantity, and unitPrice." })
    );
  }

  const itemsJson = lineItems.map((item: any) => ({
    description: String(item.description || "").trim(),
    quantity: Number(item.quantity) || 1,
    unit_price: Number(item.unitPrice) || 0,
  }));

  const { data: result, error: rpcError } = await supabase.rpc("create_purchase_order_with_items", {
    p_supplier_name: supplierName,
    p_line_items: itemsJson,
    p_notes: args.notes || null,
    p_date_raised: null,
  });

  if (rpcError || !result) {
    console.error("[draftPurchaseOrder] Atomic creation failed:", rpcError);
    return wrapWithActionResult(
      actionFailed({ action: "draft_purchase_order", targetType: "purchase_order", toolUsed: "draftPurchaseOrder", error: rpcError?.message || "Purchase order creation failed.", nextStep: "Please try again or check the PO list." })
    );
  }

  const poNumber = result.document_number;
  const total = Number(result.total) || 0;

  console.log("[draftPurchaseOrder] Atomically created PO:", poNumber, "for supplier:", supplierName);

  const verification = await verifyPurchaseOrder(supabase, result.id, {
    po_number: poNumber,
    lineItemCount: result.line_item_count,
  });

  return wrapWithActionResult(
    actionSuccess({
      action: "draft_purchase_order",
      targetType: "purchase_order",
      targetReference: poNumber,
      toolUsed: "draftPurchaseOrder",
      summary: `PO ${poNumber} created for ${supplierName} — R${total.toFixed(2)}`,
      verified: verification.status === "confirmed",
    }),
    { po: { id: result.id, poNumber, supplierName: result.supplier_name, total: total.toFixed(2) }, verification }
  );
}

async function executeDraftCreditNote(args: any): Promise<string> {
  const supabase = getSupabase();

  const clientName = String(args.clientName || "").trim();
  if (!clientName) {
    return wrapWithActionResult(
      actionFailed({ action: "draft_credit_note", targetType: "credit_note", toolUsed: "draftCreditNote", error: "Client name is required.", nextStep: "Please provide the client name." })
    );
  }

  const lineItems = args.lineItems || [];
  if (!Array.isArray(lineItems) || lineItems.length === 0) {
    return wrapWithActionResult(
      actionFailed({ action: "draft_credit_note", targetType: "credit_note", toolUsed: "draftCreditNote", error: "At least one line item is required.", nextStep: "Please provide line items with description, quantity, and unitPrice." })
    );
  }

  const resolved = await resolveClientForWrite(supabase, clientName);

  if (resolved.kind === "not_found") {
    return wrapWithActionResult(
      actionFailed({ action: "draft_credit_note", targetType: "credit_note", toolUsed: "draftCreditNote", error: `Could not find a client matching "${clientName}".`, nextStep: "Please create the client first or check the spelling." })
    );
  }

  if (resolved.kind === "ambiguous") {
    return wrapWithActionResult(
      actionNeedInfo({
        action: "draft_credit_note",
        targetType: "credit_note",
        toolUsed: "draftCreditNote",
        missingFields: ["clientName"],
        nextStep: `Multiple clients match "${clientName}". Please specify which one: ${resolved.candidates.map((c: any) => `${c.company_name} (${c.email || "no email"})`).join("; ")}`,
      }),
      { disambiguation: { type: "client", query: clientName, candidates: resolved.candidates } }
    );
  }

  const client = resolved.kind === "exact" ? resolved.record : resolved.record;

  const itemsJson = lineItems.map((item: any) => ({
    description: String(item.description || "").trim(),
    quantity: Number(item.quantity) || 1,
    unit_price: Number(item.unitPrice) || 0,
  }));

  const { data: result, error: rpcError } = await supabase.rpc("create_credit_note_with_items", {
    p_client_id: client.id,
    p_line_items: itemsJson,
    p_reason: args.reason || null,
    p_notes: args.notes || null,
  });

  if (rpcError || !result) {
    console.error("[draftCreditNote] Atomic creation failed:", rpcError);
    return wrapWithActionResult(
      actionFailed({ action: "draft_credit_note", targetType: "credit_note", toolUsed: "draftCreditNote", error: rpcError?.message || "Credit note creation failed.", nextStep: "Please try again or check the credit note list." })
    );
  }

  const cnNumber = result.document_number;
  const total = Number(result.total) || 0;

  console.log("[draftCreditNote] Atomically created CN:", cnNumber, "for client:", client.company_name);

  const verification = await verifyCreditNote(supabase, result.id, {
    cn_number: cnNumber,
    lineItemCount: result.line_item_count,
  });

  return wrapWithActionResult(
    actionSuccess({
      action: "draft_credit_note",
      targetType: "credit_note",
      targetReference: cnNumber,
      toolUsed: "draftCreditNote",
      summary: `Credit Note ${cnNumber} created for ${client.company_name} — R${total.toFixed(2)}`,
      verified: verification.status === "confirmed",
    }),
    { creditNote: { id: result.id, cnNumber, clientName: result.client_name, total: total.toFixed(2) }, verification }
  );
}

// ============================================================
// INVOICE STATUS MANAGEMENT TOOLS
// ============================================================

async function executeUpdateInvoiceStatus(args: { invoiceReference: string; newStatus: string }): Promise<string> {
  const supabase = getSupabase();
  try {
    const allowedStatuses = ["Draft", "Sent", "Overdue"];
    if (!allowedStatuses.includes(args.newStatus)) {
      return JSON.stringify({
        error: `Status '${args.newStatus}' is not allowed via this tool. Allowed: ${allowedStatuses.join(", ")}. Use markInvoicePaid to mark as paid, or voidInvoice to cancel.`
      });
    }

    const resolved = await resolveInvoiceForWrite(supabase, args.invoiceReference);

    if (resolved.kind === "not_found") {
      return JSON.stringify({ error: `No invoice found matching '${args.invoiceReference}'. Please check the invoice number.` });
    }

    if (resolved.kind === "ambiguous") {
      const matches = resolved.candidates.map((inv: any) => `${inv.invoice_number} (status: ${inv.status}, total: R${inv.total}, balance: R${inv.balance_due})`).join(", ");
      return JSON.stringify({
        error: `Multiple invoices match '${args.invoiceReference}': ${matches}. Please provide the exact invoice number.`
      });
    }

    const targetInvoice = resolved.record;

    if (targetInvoice.status === "Cancelled") {
      return JSON.stringify({
        error: `Invoice ${targetInvoice.invoice_number} is cancelled and cannot be updated. Create a new invoice instead.`
      });
    }

    if (targetInvoice.status === "Paid") {
      return JSON.stringify({
        error: `Invoice ${targetInvoice.invoice_number} is already marked as paid. It cannot be changed to '${args.newStatus}'.`
      });
    }

    if (targetInvoice.status === args.newStatus) {
      return JSON.stringify({
        success: true,
        message: `Invoice ${targetInvoice.invoice_number} is already '${args.newStatus}'. No change needed.`,
        invoice_number: targetInvoice.invoice_number,
        status: targetInvoice.status
      });
    }

    const { error: updateError } = await supabase
      .from("invoices")
      .update({ status: args.newStatus })
      .eq("id", targetInvoice.id);

    if (updateError) {
      return JSON.stringify({ error: `Failed to update invoice status: ${updateError.message}` });
    }

    // Read-after-write verification
    const { data: verified, error: verifyError } = await supabase
      .from("invoices")
      .select("invoice_number, status")
      .eq("id", targetInvoice.id)
      .single();

    if (verifyError || verified.status !== args.newStatus) {
      return JSON.stringify({
        error: `Update was attempted but verification failed. Please check invoice ${targetInvoice.invoice_number} manually.`
      });
    }

    return JSON.stringify({
      success: true,
      invoice_number: verified.invoice_number,
      previous_status: targetInvoice.status,
      new_status: verified.status,
      message: `Invoice ${verified.invoice_number} status changed from '${targetInvoice.status}' to '${verified.status}'.`
    });

  } catch (err: any) {
    return JSON.stringify({ error: `Unexpected error: ${err.message}` });
  }
}

async function executeUpdatePurchaseOrderStatus(args: { poReference: string; newStatus: string }): Promise<string> {
  const supabase = getSupabase();
  try {
    const allowedStatuses = ["Draft", "Sent", "Acknowledged", "Delivered", "Cancelled"];
    if (!allowedStatuses.includes(args.newStatus)) {
      return JSON.stringify({
        error: `Status '${args.newStatus}' is not allowed via this tool. Allowed: ${allowedStatuses.join(", ")}.`,
      });
    }

    const resolved = await resolvePOForWrite(supabase, args.poReference);

    if (resolved.kind === "not_found") {
      return JSON.stringify({ error: `No purchase order found matching '${args.poReference}'. Please check the PO number.` });
    }

    if (resolved.kind === "ambiguous") {
      const matches = resolved.candidates.map((po: any) => `${po.po_number} (status: ${po.status}, total: R${po.total})`).join(", ");
      return JSON.stringify({
        error: `Multiple purchase orders match '${args.poReference}': ${matches}. Please provide the exact PO number.`,
      });
    }

    const targetPO = resolved.record;

    if (targetPO.status === "Cancelled") {
      return JSON.stringify({
        error: `Purchase order ${targetPO.po_number} is cancelled and cannot be updated. Create a new PO instead.`,
      });
    }

    if (targetPO.status === "Delivered" && ["Draft", "Sent"].includes(args.newStatus)) {
      return JSON.stringify({
        error: `Purchase order ${targetPO.po_number} is Delivered and cannot be moved back to '${args.newStatus}'.`,
      });
    }

    if (targetPO.status === args.newStatus) {
      return JSON.stringify({
        success: true,
        message: `Purchase order ${targetPO.po_number} is already '${args.newStatus}'. No change needed.`,
        po_number: targetPO.po_number,
        status: targetPO.status,
      });
    }

    const { error: updateError } = await supabase
      .from("purchase_orders")
      .update({ status: args.newStatus })
      .eq("id", targetPO.id);

    if (updateError) {
      return JSON.stringify({ error: `Failed to update purchase order status: ${updateError.message}` });
    }

    const { data: verified, error: verifyError } = await supabase
      .from("purchase_orders")
      .select("po_number, status, supplier_name")
      .eq("id", targetPO.id)
      .single();

    if (verifyError || verified.status !== args.newStatus) {
      return JSON.stringify({
        error: `Update was attempted but verification failed. Please check purchase order ${targetPO.po_number} manually.`,
      });
    }

    return JSON.stringify({
      success: true,
      po_number: verified.po_number,
      previous_status: targetPO.status,
      new_status: verified.status,
      supplier_name: verified.supplier_name,
      message: `Purchase order ${verified.po_number} status changed from '${targetPO.status}' to '${verified.status}'.`,
    });
  } catch (err: any) {
    return JSON.stringify({ error: `Unexpected error: ${err.message}` });
  }
}

async function executeUpdateCreditNoteStatus(args: { creditNoteReference: string; newStatus: string }): Promise<string> {
  const supabase = getSupabase();
  try {
    const allowedStatuses = ["Draft", "Sent", "Issued", "Applied", "Cancelled"];
    if (!allowedStatuses.includes(args.newStatus)) {
      return JSON.stringify({
        error: `Status '${args.newStatus}' is not allowed via this tool. Allowed: ${allowedStatuses.join(", ")}.`,
      });
    }

    const ref = (args.creditNoteReference || "").trim();
    if (!ref) {
      return JSON.stringify({ error: "Credit note reference is required." });
    }

    const resolved = await resolveCreditNoteForWrite(supabase, ref);

    if (resolved.kind === "not_found") {
      return JSON.stringify({ error: `No credit note found matching '${ref}'. Please check the credit note number.` });
    }

    if (resolved.kind === "ambiguous") {
      const matches = resolved.candidates.map((cn: any) => `${cn.cn_number} (status: ${cn.status}, total: R${cn.total})`).join(", ");
      return JSON.stringify({
        error: `Multiple credit notes match '${ref}': ${matches}. Please provide the exact credit note number.`,
      });
    }

    const targetCN = resolved.record;
    const targetRef = targetCN.cn_number || ref;

    if (targetCN.status === "Applied") {
      return JSON.stringify({
        error: `Credit note ${targetRef} is already Applied and cannot be changed.`,
      });
    }

    if (targetCN.status === "Cancelled") {
      return JSON.stringify({
        error: `Credit note ${targetRef} is cancelled and cannot be updated.`,
      });
    }

    if (targetCN.status === args.newStatus) {
      return JSON.stringify({
        success: true,
        message: `Credit note ${targetRef} is already '${args.newStatus}'. No change needed.`,
        credit_note_reference: targetRef,
        status: targetCN.status,
      });
    }

    const { error: updateError } = await supabase
      .from("credit_notes")
      .update({ status: args.newStatus })
      .eq("id", targetCN.id);

    if (updateError) {
      return JSON.stringify({ error: `Failed to update credit note status: ${updateError.message}` });
    }

    const { data: verified, error: verifyError } = await supabase
      .from("credit_notes")
      .select("cn_number, status, total")
      .eq("id", targetCN.id)
      .single();

    if (verifyError || !verified || verified.status !== args.newStatus) {
      return JSON.stringify({
        error: `Update was attempted but verification failed. Please check credit note ${targetRef} manually.`,
      });
    }

    const verifiedRef = verified.cn_number || targetRef;

    return JSON.stringify({
      success: true,
      credit_note_reference: verifiedRef,
      previous_status: targetCN.status,
      new_status: verified.status,
      total: verified.total,
      message: `Credit note ${verifiedRef} status changed from '${targetCN.status}' to '${verified.status}'.`,
    });
  } catch (err: any) {
    return JSON.stringify({ error: `Unexpected error: ${err.message}` });
  }
}

async function executeMarkInvoicePaid(args: { invoiceReference: string }): Promise<string> {
  const supabase = getSupabase();
  try {
    const resolved = await resolveInvoiceForWrite(supabase, args.invoiceReference);

    if (resolved.kind === "not_found") {
      return JSON.stringify({ error: `No invoice found matching '${args.invoiceReference}'. Please check the invoice number.` });
    }

    if (resolved.kind === "ambiguous") {
      const matches = resolved.candidates.map((inv: any) => `${inv.invoice_number} (status: ${inv.status}, total: R${inv.total}, balance: R${inv.balance_due})`).join(", ");
      return JSON.stringify({
        error: `Multiple invoices match '${args.invoiceReference}': ${matches}. Please provide the exact invoice number.`
      });
    }

    const targetInvoice = resolved.record;

    if (targetInvoice.status === "Paid") {
      return JSON.stringify({
        success: true,
        message: `Invoice ${targetInvoice.invoice_number} is already marked as Paid.`,
        invoice_number: targetInvoice.invoice_number,
        status: "Paid"
      });
    }

    if (targetInvoice.status === "Cancelled") {
      return JSON.stringify({
        error: `Invoice ${targetInvoice.invoice_number} is cancelled and cannot be marked as paid.`
      });
    }

    // Use record_invoice_payment for proper audit trail instead of direct update
    const remainingBalance = Number(targetInvoice.balance_due) || (Number(targetInvoice.total) - Number(targetInvoice.amount_paid));
    
    if (remainingBalance <= 0) {
      return JSON.stringify({
        success: true,
        message: `Invoice ${targetInvoice.invoice_number} already has zero balance.`,
        invoice_number: targetInvoice.invoice_number,
        status: targetInvoice.status
      });
    }

    const { data: result, error: rpcError } = await supabase.rpc("record_invoice_payment", {
      p_invoice_id: targetInvoice.id,
      p_amount: remainingBalance,
      p_payment_date: new Date().toISOString().split("T")[0],
      p_payment_method: "EFT",
      p_reference: "Full settlement",
      p_notes: "Marked as paid via AI assistant"
    });

    if (rpcError) {
      return JSON.stringify({ error: `Failed to mark invoice as paid: ${rpcError.message}` });
    }

    if (!result || !result.success) {
      return JSON.stringify({ error: result?.error || "Payment recording failed." });
    }

    return JSON.stringify({
      success: true,
      invoice_number: result.invoice_number,
      previous_status: result.previous_status,
      new_status: result.new_status,
      total: result.invoice_total,
      amount_paid: result.amount_paid,
      balance_due: result.balance_due,
      message: `Invoice ${result.invoice_number} has been marked as Paid. Total: R${result.invoice_total}, Balance due: R${result.balance_due}.`
    });

  } catch (err: any) {
    return JSON.stringify({ error: `Unexpected error: ${err.message}` });
  }
}

async function executeVoidInvoice(args: { invoiceReference: string }): Promise<string> {
  const supabase = getSupabase();
  try {
    const resolved = await resolveInvoiceForWrite(supabase, args.invoiceReference);

    if (resolved.kind === "not_found") {
      return JSON.stringify({ error: `No invoice found matching '${args.invoiceReference}'. Please check the invoice number.` });
    }

    if (resolved.kind === "ambiguous") {
      const matches = resolved.candidates.map((inv: any) => `${inv.invoice_number} (status: ${inv.status}, total: R${inv.total}, balance: R${inv.balance_due})`).join(", ");
      return JSON.stringify({
        error: `Multiple invoices match '${args.invoiceReference}': ${matches}. Please provide the exact invoice number.`
      });
    }

    const targetInvoice = resolved.record;

    if (targetInvoice.status === "Cancelled") {
      return JSON.stringify({
        success: true,
        message: `Invoice ${targetInvoice.invoice_number} is already cancelled.`,
        invoice_number: targetInvoice.invoice_number,
        status: "Cancelled"
      });
    }

    // Use the hardened void function with proper guards
    const { data: result, error: rpcError } = await supabase.rpc("void_invoice_with_reversal", {
      p_invoice_id: targetInvoice.id,
      p_reason: "Voided via AI assistant"
    });

    if (rpcError) {
      return JSON.stringify({ error: `Failed to void invoice: ${rpcError.message}` });
    }

    if (!result || !result.success) {
      return JSON.stringify({ error: result?.error || "Invoice voiding failed." });
    }

    return JSON.stringify({
      success: true,
      invoice_number: result.invoice_number,
      previous_status: result.previous_status,
      new_status: result.new_status,
      message: `Invoice ${result.invoice_number} has been voided (status: Cancelled).`
    });

  } catch (err: any) {
    return JSON.stringify({ error: `Unexpected error: ${err.message}` });
  }
}

// ============================================================
// STATUS TRANSITION EXECUTORS
// ============================================================

async function executeMarkInvoiceSent(args: { invoiceReference: string }): Promise<string> {
  return executeDocumentTransition({ documentType: "invoice", reference: args.invoiceReference, action: "mark_sent" });
}

async function executeReopenInvoice(args: { invoiceReference: string }): Promise<string> {
  return executeDocumentTransition({ documentType: "invoice", reference: args.invoiceReference, action: "reopen" });
}

async function executeMarkQuoteSent(args: { quoteReference: string }): Promise<string> {
  return executeDocumentTransition({ documentType: "quote", reference: args.quoteReference, action: "mark_sent" });
}

async function executeAcceptQuote(args: { quoteReference: string }): Promise<string> {
  return executeDocumentTransition({ documentType: "quote", reference: args.quoteReference, action: "accept" });
}

async function executeDeclineQuote(args: { quoteReference: string }): Promise<string> {
  return executeDocumentTransition({ documentType: "quote", reference: args.quoteReference, action: "decline" });
}

async function executeExpireQuote(args: { quoteReference: string }): Promise<string> {
  return executeDocumentTransition({ documentType: "quote", reference: args.quoteReference, action: "expire" });
}

async function executeReopenQuote(args: { quoteReference: string }): Promise<string> {
  return executeDocumentTransition({ documentType: "quote", reference: args.quoteReference, action: "reopen" });
}

async function executeRejectQuote(args: { quoteReference: string }): Promise<string> {
  return executeDocumentTransition({ documentType: "quote", reference: args.quoteReference, action: "reject" });
}

async function executeIssueQuote(args: { quoteReference: string }): Promise<string> {
  return executeDocumentTransition({ documentType: "quote", reference: args.quoteReference, action: "issue" });
}

async function executeMarkPOSent(args: { poReference: string }): Promise<string> {
  return executeDocumentTransition({ documentType: "purchase_order", reference: args.poReference, action: "mark_sent" });
}

async function executeAcknowledgePO(args: { poReference: string }): Promise<string> {
  return executeDocumentTransition({ documentType: "purchase_order", reference: args.poReference, action: "acknowledge" });
}

async function executeMarkPODelivered(args: { poReference: string }): Promise<string> {
  return executeDocumentTransition({ documentType: "purchase_order", reference: args.poReference, action: "mark_delivered" });
}

async function executeCancelPO(args: { poReference: string }): Promise<string> {
  return executeDocumentTransition({ documentType: "purchase_order", reference: args.poReference, action: "cancel" });
}

async function executeIssueCreditNote(args: { cnReference: string }): Promise<string> {
  return executeDocumentTransition({ documentType: "credit_note", reference: args.cnReference, action: "issue" });
}

async function executeSendCreditNote(args: { cnReference: string }): Promise<string> {
  return executeDocumentTransition({ documentType: "credit_note", reference: args.cnReference, action: "send" });
}

async function executeApplyCreditNote(args: { cnReference: string }): Promise<string> {
  const supabase = getSupabase();

  try {
    const resolved = await resolveCreditNoteForWrite(supabase, args.cnReference);

    if (resolved.kind === "not_found") {
      return JSON.stringify({ error: `No credit note found matching '${args.cnReference}'.` });
    }

    if (resolved.kind === "ambiguous") {
      const matches = resolved.candidates.map((cn: any) => `${cn.cn_number} (status: ${cn.status}, total: R${cn.total})`).join(", ");
      return JSON.stringify({ error: `Multiple credit notes match '${args.cnReference}': ${matches}. Provide the exact number.` });
    }

    const cn = resolved.record;

    if (cn.status !== "Issued") {
      return JSON.stringify({ error: `Credit note ${cn.cn_number} is in status "${cn.status}" and cannot be applied. Only Issued credit notes can be applied.` });
    }

    if (!cn.invoice_id) {
      return JSON.stringify({ error: `Credit note ${cn.cn_number} is not linked to any invoice. Link it to an invoice first.` });
    }

    // Call the atomic application function
    const { data: result, error: rpcError } = await supabase.rpc("apply_credit_note_to_invoice", {
      p_credit_note_id: cn.id,
    });

    if (rpcError) {
      return JSON.stringify({ error: rpcError.message });
    }

    if (!result || !result.success) {
      return JSON.stringify({ error: result?.error || "Credit note application failed." });
    }

    // Read-after-write verification
    const { data: verified } = await supabase
      .from("credit_notes")
      .select("cn_number, status")
      .eq("id", cn.id)
      .single() as { data: Record<string, any> | null; error: any };

    const isVerified = (verified as any)?.status === "Applied";

    return JSON.stringify({
      actionStatus: {
        action: "apply",
        targetType: "credit_note",
        targetReference: result.credit_note_number,
        toolUsed: "applyCreditNote",
        status: isVerified ? "confirmed" : "could_not_verify",
        attempted: true,
        verified: isVerified,
        summary: `Credit note ${result.credit_note_number} applied to invoice ${result.invoice_number}. Balance: R${Number(result.previous_invoice_balance).toFixed(2)} → R${Number(result.new_invoice_balance).toFixed(2)}.`,
        error: null,
        nextStep: "",
      },
      credit_note_number: result.credit_note_number,
      invoice_number: result.invoice_number,
      credit_note_amount: result.credit_note_amount,
      previous_invoice_balance: result.previous_invoice_balance,
      new_invoice_balance: result.new_invoice_balance,
      previous_invoice_status: result.previous_invoice_status,
      new_invoice_status: result.new_invoice_status,
    });
  } catch (err: any) {
    return JSON.stringify({ error: `Unexpected error: ${err.message}` });
  }
}

async function executeCancelCreditNote(args: { cnReference: string }): Promise<string> {
  return executeDocumentTransition({ documentType: "credit_note", reference: args.cnReference, action: "cancel" });
}

async function executeConvertQuoteToInvoice(args: { quoteReference: string; paymentTermsDays?: number }): Promise<string> {
  const supabase = getSupabase();

  try {
    // 1. Resolve the quote safely
    const resolved = await resolveQuoteForWrite(supabase, args.quoteReference);

    if (resolved.kind === "not_found") {
      return wrapWithActionResult(actionFailed({ 
        action: "convert_quote_to_invoice", 
        targetType: "invoice", 
        toolUsed: "convertQuoteToInvoice", 
        error: `No quote found matching '${args.quoteReference}'. Please check the quote number.` 
      }));
    }

    if (resolved.kind === "ambiguous") {
      return wrapWithActionResult(actionNeedInfo({ 
        action: "convert_quote_to_invoice", 
        targetType: "invoice", 
        toolUsed: "convertQuoteToInvoice", 
        missingFields: ["quoteReference"], 
        nextStep: `Multiple quotes match '${args.quoteReference}': ${resolved.candidates.map((c: any) => `${c.quote_number} (${c.status})`).join("; ")}. Please provide the exact quote number.` 
      }));
    }

    const quote = resolved.record;

    // 2. Call atomic DB function — all guards and operations in one transaction
    const { data: result, error: rpcError } = await supabase.rpc("convert_quote_to_invoice", {
      p_quote_id: quote.id,
      p_payment_days: args.paymentTermsDays || null,
      p_notes: null,
    });

    if (rpcError) {
      console.error("[convertQuoteToInvoice] RPC failed:", rpcError);
      return wrapWithActionResult(actionFailed({ 
        action: "convert_quote_to_invoice", 
        targetType: "invoice", 
        toolUsed: "convertQuoteToInvoice", 
        error: rpcError.message,
        nextStep: rpcError.message.includes("already been converted") 
          ? "This quote has already been converted. Check the invoices list."
          : rpcError.message.includes("Draft") 
            ? "Send the quote to the client and mark it as Accepted before converting."
            : "Please check the quote status and try again."
      }));
    }

    if (!result || !result.success) {
      return wrapWithActionResult(actionFailed({ 
        action: "convert_quote_to_invoice", 
        targetType: "invoice", 
        toolUsed: "convertQuoteToInvoice", 
        error: result?.error || "Conversion failed." 
      }));
    }

    // 3. Verify the invoice was created
    const { data: verified } = await supabase
      .from("invoices")
      .select("invoice_number, status, total, balance_due, quote_id")
      .eq("id", result.invoice_id)
      .single();

    const isVerified = verified?.invoice_number === result.invoice_number && verified?.quote_id === result.quote_id;

    console.log("[convertQuoteToInvoice] Converted", result.quote_number, "→", result.invoice_number);

    return wrapWithActionResult(
      actionSuccess({
        action: "convert_quote_to_invoice",
        targetType: "invoice",
        targetReference: result.invoice_number,
        toolUsed: "convertQuoteToInvoice",
        summary: `Quote ${result.quote_number} converted to Invoice ${result.invoice_number}. Total: R${Number(result.total).toFixed(2)}. Due: ${result.due_date} (${result.payment_terms_days} days). ${result.line_item_count} line item(s) copied.`,
        verified: isVerified,
      }),
      {
        invoice: {
          id: result.invoice_id,
          invoiceNumber: result.invoice_number,
          quoteNumber: result.quote_number,
          quoteId: result.quote_id,
          clientId: result.client_id,
          clientName: result.client_name,
          subtotal: Number(result.subtotal).toFixed(2),
          vatAmount: Number(result.vat_amount).toFixed(2),
          total: Number(result.total).toFixed(2),
          dueDate: result.due_date,
          paymentTermsDays: result.payment_terms_days,
          lineItemCount: result.line_item_count,
        },
      }
    );
  } catch (err: any) {
    console.error("[convertQuoteToInvoice] Unexpected error:", err);
    return wrapWithActionResult(actionFailed({ 
      action: "convert_quote_to_invoice", 
      targetType: "invoice", 
      toolUsed: "convertQuoteToInvoice", 
      error: `Unexpected error: ${err.message}` 
    }));
  }
}

// ============================================================
// TASK TOOLS
// ============================================================

async function executeCreateTask(
  args: {
    title: string;
    description?: string;
    priority?: string;
    dueDate?: string;
    dueTime?: string;
    category?: string;
    clientName?: string;
    tags?: string[];
    notes?: string;
  },
  user: { id: string }
): Promise<string> {
  const supabase = getSupabase();

  try {
    let clientId: string | null = null;
    let clientCompanyName: string | null = null;

    if (args.clientName) {
      const { data: clients, error: clientError } = await supabase
        .from("clients")
        .select("id, company_name")
        .ilike("company_name", `%${args.clientName}%`)
        .limit(5);

      if (clientError) {
        return wrapWithActionResult(actionFailed({
          action: "create_task",
          targetType: "task",
          toolUsed: "createTask",
          error: `Error looking up client: ${clientError.message}`,
          nextStep: "Please check the client name and try again."
        }));
      }

      if (clients && clients.length === 1) {
        clientId = clients[0].id;
        clientCompanyName = clients[0].company_name;
      } else if (clients && clients.length > 1) {
        const exactMatch = clients.find(
          (c: any) => c.company_name.toLowerCase() === args.clientName!.toLowerCase()
        );
        if (exactMatch) {
          clientId = exactMatch.id;
          clientCompanyName = exactMatch.company_name;
        } else {
          const matchList = clients.map((c: any) => `"${c.company_name}"`).join(", ");
          return wrapWithActionResult(actionNeedInfo({
            action: "create_task",
            targetType: "task",
            toolUsed: "createTask",
            missingFields: ["clientName"],
            nextStep: `Multiple clients match '${args.clientName}': ${matchList}. Please specify the exact client name.`
          }));
        }
      }
    }

    const { data: task, error: insertError } = await supabase
      .from("tasks")
      .insert({
        user_id: user.id,
        title: args.title,
        description: args.description || null,
        status: "todo",
        priority: args.priority || "medium",
        due_date: args.dueDate || null,
        due_time: args.dueTime || null,
        category: args.category || null,
        client_id: clientId,
        tags: args.tags || [],
        notes: args.notes || null,
      })
      .select("id, title, status, priority, due_date, due_time, category")
      .single();

    if (insertError) {
      return wrapWithActionResult(actionFailed({
        action: "create_task",
        targetType: "task",
        toolUsed: "createTask",
        error: `Failed to create task: ${insertError.message}`,
        nextStep: "Please try again."
      }));
    }

    let message = `Task created: "${task.title}"`;
    message += ` | Priority: ${task.priority}`;
    if (task.due_date) message += ` | Due: ${task.due_date}`;
    if (task.due_time) message += ` at ${task.due_time}`;
    if (task.category) message += ` | Category: ${task.category}`;
    if (clientCompanyName) message += ` | Client: ${clientCompanyName}`;

    return wrapWithActionResult(
      actionSuccess({
        action: "create_task",
        targetType: "task",
        targetReference: task.title,
        toolUsed: "createTask",
        summary: message,
        verified: true,
      }),
      {
        task: {
          id: task.id,
          title: task.title,
          priority: task.priority,
          due_date: task.due_date,
          due_time: task.due_time,
          category: task.category,
          client_name: clientCompanyName,
        },
      }
    );
  } catch (err: any) {
    return wrapWithActionResult(actionFailed({
      action: "create_task",
      targetType: "task",
      toolUsed: "createTask",
      error: `Unexpected error: ${err.message}`,
      nextStep: "Please try again."
    }));
  }
}

async function executeUpdateTask(
  args: {
    taskIdentifier: string;
    title?: string;
    description?: string;
    priority?: string;
    status?: string;
    dueDate?: string;
    dueTime?: string;
    category?: string;
    notes?: string;
  },
  user: { id: string }
): Promise<string> {
  const supabase = getSupabase();

  try {
    const { data: tasks, error: searchError } = await supabase
      .from("tasks")
      .select("id, title, status, priority, due_date, due_time, category")
      .eq("user_id", user.id)
      .ilike("title", `%${args.taskIdentifier}%`)
      .limit(10);

    if (searchError) {
      return wrapWithActionResult(actionFailed({
        action: "update_task",
        targetType: "task",
        toolUsed: "updateTask",
        error: `Error searching for task: ${searchError.message}`,
        nextStep: "Please try again."
      }));
    }

    if (!tasks || tasks.length === 0) {
      return wrapWithActionResult(actionFailed({
        action: "update_task",
        targetType: "task",
        toolUsed: "updateTask",
        error: `No task found matching "${args.taskIdentifier}".`,
        nextStep: "Please check the task name and try again."
      }));
    }

    let task: any;
    if (tasks.length === 1) {
      task = tasks[0];
    } else {
      const exactMatch = tasks.find(
        (t: any) => t.title.toLowerCase() === args.taskIdentifier.toLowerCase()
      );
      if (exactMatch) {
        task = exactMatch;
      } else {
        const matchList = tasks.map((t: any) => `"${t.title}" (${t.priority}, due: ${t.due_date || "no date"})`).join("; ");
        return wrapWithActionResult(actionNeedInfo({
          action: "update_task",
          targetType: "task",
          toolUsed: "updateTask",
          missingFields: ["taskIdentifier"],
          nextStep: `Multiple tasks match "${args.taskIdentifier}": ${matchList}. Please be more specific.`
        }));
      }
    }

    const updates: any = {};
    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.priority !== undefined) updates.priority = args.priority;
    if (args.status !== undefined) updates.status = args.status;
    if (args.dueDate !== undefined) updates.due_date = args.dueDate;
    if (args.dueTime !== undefined) updates.due_time = args.dueTime;
    if (args.category !== undefined) updates.category = args.category;
    if (args.notes !== undefined) updates.notes = args.notes;

    if (args.status === "done") {
      updates.completed_at = new Date().toISOString();
    }
    if (args.status && args.status !== "done") {
      updates.completed_at = null;
    }

    if (Object.keys(updates).length === 0) {
      return wrapWithActionResult(actionFailed({
        action: "update_task",
        targetType: "task",
        toolUsed: "updateTask",
        error: "No fields to update.",
        nextStep: "Please specify what to change."
      }));
    }

    const { data: updatedTask, error: updateError } = await supabase
      .from("tasks")
      .update(updates)
      .eq("id", task.id)
      .select("id, title, status, priority, due_date, due_time, category")
      .single();

    if (updateError) {
      return wrapWithActionResult(actionFailed({
        action: "update_task",
        targetType: "task",
        toolUsed: "updateTask",
        error: `Failed to update task: ${updateError.message}`,
        nextStep: "Please try again."
      }));
    }

    const changes = Object.keys(updates)
      .filter(k => k !== "completed_at")
      .map(k => `${k}: ${updates[k]}`)
      .join(", ");

    return wrapWithActionResult(
      actionSuccess({
        action: "update_task",
        targetType: "task",
        targetReference: updatedTask.title,
        toolUsed: "updateTask",
        summary: `Task "${updatedTask.title}" updated. Changes: ${changes}.`,
        verified: true,
      }),
      {
        task: {
          id: updatedTask.id,
          title: updatedTask.title,
          status: updatedTask.status,
          priority: updatedTask.priority,
          due_date: updatedTask.due_date,
          category: updatedTask.category,
        },
      }
    );
  } catch (err: any) {
    return wrapWithActionResult(actionFailed({
      action: "update_task",
      targetType: "task",
      toolUsed: "updateTask",
      error: `Unexpected error: ${err.message}`,
      nextStep: "Please try again."
    }));
  }
}

async function executeCompleteTask(
  args: { taskIdentifier: string },
  user: { id: string }
): Promise<string> {
  const supabase = getSupabase();

  try {
    const { data: tasks, error: searchError } = await supabase
      .from("tasks")
      .select("id, title, status, priority, due_date")
      .eq("user_id", user.id)
      .ilike("title", `%${args.taskIdentifier}%`)
      .limit(10);

    if (searchError) {
      return wrapWithActionResult(actionFailed({
        action: "complete_task",
        targetType: "task",
        toolUsed: "completeTask",
        error: `Error searching for task: ${searchError.message}`,
        nextStep: "Please try again."
      }));
    }

    if (!tasks || tasks.length === 0) {
      return wrapWithActionResult(actionFailed({
        action: "complete_task",
        targetType: "task",
        toolUsed: "completeTask",
        error: `No task found matching "${args.taskIdentifier}".`,
        nextStep: "Please check the task name and try again."
      }));
    }

    let task: any;
    if (tasks.length === 1) {
      task = tasks[0];
    } else {
      const exactMatch = tasks.find(
        (t: any) => t.title.toLowerCase() === args.taskIdentifier.toLowerCase()
      );
      if (exactMatch) {
        task = exactMatch;
      } else {
        const matchList = tasks.map((t: any) => `"${t.title}" (${t.priority}, due: ${t.due_date || "no date"})`).join("; ");
        return wrapWithActionResult(actionNeedInfo({
          action: "complete_task",
          targetType: "task",
          toolUsed: "completeTask",
          missingFields: ["taskIdentifier"],
          nextStep: `Multiple tasks match "${args.taskIdentifier}": ${matchList}. Please be more specific.`
        }));
      }
    }

    if (task.status === "done") {
      return wrapWithActionResult(actionFailed({
        action: "complete_task",
        targetType: "task",
        toolUsed: "completeTask",
        error: `Task "${task.title}" is already completed.`,
        nextStep: "No action needed."
      }));
    }

    if (task.status === "cancelled") {
      return wrapWithActionResult(actionFailed({
        action: "complete_task",
        targetType: "task",
        toolUsed: "completeTask",
        error: `Task "${task.title}" was cancelled and cannot be completed.`,
        nextStep: "You may want to create a new task instead."
      }));
    }

    const completedAt = new Date().toISOString();

    const { data: updatedTask, error: updateError } = await supabase
      .from("tasks")
      .update({ status: "done", completed_at: completedAt })
      .eq("id", task.id)
      .select("id, title, status")
      .single();

    if (updateError) {
      return wrapWithActionResult(actionFailed({
        action: "complete_task",
        targetType: "task",
        toolUsed: "completeTask",
        error: `Failed to complete task: ${updateError.message}`,
        nextStep: "Please try again."
      }));
    }

    return wrapWithActionResult(
      actionSuccess({
        action: "complete_task",
        targetType: "task",
        targetReference: updatedTask.title,
        toolUsed: "completeTask",
        summary: `Task completed: "${updatedTask.title}". Well done!`,
        verified: true,
      }),
      {
        task: {
          id: updatedTask.id,
          title: updatedTask.title,
          previous_status: task.status,
          completed_at: completedAt,
        },
      }
    );
  } catch (err: any) {
    return wrapWithActionResult(actionFailed({
      action: "complete_task",
      targetType: "task",
      toolUsed: "completeTask",
      error: `Unexpected error: ${err.message}`,
      nextStep: "Please try again."
    }));
  }
}

async function executeQueryTasks(
  args: {
    queryType: string;
    priority?: string;
    clientName?: string;
    category?: string;
    searchTerm?: string;
  },
  user: { id: string }
): Promise<string> {
  const supabase = getSupabase();

  try {
    const today = new Date().toISOString().split("T")[0];
    const weekEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    if (args.queryType === "stats") {
      const { data: allTasks } = await supabase
        .from("tasks")
        .select("id, status, due_date, priority")
        .eq("user_id", user.id);

      const tasks = allTasks || [];
      const stats = {
        total: tasks.length,
        todo: tasks.filter((t: any) => t.status === "todo").length,
        in_progress: tasks.filter((t: any) => t.status === "in_progress").length,
        done: tasks.filter((t: any) => t.status === "done").length,
        overdue: tasks.filter((t: any) => t.due_date && t.due_date < today && t.status !== "done" && t.status !== "cancelled").length,
        due_today: tasks.filter((t: any) => t.due_date === today && t.status !== "done" && t.status !== "cancelled").length,
        urgent: tasks.filter((t: any) => t.priority === "urgent" && t.status !== "done" && t.status !== "cancelled").length,
      };

      return wrapWithActionResult(
        actionSuccess({
          action: "query_tasks",
          targetType: "task_query",
          targetReference: "stats",
          toolUsed: "queryTasks",
          summary: `You have ${stats.total} total tasks: ${stats.todo} to do, ${stats.in_progress} in progress, ${stats.done} completed. ${stats.overdue} overdue, ${stats.due_today} due today, ${stats.urgent} urgent.`,
          verified: true,
        }),
        { stats }
      );
    }

    let query = supabase
      .from("tasks")
      .select("id, title, status, priority, due_date, due_time, category, client_id, clients(company_name)")
      .eq("user_id", user.id)
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });

    switch (args.queryType) {
      case "today":
        query = query.eq("due_date", today).neq("status", "done").neq("status", "cancelled");
        break;
      case "overdue":
        query = query.lt("due_date", today).neq("status", "done").neq("status", "cancelled");
        break;
      case "this_week":
        query = query.gte("due_date", today).lte("due_date", weekEnd).neq("status", "done").neq("status", "cancelled");
        break;
      case "all_open":
        query = query.neq("status", "done").neq("status", "cancelled");
        break;
      case "by_priority":
        if (args.priority) {
          query = query.eq("priority", args.priority).neq("status", "done").neq("status", "cancelled");
        }
        break;
      case "by_client":
        if (args.clientName) {
          const { data: clients } = await supabase
            .from("clients")
            .select("id")
            .ilike("company_name", `%${args.clientName}%`)
            .limit(1);
          if (clients && clients.length > 0) {
            query = query.eq("client_id", clients[0].id);
          } else {
            return wrapWithActionResult(
              actionSuccess({
                action: "query_tasks",
                targetType: "task_query",
                targetReference: args.clientName,
                toolUsed: "queryTasks",
                summary: `No client found matching '${args.clientName}'.`,
                verified: true,
              }),
              { tasks: [], count: 0 }
            );
          }
        }
        break;
      case "by_category":
        if (args.category) {
          query = query.eq("category", args.category).neq("status", "done").neq("status", "cancelled");
        }
        break;
      case "search":
        if (args.searchTerm) {
          query = query.or(`title.ilike.%${args.searchTerm}%,description.ilike.%${args.searchTerm}%`);
        }
        break;
    }

    const { data: tasks, error } = await query.limit(25);

    if (error) {
      return wrapWithActionResult(actionFailed({
        action: "query_tasks",
        targetType: "task_query",
        toolUsed: "queryTasks",
        error: `Failed to query tasks: ${error.message}`,
        nextStep: "Please try again."
      }));
    }

    const formattedTasks = (tasks || []).map((t: any) => ({
      title: t.title,
      status: t.status,
      priority: t.priority,
      due_date: t.due_date,
      category: t.category,
      client: t.clients?.company_name || null,
    }));

    const queryLabels: Record<string, string> = {
      today: "due today",
      overdue: "overdue",
      this_week: "due this week",
      all_open: "open",
      by_priority: `${args.priority} priority`,
      by_client: `for client "${args.clientName}"`,
      by_category: `in category "${args.category}"`,
      search: `matching "${args.searchTerm}"`,
    };

    return wrapWithActionResult(
      actionSuccess({
        action: "query_tasks",
        targetType: "task_query",
        targetReference: args.queryType,
        toolUsed: "queryTasks",
        summary: formattedTasks.length === 0
          ? `No ${queryLabels[args.queryType] || ""} tasks found.`
          : `Found ${formattedTasks.length} ${queryLabels[args.queryType] || ""} task(s).`,
        verified: true,
      }),
      {
        queryType: args.queryType,
        count: formattedTasks.length,
        tasks: formattedTasks,
      }
    );
  } catch (err: any) {
    return wrapWithActionResult(actionFailed({
      action: "query_tasks",
      targetType: "task_query",
      toolUsed: "queryTasks",
      error: `Unexpected error: ${err.message}`,
      nextStep: "Please try again."
    }));
  }
}

async function executeDeleteTask(
  args: { taskIdentifier: string },
  user: { id: string }
): Promise<string> {
  const supabase = getSupabase();

  try {
    const { data: tasks, error: searchError } = await supabase
      .from("tasks")
      .select("id, title, status, priority, due_date")
      .eq("user_id", user.id)
      .ilike("title", `%${args.taskIdentifier}%`)
      .limit(10);

    if (searchError) {
      return wrapWithActionResult(actionFailed({
        action: "delete_task",
        targetType: "task",
        toolUsed: "deleteTask",
        error: `Error searching for task: ${searchError.message}`,
        nextStep: "Please try again."
      }));
    }

    if (!tasks || tasks.length === 0) {
      return wrapWithActionResult(actionFailed({
        action: "delete_task",
        targetType: "task",
        toolUsed: "deleteTask",
        error: `No task found matching "${args.taskIdentifier}".`,
        nextStep: "Please check the task name and try again."
      }));
    }

    let task: any;
    if (tasks.length === 1) {
      task = tasks[0];
    } else {
      const exactMatch = tasks.find(
        (t: any) => t.title.toLowerCase() === args.taskIdentifier.toLowerCase()
      );
      if (exactMatch) {
        task = exactMatch;
      } else {
        const matchList = tasks.map((t: any) => `"${t.title}" (${t.priority}, due: ${t.due_date || "no date"})`).join("; ");
        return wrapWithActionResult(actionNeedInfo({
          action: "delete_task",
          targetType: "task",
          toolUsed: "deleteTask",
          missingFields: ["taskIdentifier"],
          nextStep: `Multiple tasks match "${args.taskIdentifier}": ${matchList}. Please be more specific.`
        }));
      }
    }

    const { error: deleteError } = await supabase
      .from("tasks")
      .delete()
      .eq("id", task.id);

    if (deleteError) {
      return wrapWithActionResult(actionFailed({
        action: "delete_task",
        targetType: "task",
        toolUsed: "deleteTask",
        error: `Failed to delete task: ${deleteError.message}`,
        nextStep: "Please try again."
      }));
    }

    const { data: verifyTasks } = await supabase
      .from("tasks")
      .select("id")
      .eq("id", task.id);

    const isVerified = !verifyTasks || verifyTasks.length === 0;

    return wrapWithActionResult(
      actionSuccess({
        action: "delete_task",
        targetType: "task",
        targetReference: task.title,
        toolUsed: "deleteTask",
        summary: `Task deleted: "${task.title}" (priority: ${task.priority}, due: ${task.due_date || "no date"}).`,
        verified: isVerified,
      }),
      {
        deleted_task: {
          id: task.id,
          title: task.title,
          priority: task.priority,
          due_date: task.due_date,
        },
      }
    );
  } catch (err: any) {
    return wrapWithActionResult(actionFailed({
      action: "delete_task",
      targetType: "task",
      toolUsed: "deleteTask",
      error: `Unexpected error: ${err.message}`,
      nextStep: "Please try again."
    }));
  }
}

// ============================================================
// NOTE TOOLS
// ============================================================

async function executeCreateNote(
  args: {
    content: string;
    title?: string;
    noteType?: string;
    contactName?: string;
    contactPhone?: string;
    callDirection?: string;
    meetingAttendees?: string[];
    siteName?: string;
    clientName?: string;
    followUpRequired?: boolean;
    followUpDate?: string;
    followUpNotes?: string;
    tags?: string[];
  },
  user: { id: string }
): Promise<string> {
  const supabase = getSupabase();

  try {
    let clientId: string | null = null;
    let clientCompanyName: string | null = null;

    if (args.clientName) {
      const { data: clients, error: clientError } = await supabase
        .from("clients")
        .select("id, company_name")
        .ilike("company_name", `%${args.clientName}%`)
        .limit(5);

      if (clientError) {
        return wrapWithActionResult(actionFailed({
          action: "create_note",
          targetType: "note",
          toolUsed: "createNote",
          error: `Error looking up client: ${clientError.message}`,
          nextStep: "Please check the client name and try again."
        }));
      }

      if (clients && clients.length === 1) {
        clientId = clients[0].id;
        clientCompanyName = clients[0].company_name;
      } else if (clients && clients.length > 1) {
        const exactMatch = clients.find(
          (c: any) => c.company_name.toLowerCase() === args.clientName!.toLowerCase()
        );
        if (exactMatch) {
          clientId = exactMatch.id;
          clientCompanyName = exactMatch.company_name;
        } else {
          const matchList = clients.map((c: any) => `"${c.company_name}"`).join(", ");
          return wrapWithActionResult(actionNeedInfo({
            action: "create_note",
            targetType: "note",
            toolUsed: "createNote",
            missingFields: ["clientName"],
            nextStep: `Multiple clients match '${args.clientName}': ${matchList}. Please specify the exact client name.`
          }));
        }
      }
    }

    const autoTitle = args.title || args.content.slice(0, 60) + (args.content.length > 60 ? "..." : "");

    const { data: note, error: insertError } = await supabase
      .from("notes")
      .insert({
        user_id: user.id,
        title: autoTitle,
        content: args.content,
        note_type: args.noteType || "general",
        contact_name: args.contactName || null,
        contact_phone: args.contactPhone || null,
        call_direction: args.callDirection || null,
        meeting_attendees: args.meetingAttendees || null,
        site_name: args.siteName || null,
        client_id: clientId,
        follow_up_required: args.followUpRequired || false,
        follow_up_date: args.followUpDate || null,
        follow_up_notes: args.followUpNotes || null,
        tags: args.tags || [],
      })
      .select("id, title, note_type, follow_up_required, follow_up_date")
      .single();

    if (insertError) {
      return wrapWithActionResult(actionFailed({
        action: "create_note",
        targetType: "note",
        toolUsed: "createNote",
        error: `Failed to create note: ${insertError.message}`,
        nextStep: "Please try again."
      }));
    }

    let message = `Note created: "${note.title}"`;
    message += ` | Type: ${note.note_type}`;
    if (clientCompanyName) message += ` | Client: ${clientCompanyName}`;
    if (note.follow_up_required) {
      message += ` | Follow-up required`;
      if (note.follow_up_date) message += ` by ${note.follow_up_date}`;
    }

    return wrapWithActionResult(
      actionSuccess({
        action: "create_note",
        targetType: "note",
        targetReference: note.title,
        toolUsed: "createNote",
        summary: message,
        verified: true,
      }),
      {
        note: {
          id: note.id,
          title: note.title,
          note_type: note.note_type,
          client_name: clientCompanyName,
          follow_up_required: note.follow_up_required,
          follow_up_date: note.follow_up_date,
        },
      }
    );
  } catch (err: any) {
    return wrapWithActionResult(actionFailed({
      action: "create_note",
      targetType: "note",
      toolUsed: "createNote",
      error: `Unexpected error: ${err.message}`,
      nextStep: "Please try again."
    }));
  }
}

async function executeSearchNotes(
  args: {
    searchTerm?: string;
    noteType?: string;
    clientName?: string;
    followUpPending?: boolean;
    limit?: number;
  },
  user: { id: string }
): Promise<string> {
  const supabase = getSupabase();

  try {
    let clientId: string | null = null;

    if (args.clientName) {
      const { data: clients } = await supabase
        .from("clients")
        .select("id")
        .ilike("company_name", `%${args.clientName}%`)
        .limit(1);
      if (clients && clients.length > 0) {
        clientId = clients[0].id;
      } else {
        return wrapWithActionResult(
          actionSuccess({
            action: "search_notes",
            targetType: "note_query",
            targetReference: args.clientName,
            toolUsed: "searchNotes",
            summary: `No client found matching '${args.clientName}'.`,
            verified: true,
          }),
          { notes: [], count: 0 }
        );
      }
    }

    let query = supabase
      .from("notes")
      .select("id, title, content, note_type, created_at, client_id, clients(company_name), follow_up_required, follow_up_completed, follow_up_date, tags")
      .eq("user_id", user.id)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(args.limit || 10);

    if (args.searchTerm) {
      query = query.or(`title.ilike.%${args.searchTerm}%,content.ilike.%${args.searchTerm}%`);
    }
    if (args.noteType && args.noteType !== "all") {
      query = query.eq("note_type", args.noteType);
    }
    if (clientId) {
      query = query.eq("client_id", clientId);
    }
    if (args.followUpPending) {
      query = query.eq("follow_up_required", true).eq("follow_up_completed", false);
    }

    const { data: notes, error } = await query;

    if (error) {
      return wrapWithActionResult(actionFailed({
        action: "search_notes",
        targetType: "note_query",
        toolUsed: "searchNotes",
        error: `Failed to search notes: ${error.message}`,
        nextStep: "Please try again."
      }));
    }

    const formattedNotes = (notes || []).map((n: any) => ({
      title: n.title || n.content.slice(0, 60),
      note_type: n.note_type,
      created_at: n.created_at,
      client: n.clients?.company_name || null,
      follow_up_required: n.follow_up_required,
      follow_up_date: n.follow_up_date,
      content_preview: n.content.slice(0, 150) + (n.content.length > 150 ? "..." : ""),
      tags: n.tags || [],
    }));

    const searchDesc = args.followUpPending
      ? "with pending follow-ups"
      : args.searchTerm
        ? `matching "${args.searchTerm}"`
        : args.noteType && args.noteType !== "all"
          ? `of type "${args.noteType}"`
          : args.clientName
            ? `for client "${args.clientName}"`
            : "all";

    return wrapWithActionResult(
      actionSuccess({
        action: "search_notes",
        targetType: "note_query",
        targetReference: args.searchTerm || args.clientName || "all",
        toolUsed: "searchNotes",
        summary: formattedNotes.length === 0
          ? `No notes found ${searchDesc}.`
          : `Found ${formattedNotes.length} note(s) ${searchDesc}.`,
        verified: true,
      }),
      {
        count: formattedNotes.length,
        notes: formattedNotes,
      }
    );
  } catch (err: any) {
    return wrapWithActionResult(actionFailed({
      action: "search_notes",
      targetType: "note_query",
      toolUsed: "searchNotes",
      error: `Unexpected error: ${err.message}`,
      nextStep: "Please try again."
    }));
  }
}

async function executeLogCallNote(
  args: {
    contactName: string;
    content: string;
    clientName?: string;
    callDirection?: string;
    followUpRequired?: boolean;
    followUpDate?: string;
    followUpNotes?: string;
  },
  user: { id: string }
): Promise<string> {
  const supabase = getSupabase();

  try {
    let clientId: string | null = null;
    let clientCompanyName: string | null = null;

    if (args.clientName) {
      const { data: clients, error: clientError } = await supabase
        .from("clients")
        .select("id, company_name")
        .ilike("company_name", `%${args.clientName}%`)
        .limit(5);

      if (clientError) {
        return wrapWithActionResult(actionFailed({
          action: "log_call_note",
          targetType: "note",
          toolUsed: "logCallNote",
          error: `Error looking up client: ${clientError.message}`,
          nextStep: "Please check the client name and try again."
        }));
      }

      if (clients && clients.length === 1) {
        clientId = clients[0].id;
        clientCompanyName = clients[0].company_name;
      } else if (clients && clients.length > 1) {
        const exactMatch = clients.find(
          (c: any) => c.company_name.toLowerCase() === args.clientName!.toLowerCase()
        );
        if (exactMatch) {
          clientId = exactMatch.id;
          clientCompanyName = exactMatch.company_name;
        } else {
          const matchList = clients.map((c: any) => `"${c.company_name}"`).join(", ");
          return wrapWithActionResult(actionNeedInfo({
            action: "log_call_note",
            targetType: "note",
            toolUsed: "logCallNote",
            missingFields: ["clientName"],
            nextStep: `Multiple clients match '${args.clientName}': ${matchList}. Please specify the exact client name.`
          }));
        }
      }
    }

    const title = `Call with ${args.contactName}${clientCompanyName ? ` (${clientCompanyName})` : ""}`;

    const { data: note, error: insertError } = await supabase
      .from("notes")
      .insert({
        user_id: user.id,
        title,
        content: args.content,
        note_type: "call",
        contact_name: args.contactName,
        call_direction: args.callDirection || null,
        client_id: clientId,
        follow_up_required: args.followUpRequired || false,
        follow_up_date: args.followUpDate || null,
        follow_up_notes: args.followUpNotes || null,
      })
      .select("id, title, note_type, follow_up_required, follow_up_date")
      .single();

    if (insertError) {
      return wrapWithActionResult(actionFailed({
        action: "log_call_note",
        targetType: "note",
        toolUsed: "logCallNote",
        error: `Failed to log call note: ${insertError.message}`,
        nextStep: "Please try again."
      }));
    }

    if (clientId) {
      await supabase
        .from("client_communications")
        .insert({
          client_id: clientId,
          type: "call",
          subject: title,
          content: args.content,
          note_type: args.callDirection || "outbound",
          is_manual: true,
          timestamp: new Date().toISOString(),
        });
    }

    let message = `Call note logged: "${title}"`;
    if (args.callDirection) message += ` | ${args.callDirection}`;
    if (clientCompanyName) message += ` | Client: ${clientCompanyName}`;
    if (note.follow_up_required) {
      message += ` | Follow-up required`;
      if (note.follow_up_date) message += ` by ${note.follow_up_date}`;
    }

    return wrapWithActionResult(
      actionSuccess({
        action: "log_call_note",
        targetType: "note",
        targetReference: title,
        toolUsed: "logCallNote",
        summary: message,
        verified: true,
      }),
      {
        note: {
          id: note.id,
          title: note.title,
          note_type: note.note_type,
          client_name: clientCompanyName,
          follow_up_required: note.follow_up_required,
          follow_up_date: note.follow_up_date,
        },
      }
    );
  } catch (err: any) {
    return wrapWithActionResult(actionFailed({
      action: "log_call_note",
      targetType: "note",
      toolUsed: "logCallNote",
      error: `Unexpected error: ${err.message}`,
      nextStep: "Please try again."
    }));
  }
}

async function executeCreateCalendarEvent(args: {
  title: string;
  description?: string;
  eventType?: string;
  startDate: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  allDay?: boolean;
  location?: string;
  clientName?: string;
  status?: string;
  colour?: string;
  notes?: string;
}, user: { id: string }) {
  try {
    const supabase = getSupabase();
    let clientId: string | null = null;
    let clientCompanyName: string | null = null;

    if (args.clientName) {
      const { data: clients } = await supabase
        .from("clients")
        .select("id, company_name")
        .ilike("company_name", `%${args.clientName}%`)
        .limit(1);
      if (clients && clients.length > 0) {
        clientId = clients[0].id;
        clientCompanyName = clients[0].company_name;
      }
    }

    const { data: event, error } = await supabase
      .from("calendar_events")
      .insert({
        user_id: user.id,
        title: args.title,
        description: args.description || null,
        event_type: args.eventType || "appointment",
        start_date: args.startDate,
        start_time: args.startTime || null,
        end_date: args.endDate || args.startDate,
        end_time: args.endTime || null,
        all_day: args.allDay || false,
        location: args.location || null,
        client_id: clientId,
        status: args.status || "scheduled",
        colour: args.colour || "#3B82F6",
        notes: args.notes || null,
      })
      .select()
      .single();

    if (error) {
      return wrapWithActionResult(actionFailed({
        action: "create_calendar_event",
        targetType: "calendar_event",
        toolUsed: "createCalendarEvent",
        error: `Failed to create calendar event: ${error.message}`,
        nextStep: "Please try again."
      }));
    }

    let message = `Calendar event created: "${args.title}"`;
    if (args.startTime) message += ` at ${args.startTime}`;
    message += ` on ${args.startDate}`;
    if (clientCompanyName) message += ` with ${clientCompanyName}`;
    if (args.location) message += ` at ${args.location}`;

    return wrapWithActionResult(
      actionSuccess({
        action: "create_calendar_event",
        targetType: "calendar_event",
        targetReference: args.title,
        toolUsed: "createCalendarEvent",
        summary: message,
        verified: true,
      }),
      {
        event: {
          id: event.id,
          title: event.title,
          event_type: event.event_type,
          start_date: event.start_date,
          start_time: event.start_time,
          location: event.location,
          client_name: clientCompanyName,
          status: event.status,
        },
      }
    );
  } catch (err: any) {
    return wrapWithActionResult(actionFailed({
      action: "create_calendar_event",
      targetType: "calendar_event",
      toolUsed: "createCalendarEvent",
      error: `Unexpected error: ${err.message}`,
      nextStep: "Please try again."
    }));
  }
}

async function executeQueryCalendarEvents(args: {
  startDate?: string;
  endDate?: string;
  eventType?: string;
  clientName?: string;
  status?: string;
  limit?: number;
}, user: { id: string }) {
  try {
    const supabase = getSupabase();
    let clientId: string | null = null;

    if (args.clientName) {
      const { data: clients } = await supabase
        .from("clients")
        .select("id")
        .ilike("company_name", `%${args.clientName}%`)
        .limit(1);
      if (clients && clients.length > 0) {
        clientId = clients[0].id;
      }
    }

    const today = new Date().toISOString().split("T")[0];
    const startDate = args.startDate || today;
    const endDate = args.endDate || startDate;

    let query = supabase
      .from("calendar_events")
      .select("id, title, description, event_type, start_date, start_time, end_date, end_time, all_day, location, client_id, status, colour, clients(company_name)")
      .eq("user_id", user.id)
      .gte("start_date", startDate)
      .lte("start_date", endDate)
      .order("start_date", { ascending: true })
      .order("start_time", { ascending: true })
      .limit(args.limit || 20);

    if (args.eventType) {
      query = query.eq("event_type", args.eventType);
    }
    if (clientId) {
      query = query.eq("client_id", clientId);
    }
    if (args.status) {
      query = query.eq("status", args.status);
    }

    const { data: events, error } = await query;

    if (error) {
      return wrapWithActionResult(actionFailed({
        action: "query_calendar_events",
        targetType: "calendar_event_query",
        toolUsed: "queryCalendarEvents",
        error: `Failed to query calendar events: ${error.message}`,
        nextStep: "Please try again."
      }));
    }

    const formattedEvents = (events || []).map((e: any) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      event_type: e.event_type,
      start_date: e.start_date,
      start_time: e.start_time,
      end_date: e.end_date,
      end_time: e.end_time,
      all_day: e.all_day,
      location: e.location,
      client_name: e.clients?.company_name || null,
      status: e.status,
      colour: e.colour,
    }));

    let filterDesc = args.clientName
      ? `for client "${args.clientName}"`
      : args.eventType
        ? `of type "${args.eventType}"`
        : args.status
          ? `with status "${args.status}"`
          : "";

    return wrapWithActionResult(
      actionSuccess({
        action: "query_calendar_events",
        targetType: "calendar_event_query",
        targetReference: `${startDate} to ${endDate}`,
        toolUsed: "queryCalendarEvents",
        summary: `Found ${formattedEvents.length} calendar event${formattedEvents.length !== 1 ? "s" : ""} ${filterDesc || "in date range"}`,
        verified: true,
      }),
      {
        events: formattedEvents,
        count: formattedEvents.length,
        date_range: { start: startDate, end: endDate },
      }
    );
  } catch (err: any) {
    return wrapWithActionResult(actionFailed({
      action: "query_calendar_events",
      targetType: "calendar_event_query",
      toolUsed: "queryCalendarEvents",
      error: `Unexpected error: ${err.message}`,
      nextStep: "Please try again."
    }));
  }
}

async function executeUpdateCalendarEvent(args: {
  eventIdentifier: string;
  title?: string;
  description?: string;
  eventType?: string;
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  allDay?: boolean;
  location?: string;
  status?: string;
  notes?: string;
}, user: { id: string }) {
  try {
    const supabase = getSupabase();

    const { data: existing } = await supabase
      .from("calendar_events")
      .select("id, title")
      .eq("user_id", user.id)
      .ilike("title", `%${args.eventIdentifier}%`)
      .limit(1);

    if (!existing || existing.length === 0) {
      return wrapWithActionResult(actionFailed({
        action: "update_calendar_event",
        targetType: "calendar_event",
        toolUsed: "updateCalendarEvent",
        error: `No calendar event found matching "${args.eventIdentifier}"`,
        nextStep: "Try using the exact event title or check the spelling."
      }));
    }

    const eventId = existing[0].id;
    const updateData: any = {};

    if (args.title) updateData.title = args.title;
    if (args.description !== undefined) updateData.description = args.description;
    if (args.eventType) updateData.event_type = args.eventType;
    if (args.startDate) updateData.start_date = args.startDate;
    if (args.startTime !== undefined) updateData.start_time = args.startTime || null;
    if (args.endDate) updateData.end_date = args.endDate;
    if (args.endTime !== undefined) updateData.end_time = args.endTime || null;
    if (args.allDay !== undefined) updateData.all_day = args.allDay;
    if (args.location !== undefined) updateData.location = args.location || null;
    if (args.status) updateData.status = args.status;
    if (args.notes !== undefined) updateData.notes = args.notes;

    const { data: event, error } = await supabase
      .from("calendar_events")
      .update(updateData)
      .eq("id", eventId)
      .select()
      .single();

    if (error) {
      return wrapWithActionResult(actionFailed({
        action: "update_calendar_event",
        targetType: "calendar_event",
        toolUsed: "updateCalendarEvent",
        error: `Failed to update calendar event: ${error.message}`,
        nextStep: "Please try again."
      }));
    }

    const changes = Object.keys(updateData).filter(k => k !== "updated_at");
    const message = changes.length > 0
      ? `Updated calendar event "${event.title}": ${changes.join(", ")}`
      : `Calendar event "${event.title}" updated`;

    return wrapWithActionResult(
      actionSuccess({
        action: "update_calendar_event",
        targetType: "calendar_event",
        targetReference: event.title,
        toolUsed: "updateCalendarEvent",
        summary: message,
        verified: true,
      }),
      {
        event: {
          id: event.id,
          title: event.title,
          start_date: event.start_date,
          start_time: event.start_time,
          status: event.status,
        },
      }
    );
  } catch (err: any) {
    return wrapWithActionResult(actionFailed({
      action: "update_calendar_event",
      targetType: "calendar_event",
      toolUsed: "updateCalendarEvent",
      error: `Unexpected error: ${err.message}`,
      nextStep: "Please try again."
    }));
  }
}

async function executeCreateReminder(args: {
  title: string;
  description?: string;
  reminderType?: string;
  reminderAt: string;
  clientName?: string;
  isRecurring?: boolean;
  recurringFrequency?: string;
}, user: { id: string }) {
  try {
    const supabase = getSupabase();
    let clientId: string | null = null;

    if (args.clientName) {
      const { data: clients } = await supabase
        .from("clients")
        .select("id")
        .ilike("company_name", `%${args.clientName}%`)
        .limit(1);
      if (clients && clients.length > 0) {
        clientId = clients[0].id;
      }
    }

    const reminderAt = new Date(args.reminderAt);
    if (isNaN(reminderAt.getTime())) {
      return wrapWithActionResult(actionFailed({
        action: "create_reminder",
        targetType: "reminder",
        toolUsed: "createReminder",
        error: "Invalid reminder date/time format",
        nextStep: "Please provide a valid date/time."
      }));
    }

    const { data: reminder, error } = await supabase
      .from("reminders")
      .insert({
        user_id: user.id,
        title: args.title,
        description: args.description || null,
        reminder_type: args.reminderType || "custom",
        reminder_at: reminderAt.toISOString(),
        client_id: clientId,
        is_recurring: args.isRecurring || false,
        recurring_frequency: args.recurringFrequency || null,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      return wrapWithActionResult(actionFailed({
        action: "create_reminder",
        targetType: "reminder",
        toolUsed: "createReminder",
        error: `Failed to create reminder: ${error.message}`,
        nextStep: "Please try again."
      }));
    }

    let message = `Reminder created: "${args.title}"`;
    message += ` at ${reminderAt.toLocaleString()}`;
    if (args.clientName) message += ` for ${args.clientName}`;
    if (args.isRecurring) message += ` (${args.recurringFrequency})`;

    return wrapWithActionResult(
      actionSuccess({
        action: "create_reminder",
        targetType: "reminder",
        targetReference: args.title,
        toolUsed: "createReminder",
        summary: message,
        verified: true,
      }),
      {
        reminder: {
          id: reminder.id,
          title: reminder.title,
          reminder_at: reminder.reminder_at,
          reminder_type: reminder.reminder_type,
          status: reminder.status,
        },
      }
    );
  } catch (err: any) {
    return wrapWithActionResult(actionFailed({
      action: "create_reminder",
      targetType: "reminder",
      toolUsed: "createReminder",
      error: `Unexpected error: ${err.message}`,
      nextStep: "Please try again."
    }));
  }
}

async function executeQueryReminders(args: {
  status?: string;
  startDate?: string;
  endDate?: string;
  reminderType?: string;
  clientName?: string;
  limit?: number;
}, user: { id: string }) {
  try {
    const supabase = getSupabase();
    let clientId: string | null = null;

    if (args.clientName) {
      const { data: clients } = await supabase
        .from("clients")
        .select("id")
        .ilike("company_name", `%${args.clientName}%`)
        .limit(1);
      if (clients && clients.length > 0) {
        clientId = clients[0].id;
      }
    }

    const now = new Date().toISOString();
    const today = new Date().toISOString().split("T")[0];

    let query = supabase
      .from("reminders")
      .select("id, title, description, reminder_at, status, reminder_type, client_id, clients(company_name)")
      .eq("user_id", user.id)
      .order("reminder_at", { ascending: true })
      .limit(args.limit || 20);

    if (args.status && args.status !== "all") {
      query = query.eq("status", args.status);
    } else {
      query = query.eq("status", "pending");
    }

    if (args.reminderType) {
      query = query.eq("reminder_type", args.reminderType);
    }
    if (clientId) {
      query = query.eq("client_id", clientId);
    }

    const { data: reminders, error } = await query;

    if (error) {
      return wrapWithActionResult(actionFailed({
        action: "query_reminders",
        targetType: "reminder_query",
        toolUsed: "queryReminders",
        error: `Failed to query reminders: ${error.message}`,
        nextStep: "Please try again."
      }));
    }

    const pending = reminders?.filter(r => r.status === "pending" && r.reminder_at >= now) || [];
    const overdue = reminders?.filter(r => r.status === "pending" && r.reminder_at < now) || [];

    const formattedReminders = (reminders || []).map((r: any) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      reminder_at: r.reminder_at,
      status: r.status,
      reminder_type: r.reminder_type,
      client_name: r.clients?.company_name || null,
      is_overdue: r.status === "pending" && r.reminder_at < now,
    }));

    const filterDesc = args.clientName
      ? `for client "${args.clientName}"`
      : args.reminderType
        ? `of type "${args.reminderType}"`
        : args.status && args.status !== "all"
          ? `with status "${args.status}"`
          : "";

    return wrapWithActionResult(
      actionSuccess({
        action: "query_reminders",
        targetType: "reminder_query",
        targetReference: args.status || "pending",
        toolUsed: "queryReminders",
        summary: `Found ${formattedReminders.length} reminders (${pending.length} pending, ${overdue.length} overdue) ${filterDesc}`,
        verified: true,
      }),
      {
        reminders: formattedReminders,
        count: formattedReminders.length,
        pending_count: pending.length,
        overdue_count: overdue.length,
      }
    );
  } catch (err: any) {
    return wrapWithActionResult(actionFailed({
      action: "query_reminders",
      targetType: "reminder_query",
      toolUsed: "queryReminders",
      error: `Unexpected error: ${err.message}`,
      nextStep: "Please try again."
    }));
  }
}

async function executeUpdateReminder(args: {
  reminderIdentifier: string;
  title?: string;
  description?: string;
  reminderAt?: string;
  reminderType?: string;
  status?: string;
  snoozeMinutes?: number;
}, user: { id: string }) {
  try {
    const supabase = getSupabase();

    const { data: existing } = await supabase
      .from("reminders")
      .select("id, title")
      .eq("user_id", user.id)
      .ilike("title", `%${args.reminderIdentifier}%`)
      .limit(1);

    if (!existing || existing.length === 0) {
      return wrapWithActionResult(actionFailed({
        action: "update_reminder",
        targetType: "reminder",
        toolUsed: "updateReminder",
        error: `No reminder found matching "${args.reminderIdentifier}"`,
        nextStep: "Try using the exact reminder title or check the spelling."
      }));
    }

    const reminderId = existing[0].id;
    const updateData: any = {};

    if (args.title) updateData.title = args.title;
    if (args.description !== undefined) updateData.description = args.description;
    if (args.reminderAt) {
      const reminderAt = new Date(args.reminderAt);
      if (!isNaN(reminderAt.getTime())) {
        updateData.reminder_at = reminderAt.toISOString();
      }
    }
    if (args.reminderType) updateData.reminder_type = args.reminderType;
    if (args.status) {
      updateData.status = args.status;
      if (args.status === "completed") {
        updateData.completed_at = new Date().toISOString();
      }
    }
    if (args.snoozeMinutes) {
      const snoozeTime = new Date(Date.now() + args.snoozeMinutes * 60 * 1000);
      updateData.snoozed_until = snoozeTime.toISOString();
    }

    const { data: reminder, error } = await supabase
      .from("reminders")
      .update(updateData)
      .eq("id", reminderId)
      .select()
      .single();

    if (error) {
      return wrapWithActionResult(actionFailed({
        action: "update_reminder",
        targetType: "reminder",
        toolUsed: "updateReminder",
        error: `Failed to update reminder: ${error.message}`,
        nextStep: "Please try again."
      }));
    }

    let actionDesc = "updated";
    if (args.status === "completed") actionDesc = "completed";
    else if (args.status === "cancelled") actionDesc = "cancelled";
    else if (args.snoozeMinutes) actionDesc = `snoozed for ${args.snoozeMinutes} minutes`;

    return wrapWithActionResult(
      actionSuccess({
        action: "update_reminder",
        targetType: "reminder",
        targetReference: reminder.title,
        toolUsed: "updateReminder",
        summary: `Reminder "${reminder.title}" ${actionDesc}`,
        verified: true,
      }),
      {
        reminder: {
          id: reminder.id,
          title: reminder.title,
          status: reminder.status,
          reminder_at: reminder.reminder_at,
        },
      }
    );
  } catch (err: any) {
    return wrapWithActionResult(actionFailed({
      action: "update_reminder",
      targetType: "reminder",
      toolUsed: "updateReminder",
      error: `Unexpected error: ${err.message}`,
      nextStep: "Please try again."
    }));
  }
}

async function executeQueryAgenda(args: {
  date?: string;
  includeOverdue?: boolean;
  includeReminders?: boolean;
  includeCalendar?: boolean;
}, user: { id: string }) {
  try {
    const supabase = getSupabase();
    const targetDate = args.date ? new Date(args.date) : new Date();
    const today = targetDate.toISOString().split("T")[0];
    const tomorrow = new Date(targetDate.getTime() + 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    
    const result: any = {
      date: today,
      tasks: { today: [], overdue: [] },
      calendar_events: [],
      reminders: { pending: [], overdue: [] },
    };

    const includeOverdue = args.includeOverdue !== false;
    const includeReminders = args.includeReminders !== false;
    const includeCalendar = args.includeCalendar !== false;

    if (args.includeOverdue !== false) {
      const { data: overdueTasks } = await supabase
        .from("tasks")
        .select("id, title, status, priority, due_date, client:clients(company_name)")
        .eq("user_id", user.id)
        .eq("status", "todo")
        .lt("due_date", today)
        .order("due_date", { ascending: false })
        .limit(10);
      
      if (overdueTasks) {
        result.tasks.overdue = overdueTasks.map((t: any) => ({
          id: t.id,
          title: t.title,
          due_date: t.due_date,
          priority: t.priority,
          client_name: t.clients?.company_name || null,
        }));
      }
    }

    const { data: todayTasks } = await supabase
      .from("tasks")
      .select("id, title, status, priority, due_date, client:clients(company_name)")
      .eq("user_id", user.id)
      .eq("status", "todo")
      .eq("due_date", today)
      .order("priority", { ascending: false })
      .limit(20);

    if (todayTasks) {
      result.tasks.today = todayTasks.map((t: any) => ({
        id: t.id,
        title: t.title,
        due_date: t.due_date,
        priority: t.priority,
        client_name: t.clients?.company_name || null,
      }));
    }

    if (includeCalendar) {
      const { data: events } = await supabase
        .from("calendar_events")
        .select("id, title, start_date, start_time, event_type, location, client:clients(company_name)")
        .eq("user_id", user.id)
        .eq("start_date", today)
        .eq("status", "scheduled")
        .order("start_time", { ascending: true });

      if (events) {
        result.calendar_events = events.map((e: any) => ({
          id: e.id,
          title: e.title,
          start_time: e.start_time,
          event_type: e.event_type,
          location: e.location,
          client_name: e.clients?.company_name || null,
        }));
      }
    }

    if (includeReminders) {
      const now = new Date().toISOString();
      
      const { data: pendingReminders } = await supabase
        .from("reminders")
        .select("id, title, reminder_at, reminder_type, client:clients(company_name)")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .gte("reminder_at", today + "T00:00:00")
        .lt("reminder_at", tomorrow + "T00:00:00")
        .order("reminder_at", { ascending: true });

      if (pendingReminders) {
        result.reminders.pending = pendingReminders.map((r: any) => ({
          id: r.id,
          title: r.title,
          reminder_at: r.reminder_at,
          reminder_type: r.reminder_type,
          client_name: r.clients?.company_name || null,
        }));
      }

      if (includeOverdue) {
        const { data: overdueReminders } = await supabase
          .from("reminders")
          .select("id, title, reminder_at, reminder_type, client:clients(company_name)")
          .eq("user_id", user.id)
          .eq("status", "pending")
          .lt("reminder_at", now)
          .order("reminder_at", { ascending: false })
          .limit(10);

        if (overdueReminders) {
          result.reminders.overdue = overdueReminders.map((r: any) => ({
            id: r.id,
            title: r.title,
            reminder_at: r.reminder_at,
            reminder_type: r.reminder_type,
            client_name: r.clients?.company_name || null,
          }));
        }
      }
    }

    const totalItems = result.tasks.today.length + result.tasks.overdue.length + result.calendar_events.length + result.reminders.pending.length + result.reminders.overdue.length;

    return wrapWithActionResult(
      actionSuccess({
        action: "query_agenda",
        targetType: "agenda",
        targetReference: today,
        toolUsed: "queryAgenda",
        summary: `Found ${totalItems} items on your agenda for ${today}: ${result.tasks.today.length} tasks due today, ${result.tasks.overdue.length} overdue, ${result.calendar_events.length} events, ${result.reminders.pending.length} reminders`,
        verified: true,
      }),
      result
    );
  } catch (err: any) {
    return wrapWithActionResult(actionFailed({
      action: "query_agenda",
      targetType: "agenda",
      toolUsed: "queryAgenda",
      error: `Unexpected error: ${err.message}`,
      nextStep: "Please try again."
    }));
  }
}

async function executeConvertNoteToTasks(args: {
  noteIdentifier: string;
  tasks: Array<{
    title: string;
    priority?: string;
    dueDate?: string;
    category?: string;
  }>;
}, user: { id: string }) {
  try {
    const supabase = getSupabase();

    let noteData: any = null;

    const { data: noteByTitle } = await supabase
      .from("notes")
      .select("id, title, content, client_id, note_type")
      .eq("user_id", user.id)
      .ilike("title", `%${args.noteIdentifier}%`)
      .limit(1);

    if (noteByTitle && noteByTitle.length > 0) {
      noteData = noteByTitle[0];
    } else {
      const { data: noteByContent } = await supabase
        .from("notes")
        .select("id, title, content, client_id, note_type")
        .eq("user_id", user.id)
        .ilike("content", `%${args.noteIdentifier}%`)
        .limit(1);
      
      if (noteByContent && noteByContent.length > 0) {
        noteData = noteByContent[0];
      }
    }

    if (!noteData) {
      return wrapWithActionResult(actionFailed({
        action: "convert_note_to_tasks",
        targetType: "note",
        toolUsed: "convertNoteToTasks",
        error: `No note found matching "${args.noteIdentifier}"`,
        nextStep: "Try using the exact note title or search for a keyword in the note content."
      }));
    }

    const createdTasks: any[] = [];

    for (const taskInput of args.tasks) {
      const { data: task, error } = await supabase
        .from("tasks")
        .insert({
          user_id: user.id,
          title: taskInput.title,
          status: "todo",
          priority: taskInput.priority || "medium",
          due_date: taskInput.dueDate || null,
          category: taskInput.category || null,
          client_id: noteData.client_id,
          description: `Created from note: ${noteData.title}`,
        })
        .select()
        .single();

      if (error) {
        return wrapWithActionResult(actionFailed({
          action: "convert_note_to_tasks",
          targetType: "task",
          toolUsed: "convertNoteToTasks",
          error: `Failed to create task "${taskInput.title}": ${error.message}`,
          nextStep: "Please try again."
        }));
      }

      createdTasks.push({
        id: task.id,
        title: task.title,
        priority: task.priority,
        due_date: task.due_date,
      });
    }

    return wrapWithActionResult(
      actionSuccess({
        action: "convert_note_to_tasks",
        targetType: "note",
        targetReference: noteData.title,
        toolUsed: "convertNoteToTasks",
        summary: `Created ${createdTasks.length} task(s) from note "${noteData.title}"`,
        verified: true,
      }),
      {
        note: {
          id: noteData.id,
          title: noteData.title,
        },
        tasks: createdTasks,
      }
    );
  } catch (err: any) {
    return wrapWithActionResult(actionFailed({
      action: "convert_note_to_tasks",
      targetType: "note",
      toolUsed: "convertNoteToTasks",
      error: `Unexpected error: ${err.message}`,
      nextStep: "Please try again."
    }));
  }
}

// Generic status transition executor using verified rules from lib/office/status-actions
async function executeDocumentTransition(args: {
  documentType: "invoice" | "quote" | "purchase_order" | "credit_note";
  reference: string;
  action: string;
}): Promise<string> {
  const { documentType, reference, action } = args;
  const supabase = getSupabase();

  const configMap: Record<string, { table: string; refCol: string; label: string }> = {
    invoice: { table: "invoices", refCol: "invoice_number", label: "Invoice" },
    quote: { table: "quotes", refCol: "quote_number", label: "Quote" },
    purchase_order: { table: "purchase_orders", refCol: "po_number", label: "Purchase Order" },
    credit_note: { table: "credit_notes", refCol: "cn_number", label: "Credit Note" },
  };

  const config = configMap[documentType];
  if (!config) return JSON.stringify({ error: `Invalid document type: ${documentType}` });

  try {
    // 1. Resolve document using the appropriate resolver
    let resolved: any;
    if (documentType === "invoice") {
      resolved = await resolveInvoiceForWrite(supabase, reference);
    } else if (documentType === "quote") {
      resolved = await resolveQuoteForWrite(supabase, reference);
    } else if (documentType === "purchase_order") {
      resolved = await resolvePOForWrite(supabase, reference);
    } else if (documentType === "credit_note") {
      resolved = await resolveCreditNoteForWrite(supabase, reference);
    } else {
      return JSON.stringify({ error: `Invalid document type: ${documentType}` });
    }

    if (resolved.kind === "not_found") {
      return JSON.stringify({ error: `No ${config.label.toLowerCase()} found matching "${reference}".` });
    }

    if (resolved.kind === "ambiguous") {
      const matches = resolved.candidates.map((c: any) => `${c[config.refCol] || c.po_number || c.cn_number || c.quote_number || c.invoice_number} (${c.status})`).join(", ");
      return JSON.stringify({ error: `Multiple matches for "${reference}": ${matches}. Please be more specific.` });
    }

    const doc = resolved.record;
    const currentStatus = doc.status;

    // 2. Validate transition
    const validation = await validateTransition(documentType, currentStatus, action);
    if (!validation.success) {
      return wrapWithActionResult(
        actionFailed({
          action,
          targetType: documentType,
          toolUsed: "transitionDocumentStatus",
          error: validation.error || `Cannot perform "${action}" on a ${config.label.toLowerCase()} in "${currentStatus}" status.`,
          nextStep: `The ${config.label.toLowerCase()} is currently "${currentStatus}". Only certain actions are permitted from this state.`
        })
      );
    }

    // 3. Execute update
    const { error: updateError } = await supabase
      .from(config.table)
      .update({ status: validation.newStatus })
      .eq("id", doc.id);

    if (updateError) return JSON.stringify({ error: `Update failed: ${updateError.message}` });

    // 4. Verify
    const { data: verified } = await supabase
      .from(config.table)
      .select("status")
      .eq("id", doc.id)
      .single();

    const isVerified = (verified as any)?.status === validation.newStatus;

    return wrapWithActionResult(
      actionSuccess({
        action,
        targetType: documentType,
        targetReference: doc[config.refCol],
        toolUsed: "transitionDocumentStatus",
        summary: `${config.label} ${doc[config.refCol]} transitioned: ${currentStatus} → ${validation.newStatus}.`,
        verified: isVerified,
      }),
      { previous_status: currentStatus, new_status: validation.newStatus, document_number: doc[config.refCol] }
    );

  } catch (err: any) {
    return JSON.stringify({ error: `Unexpected error: ${err.message}` });
  }
}

function buildAttachmentParts(attachments: AttachmentInput[] | undefined) {
  return (attachments || [])
    .map((attachment) => {
      const dataUrl = String(attachment?.dataUrl || "");
      const match = dataUrl.match(/^data:(.+?);base64,(.+)$/);
      if (!match) return null;

      return {
        inlineData: {
          mimeType: attachment?.type || match[1],
          data: match[2],
        },
      };
    })
    .filter(Boolean);
}

function normalizeHistory(history: any[] | undefined, message: string, attachments?: AttachmentInput[]) {
  const geminiHistory = (history || []).map((msg: any) => ({
    role: msg.sender === "user" ? "user" : "model",
    parts: [{ text: msg.text }],
  }));

  const firstUserIndex = geminiHistory.findIndex((m: any) => m.role === "user");
  let normalizedHistory = firstUserIndex !== -1 ? geminiHistory.slice(firstUserIndex) : [];

  // Truncate history to last 20 messages to manage token costs and context window.
  // Keep first 2 (for initial context) and last 18 when over limit.
  const MAX_HISTORY = 20;
  if (normalizedHistory.length > MAX_HISTORY) {
    normalizedHistory = [
      ...normalizedHistory.slice(0, 2),
      ...normalizedHistory.slice(normalizedHistory.length - (MAX_HISTORY - 2)),
    ];
  }

  const attachmentParts = buildAttachmentParts(attachments);
  return [
    ...normalizedHistory,
    {
      role: "user",
      parts: [
        { text: message },
        ...attachmentParts,
      ],
    },
  ];
}

function collectResponseParts(response: any) {
  const parts = [
    ...(response?.candidates?.[0]?.content?.parts ?? []),
    ...(response?.serverContent?.modelTurn?.parts ?? []),
    ...(response?.serverContent?.parts ?? []),
    ...(response?.content?.parts ?? []),
    ...(response?.parts ?? []),
  ];

  return parts;
}

function extractAudioFromParts(parts: any[]) {
  for (const part of parts) {
    const inlineData = part?.inlineData;
    if (inlineData?.data) {
      return {
        audioBase64: inlineData.data,
        audioMimeType: inlineData.mimeType || "audio/mp3",
      };
    }

    if (part?.data && (part?.mimeType || part?.mime_type)) {
      return {
        audioBase64: part.data,
        audioMimeType: part.mimeType || part.mime_type || "audio/mp3",
      };
    }
  }

  return {
    audioBase64: "",
    audioMimeType: "audio/mp3",
  };
}

function extractToolCall(response: any, parts: any[]) {
  return (
    response?.functionCalls?.[0] ||
    response?.toolCall ||
    parts.find((part: any) => part?.functionCall)?.functionCall ||
    null
  );
}

function extractAllToolCalls(response: any, parts: any[]) {
  const calls: any[] = [];

  // Check response-level function calls
  if (Array.isArray(response?.functionCalls)) {
    calls.push(...response.functionCalls);
  } else if (response?.functionCalls) {
    calls.push(response.functionCalls);
  }

  if (response?.toolCall) {
    calls.push(response.toolCall);
  }

  // Check parts for function calls
  for (const part of parts) {
    if (part?.functionCall) {
      calls.push(part.functionCall);
    }
  }

  // Deduplicate by serializing
  const seen = new Set<string>();
  return calls.filter((call) => {
    const key = JSON.stringify(call);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function extractFunctionCallParts(parts: any[]) {
  return parts.filter((part: any) => part?.functionCall);
}

function extractPayload(response: any) {
  const parts = collectResponseParts(response);
  const text =
    typeof response?.text === "string" && response.text.trim()
      ? response.text
      : parts
          .filter((part: any) => typeof part.text === "string")
          .map((part: any) => part.text)
          .join("");
  const audioFromResponse = typeof response?.data === "string" ? response.data : "";
  const audioFromParts = extractAudioFromParts(parts);
  const audioBase64 = audioFromResponse || audioFromParts.audioBase64 || "";
  const toolCall = extractToolCall(response, parts);
  const allToolCalls = extractAllToolCalls(response, parts);
  const functionCallParts = extractFunctionCallParts(parts);

  return {
    text: text || "",
    audio: audioBase64,
    audioBase64,
    audioMimeType: audioFromParts.audioMimeType,
    toolCall,
    toolCalls: allToolCalls.length > 0 ? allToolCalls : toolCall ? [toolCall] : [],
    functionCallParts,
  };
}

function pcmBase64ToWavBase64(base64Pcm: string, sampleRate = 24000, channels = 1, bitsPerSample = 16) {
  const pcmBuffer = Buffer.from(base64Pcm, "base64");
  const byteRate = (sampleRate * channels * bitsPerSample) / 8;
  const blockAlign = (channels * bitsPerSample) / 8;
  const wavHeader = Buffer.alloc(44);

  wavHeader.write("RIFF", 0);
  wavHeader.writeUInt32LE(36 + pcmBuffer.length, 4);
  wavHeader.write("WAVE", 8);
  wavHeader.write("fmt ", 12);
  wavHeader.writeUInt32LE(16, 16);
  wavHeader.writeUInt16LE(1, 20);
  wavHeader.writeUInt16LE(channels, 22);
  wavHeader.writeUInt32LE(sampleRate, 24);
  wavHeader.writeUInt32LE(byteRate, 28);
  wavHeader.writeUInt16LE(blockAlign, 32);
  wavHeader.writeUInt16LE(bitsPerSample, 34);
  wavHeader.write("data", 36);
  wavHeader.writeUInt32LE(pcmBuffer.length, 40);

  return Buffer.concat([wavHeader, pcmBuffer]).toString("base64");
}

async function synthesizeSpeech(aiClient: GoogleGenAI, text: string, languagePreference: AssistantPreferences["languagePreference"]) {
  const voiceName = languagePreference === "british_english" ? BRITISH_VOICE : DEFAULT_VOICE;
  const runTts = async (voice: string) =>
    aiClient.models.generateContent({
      model: TTS_MODEL,
      contents: text,
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voice,
            },
          },
        },
      },
    } as any);

  let ttsResponse: any;
  try {
    ttsResponse = await runTts(voiceName);
  } catch {
    ttsResponse = await runTts(DEFAULT_VOICE);
  }

  const parts = ttsResponse?.candidates?.[0]?.content?.parts ?? [];
  const inlineAudio = parts.find((part: any) => part?.inlineData?.data);
  const base64Pcm = inlineAudio?.inlineData?.data || ttsResponse?.data || "";
  const mimeType = inlineAudio?.inlineData?.mimeType || "audio/wav";

  if (!base64Pcm) {
    return { audioBase64: "", audioMimeType: mimeType };
  }

  const audioBase64 = mimeType === "audio/wav" ? base64Pcm : pcmBase64ToWavBase64(base64Pcm);
  return {
    audioBase64,
    audioMimeType: "audio/wav",
  };
}

function buildRuntimeContext(sessionContext: SessionContextInput | null, activeDocumentSession: ActiveDocumentSession) {
  const sections: string[] = [];

  if (sessionContext?.businessProfile) {
    const profile = sessionContext.businessProfile;
    sections.push(
      [
        "Business profile:",
        `name=${profile.business_name || "Unknown"}`,
        `vat=${profile.vat_number || "Unknown"}`,
        `address=${profile.address || "Unknown"}`,
        `email=${profile.email || "Unknown"}`,
      ].join(" ")
    );
  }

  if (sessionContext?.clients?.length) {
    const clientLines = sessionContext.clients
      .slice(0, 12)
      .map((client) => `${client.company_name || "Unknown"}${client.email ? ` <${client.email}>` : ""}${client.phone ? ` ${client.phone}` : ""}`);
    sections.push(`Relevant clients:\n- ${clientLines.join("\n- ")}`);
  }

  if (sessionContext?.aiMemory?.length) {
    const memoryLines = sessionContext.aiMemory
      .slice(0, 20)
      .map((memory) => `[${memory.category}] ${memory.key}: ${memory.value}`);
    sections.push(`Relevant AI memory:\n- ${memoryLines.join("\n- ")}`);
  }

  if (activeDocumentSession?.isOpen && activeDocumentSession.documentType) {
    const docData = activeDocumentSession.documentData;
    const lineItems = Array.isArray(docData?.lineItems) ? docData.lineItems : [];
    const documentNumber =
      docData?.documentNumber ||
      docData?.invoiceNumber ||
      docData?.quoteNumber ||
      docData?.invoice_number ||
      docData?.quote_number ||
      null;
    sections.push(
      [
        `Active document: ${activeDocumentSession.documentType}`,
        `id=${activeDocumentSession.documentId || "new"}`,
        documentNumber ? `number=${documentNumber}` : "",
        docData?.clientName ? `client=${docData.clientName}` : "",
        `items=${lineItems.length}`,
      ]
        .filter(Boolean)
        .join(" ")
    );

    if (lineItems.length > 0) {
      sections.push(
        `Open line items:\n- ${lineItems
          .slice(0, 10)
          .map((item: any, index: number) => `${index + 1}. ${item.description || "Untitled"} | qty ${item.quantity ?? 1} | price R${Number(item.unitPrice ?? item.unit_price ?? 0).toFixed(2)}`)
          .join("\n- ")}`
      );
    }
  } else {
    sections.push("No document is currently open.");
  }

  return sections.join("\n\n").trim();
}

function normalizeHistoryForModel(
  history: any[] | undefined,
  message: string,
  attachments: AttachmentInput[] | undefined,
  runtimeContext: string
) {
  const baseHistory = normalizeHistory(history, message, attachments);
  return runtimeContext
    ? [
        { role: "user", parts: [{ text: `Runtime context:\n${runtimeContext}` }] },
        { role: "model", parts: [{ text: "Context received." }] },
        ...baseHistory,
      ]
    : baseHistory;
}

function encodeEvent(event: Record<string, unknown>) {
  return `${JSON.stringify(event)}\n`;
}

function buildServerToolFallbackMessage(toolName: string, toolResult: string) {
  try {
    const parsed = JSON.parse(toolResult);

    // Parse structured action status if present
    const actionStatus = parsed?.actionStatus as ActionResult | undefined;
    if (actionStatus) {
      if (actionStatus.status === "confirmed") {
        return actionStatus.summary || `${actionStatus.action} completed: ${actionStatus.targetReference}`;
      }
      if (actionStatus.status === "failed") {
        return `I tried to ${actionStatus.action.replace(/_/g, " ")}, but it failed: ${actionStatus.error || "Unknown error"}. ${actionStatus.nextStep || ""}`.trim();
      }
      if (actionStatus.status === "need_info") {
        return actionStatus.nextStep || `I need more information to ${actionStatus.action.replace(/_/g, " ")}.`;
      }
      if (actionStatus.status === "could_not_verify") {
        return `${actionStatus.summary || `${actionStatus.action.replace(/_/g, " ")} attempted`}, but I could not verify it was saved correctly.`;
      }
      if (actionStatus.status === "unsupported") {
        return actionStatus.summary || `This action is not currently available.`;
      }
      if (actionStatus.status === "attempted") {
        return `${actionStatus.summary || `${actionStatus.action.replace(/_/g, " ")} attempted`}. ${actionStatus.nextStep || ""}`.trim();
      }
    }

    if (parsed?.error) {
      return `I tried to run ${toolName}, but it failed: ${parsed.error}`;
    }

    if (toolName === "convertQuoteToInvoice" && parsed?.invoice?.invoiceNumber) {
      const inv = parsed.invoice;
      return `Quote ${inv.quoteNumber} converted to Invoice ${inv.invoiceNumber}. Total: R${inv.total}. Due: ${inv.dueDate}.`;
    }

    if (toolName === "draftInvoice" || (toolName === "openInvoiceManager" && parsed?.invoice)) {
      const invoice = parsed.invoice;
      return `Invoice ${invoice?.invoiceNumber || "created"} created for ${invoice?.clientName || "the client"} at R${invoice?.total || "0.00"}.`;
    }

    if (toolName === "draftQuote" || (toolName === "openQuotationBuilder" && parsed?.quote)) {
      const quote = parsed.quote;
      return `Quote ${quote?.quoteNumber || "created"} prepared for ${quote?.clientName || "the client"} at R${quote?.total || "0.00"}.`;
    }

    if (toolName === "queryBusinessData" && parsed?.missingContactNameCount !== undefined) {
      return `I found ${parsed.missingContactNameCount} active clients without a contact name, ${parsed.missingCategoryCount} without a category, and ${parsed.missingEmailCount} without an email.`;
    }

    if (toolName === "queryBusinessData" && parsed?.count !== undefined) {
      return `I checked the data and found ${parsed.count} matching record${parsed.count === 1 ? "" : "s"}.`;
    }

    if (toolName === "createClient" && parsed?.client?.companyName) {
      return `Client ${parsed.client.companyName} was created successfully.`;
    }

    if (toolName === "logExpense" && parsed?.expense?.supplier) {
      return `Expense logged for ${parsed.expense.supplier} at R${parsed.expense.amountInclusive || "0.00"}.`;
    }

    if (toolName === "recordPayment" && parsed?.payment?.invoiceNumber) {
      return `Payment of R${parsed.payment.amountPaid || "0.00"} recorded against ${parsed.payment.invoiceNumber}.`;
    }

    if (toolName === "logTrip" && parsed?.trip?.to) {
      return `Trip logged to ${parsed.trip.to} for ${parsed.trip.distanceKm || 0} km.`;
    }

    if (toolName === "logFuelPurchase" && parsed?.fuelLog?.supplier) {
      return `Fuel purchase logged at ${parsed.fuelLog.supplier} for R${parsed.fuelLog.totalAmount || "0.00"}.`;
    }

    if (toolName === "saveMemory" && parsed?.saved?.key) {
      return `I've remembered ${parsed.saved.key}.`;
    }
  } catch {
    return "";
  }

  return "";
}

async function streamModelResponse(
  ai: GoogleGenAI,
  request: any,
  controller: ReadableStreamDefaultController<Uint8Array>
) {
  const encoder = new TextEncoder();
  controller.enqueue(encoder.encode(encodeEvent({ type: "start" })));
  const streamed = await ai.models.generateContentStream(request);
  let fullText = "";
  let lastPayload = {
    text: "",
    audio: "",
    audioBase64: "",
    audioMimeType: "audio/mp3",
    toolCall: null as any,
    toolCalls: [] as any[],
    functionCallParts: [] as any[],
  };


  for await (const chunk of streamed) {
    const payload = extractPayload(chunk);
    const chunkText = payload.text || "";
    let delta = "";

    if (chunkText.startsWith(fullText)) {
      delta = chunkText.slice(fullText.length);
      fullText = chunkText;
    } else if (chunkText) {
      delta = chunkText;
      fullText += chunkText;
    }

    if (delta) {
      controller.enqueue(encoder.encode(encodeEvent({ type: "delta", text: delta })));
    }

    if (payload.toolCall || payload.toolCalls?.length || chunkText) {
      lastPayload = {
        ...lastPayload,
        ...payload,
        text: chunkText || lastPayload.text,
        toolCalls: payload.toolCalls?.length ? payload.toolCalls : lastPayload.toolCalls,
        toolCall: payload.toolCall || lastPayload.toolCall,
        functionCallParts: payload.functionCallParts?.length ? payload.functionCallParts : lastPayload.functionCallParts,
      };
    }
  }

  const finalResponse = await (streamed as any).response;
  const extractedFinalPayload = finalResponse ? extractPayload(finalResponse) : null;
  const finalPayload =
    extractedFinalPayload && (extractedFinalPayload.text || extractedFinalPayload.toolCall || extractedFinalPayload.toolCalls?.length)
      ? extractedFinalPayload
      : lastPayload;

  return {
    finalPayload,
    fullText: finalPayload.text || fullText,
  };
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  let user: { id: string } | null = null;
  let hasError = false;
  let errorMessage: string | null = null;
  let toolCallsExecuted: string[] = [];
  let responseText: string | null = null;
  let userMessage = "";
  let conversationId: string | null = null;

  try {
    // Reject requests larger than 1MB to prevent memory abuse
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 1_000_000) {
      return new Response(
        JSON.stringify({ error: 'Request too large. Maximum size is 1MB.' }),
        { status: 413, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const authResult = await requireAuthenticatedUser();
    user = authResult.user;

    const rateLimitResult = await checkRateLimit(createAdminClient(), user.id);

    if (!rateLimitResult.allowed) {
      hasError = true;
      errorMessage = rateLimitResult.message || "Rate limit exceeded";
      return new Response(
        JSON.stringify({ error: rateLimitResult.message }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const {
      history,
      message,
      attachments = [],
      wantsAudio = false,
      assistantPreferences,
      activeDocumentSession = null,
      sessionContext = null,
    } = body;
    userMessage = message || "";
    conversationId = (body as any).conversationId || null;
    const preferences = parseAssistantPreferences(assistantPreferences);

    // Resolve Gemini API key: stored UI key takes priority over environment variable
    const geminiApiKey = await getActiveApiKey("gemini");
    if (!geminiApiKey) {
      hasError = true;
      errorMessage = "Gemini API key is not configured";
      return NextResponse.json({ error: "Gemini API key is not configured. Please add your API key in Settings → API Keys." }, { status: 401 });
    }

    // Create a per-request GoogleGenAI instance with the resolved key
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });

    if (!message) throw new Error("Missing message in request body");

    const runtimeContext = buildRuntimeContext(sessionContext, activeDocumentSession);
    const systemInstruction = buildSystemInstruction(preferences, activeDocumentSession);
    const contents = normalizeHistoryForModel(history, message, attachments, runtimeContext);

    const stream = new ReadableStream<Uint8Array>({
      start: async (controller) => {
        const encoder = new TextEncoder();

        try {
          const initialRequest = {
            model: CHAT_MODEL,
            contents,
            config: {
              responseModalities: ["TEXT"],
              tools: tools as any,
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 4096,
              },
            },
            systemInstruction,
          } as any;

          let { finalPayload: payload, fullText } = await streamModelResponse(ai, initialRequest, controller);

          if (payload.toolCall && SERVER_SIDE_TOOLS.has(payload.toolCall.name)) {
            const toolName = payload.toolCall.name;
            const toolArgs = payload.toolCall.args || {};
            toolCallsExecuted.push(toolName);

            let toolResult: string;
            try {
              if (toolName === "logTrip") toolResult = await executeLogTrip(toolArgs);
              else if (toolName === "queryBusinessData") toolResult = await executeQueryBusinessData(toolArgs);
              else if (toolName === "createClient") toolResult = await executeCreateClient(toolArgs);
              else if (toolName === "updateClient") toolResult = await executeUpdateClient(toolArgs);
              else if (toolName === "addClientCommunication") toolResult = await executeAddClientCommunication(toolArgs);
              else if (toolName === "createClientContact") toolResult = await executeCreateClientContact(toolArgs);
              else if (toolName === "updateClientContact") toolResult = await executeUpdateClientContact(toolArgs);
              else if (toolName === "logExpense") toolResult = await executeLogExpense(toolArgs);
              else if (toolName === "recordPayment") toolResult = await executeRecordPayment(toolArgs);
              else if (toolName === "draftQuote") toolResult = await executeDraftQuote(toolArgs);
              else if (toolName === "draftInvoice") toolResult = await executeDraftInvoice(toolArgs);
              else if (toolName === "draftPurchaseOrder") toolResult = await executeDraftPurchaseOrder(toolArgs);
              else if (toolName === "draftCreditNote") toolResult = await executeDraftCreditNote(toolArgs);
              else if (toolName === "saveMemory") toolResult = await executeSaveMemory(toolArgs);
              else if (toolName === "logFuelPurchase") toolResult = await executeLogFuelPurchase(toolArgs);
              else if (toolName === "updateInvoiceStatus") toolResult = await executeUpdateInvoiceStatus(toolArgs);
              else if (toolName === "updatePurchaseOrderStatus") toolResult = await executeUpdatePurchaseOrderStatus(toolArgs);
              else if (toolName === "updateCreditNoteStatus") toolResult = await executeUpdateCreditNoteStatus(toolArgs);
              else if (toolName === "markInvoicePaid") toolResult = await executeMarkInvoicePaid(toolArgs);
              else if (toolName === "voidInvoice") toolResult = await executeVoidInvoice(toolArgs);
              else if (toolName === "markInvoiceSent") toolResult = await executeMarkInvoiceSent(toolArgs);
              else if (toolName === "reopenInvoice") toolResult = await executeReopenInvoice(toolArgs);
              else if (toolName === "markQuoteSent") toolResult = await executeMarkQuoteSent(toolArgs);
              else if (toolName === "acceptQuote") toolResult = await executeAcceptQuote(toolArgs);
              else if (toolName === "declineQuote") toolResult = await executeDeclineQuote(toolArgs);
              else if (toolName === "expireQuote") toolResult = await executeExpireQuote(toolArgs);
              else if (toolName === "reopenQuote") toolResult = await executeReopenQuote(toolArgs);
              else if (toolName === "rejectQuote") toolResult = await executeRejectQuote(toolArgs);
              else if (toolName === "issueQuote") toolResult = await executeIssueQuote(toolArgs);
              else if (toolName === "markPOSent") toolResult = await executeMarkPOSent(toolArgs);
              else if (toolName === "acknowledgePO") toolResult = await executeAcknowledgePO(toolArgs);
              else if (toolName === "markPODelivered") toolResult = await executeMarkPODelivered(toolArgs);
              else if (toolName === "cancelPO") toolResult = await executeCancelPO(toolArgs);
              else if (toolName === "issueCreditNote") toolResult = await executeIssueCreditNote(toolArgs);
              else if (toolName === "sendCreditNote") toolResult = await executeSendCreditNote(toolArgs);
              else if (toolName === "applyCreditNote") toolResult = await executeApplyCreditNote(toolArgs);
              else if (toolName === "cancelCreditNote") toolResult = await executeCancelCreditNote(toolArgs);
              else if (toolName === "transitionDocumentStatus") toolResult = await executeDocumentTransition(toolArgs);
              else if (toolName === "convertQuoteToInvoice") toolResult = await executeConvertQuoteToInvoice(toolArgs);
              else if (!user) toolResult = JSON.stringify({ error: "Authentication required" });
              else if (toolName === "createTask") toolResult = await executeCreateTask(toolArgs, user);
              else if (toolName === "updateTask") toolResult = await executeUpdateTask(toolArgs, user);
              else if (toolName === "completeTask") toolResult = await executeCompleteTask(toolArgs, user);
              else if (toolName === "queryTasks") toolResult = await executeQueryTasks(toolArgs, user);
              else if (toolName === "deleteTask") toolResult = await executeDeleteTask(toolArgs, user);
              else if (toolName === "createNote") toolResult = await executeCreateNote(toolArgs, user);
              else if (toolName === "searchNotes") toolResult = await executeSearchNotes(toolArgs, user);
              else if (toolName === "logCallNote") toolResult = await executeLogCallNote(toolArgs, user);
              else if (toolName === "createCalendarEvent") toolResult = await executeCreateCalendarEvent(toolArgs, user);
              else if (toolName === "queryCalendarEvents") toolResult = await executeQueryCalendarEvents(toolArgs, user);
              else if (toolName === "updateCalendarEvent") toolResult = await executeUpdateCalendarEvent(toolArgs, user);
              else if (toolName === "createReminder") toolResult = await executeCreateReminder(toolArgs, user);
              else if (toolName === "queryReminders") toolResult = await executeQueryReminders(toolArgs, user);
              else if (toolName === "updateReminder") toolResult = await executeUpdateReminder(toolArgs, user);
              else if (toolName === "queryAgenda") toolResult = await executeQueryAgenda(toolArgs, user);
              else if (toolName === "convertNoteToTasks") toolResult = await executeConvertNoteToTasks(toolArgs, user);
              else toolResult = wrapWithActionResult(
                actionUnsupported({
                  action: toolName,
                  targetType: "unknown",
                  toolUsed: toolName,
                  reason: `The action "${toolName}" is not a recognised server-side tool.`,
                  nextStep: "Please rephrase your request or contact support if you believe this is an error.",
                })
              );
            } catch (err: any) {
              console.error(`[Tool Execution] Error executing ${toolName}:`, err);
              toolResult = JSON.stringify({ error: err.message || "Tool execution failed" });
            }

            // Log the AI action to the audit trail (fire-and-forget)
            const toolEndTime = Date.now();
            const { actionStatus, data: resultData } = parseActionResult(toolResult);
            const targetInfo = extractTargetInfo(toolName, toolArgs);
            
            logAIAction({
              userId: user?.id,
              conversationId,
              userMessage,
              toolName,
              toolArgs,
              targetType: targetInfo.targetType,
              targetReference: targetInfo.targetReference,
              actionStatus: actionStatus?.status || (toolResult.includes('"error"') ? "failed" : "confirmed"),
              attempted: actionStatus?.attempted ?? true,
              verified: actionStatus?.verified ?? false,
              verificationDetails: resultData || undefined,
              errorMessage: actionStatus?.error || (toolResult.includes('"error"') ? (JSON.parse(toolResult).error || null) : null),
              nextStep: actionStatus?.nextStep,
              summary: actionStatus?.summary,
              rawToolResult: resultData,
              modelName: CHAT_MODEL,
              latencyMs: toolEndTime - startTime,
              requestSource: "chat",
            }).catch((e: any) => console.error('[AI Action Log Failed]', e?.message || e));

            const isSuccess = actionStatus?.status === "confirmed" || actionStatus?.status === "could_not_verify";
            recordToolExecution(
              `req_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
              CHAT_MODEL,
              toolName,
              isSuccess,
              {
                latencyMs: toolEndTime - startTime,
                errorType: isSuccess ? undefined : "unknown_error",
                errorMessage: actionStatus?.error || undefined,
                verificationStatus: isSuccess ? "confirmed" : "failed",
              }
            );

            let parsedToolResult: Record<string, unknown>;
            try {
              parsedToolResult = JSON.parse(toolResult);
            } catch (e: any) {
              console.error(`[Tool Parse] Failed to parse ${toolName} result:`, e.message);
              parsedToolResult = { error: "Tool returned invalid response", raw: toolResult };
            }

            const followUpContents = [
              ...contents,
              {
                role: "model",
                parts:
                  payload.functionCallParts?.length
                    ? payload.functionCallParts
                    : [{ functionCall: { name: toolName, args: toolArgs } }],
              },
              { role: "user", parts: [{ functionResponse: { name: toolName, response: parsedToolResult } }] },
            ];

            const followUpRequest = {
              model: CHAT_MODEL,
              contents: followUpContents,
              config: {
                responseModalities: ["TEXT"],
                tools: tools as any,
              },
              systemInstruction,
            } as any;

            const followUpResult = await streamModelResponse(ai, followUpRequest, controller);
            payload = followUpResult.finalPayload;
            fullText = followUpResult.fullText;

            if (!String(fullText || "").trim()) {
              const fallbackText = buildServerToolFallbackMessage(toolName, toolResult);
              if (fallbackText) {
                fullText = fallbackText;
                payload = {
                  ...payload,
                  text: fallbackText,
                  toolCall: null,
                  toolCalls: [],
                };
              }
            }
          }

          const shouldSynthesizeAudio = Boolean(wantsAudio && fullText && !payload.toolCall);
          const speechPayload = shouldSynthesizeAudio
            ? await synthesizeSpeech(ai, fullText, preferences.languagePreference)
            : null;

          responseText = fullText;

          controller.enqueue(encoder.encode(encodeEvent({
            type: "done",
            text: fullText,
            toolCall: payload.toolCall || null,
            toolCalls: payload.toolCalls || [],
            audio: speechPayload?.audioBase64 || "",
            audioBase64: speechPayload?.audioBase64 || "",
            audioMimeType: speechPayload?.audioMimeType || "audio/wav",
          })));
          controller.close();
        } catch (streamError: any) {
          hasError = true;
          errorMessage = streamError.message || "Streaming failed";
          controller.enqueue(encoder.encode(encodeEvent({ type: "error", error: streamError.message || "Streaming failed" })));
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });


  } catch (error: any) {
    if (isAuthError(error)) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    hasError = true;
    errorMessage = error.message || "Internal Server Error";
    console.error("Gemini API Error:", error);

    // Detect Gemini API failures and return user-friendly messages
    const msg = error.message || "";
    if (msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('ECONNREFUSED')) {
      return NextResponse.json(
        { error: 'The AI assistant is temporarily unavailable. Please try again in a moment.' },
        { status: 503 }
      );
    }
    if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('rate limit')) {
      return NextResponse.json(
        { error: 'Too many requests to the AI service. Please wait a moment before trying again.' },
        { status: 429 }
      );
    }
    if (msg.includes('500') || msg.includes('502') || msg.includes('504')) {
      return NextResponse.json(
        { error: 'The AI service encountered an unexpected error. Please try again.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  } finally {
    if (user?.id) {
      const endTime = Date.now();
      const supabaseAdmin = createAdminClient();
      supabaseAdmin
        .from("ai_usage_logs")
        .insert({
          user_id: user.id,
          model_used: CHAT_MODEL,
          tool_calls: toolCallsExecuted,
          input_message_length: userMessage.length,
          output_message_length: (responseText || "").length,
          conversation_id: conversationId || null,
          success: !hasError,
          error_message: errorMessage || null,
          response_time_ms: endTime - startTime,
        })
        .then(({ error }) => {
          if (error) console.error("Usage log insert failed:", error);
        });

      if (conversationId || (Array.isArray(history) && history.length > 0)) {
        const messages = buildPersistedMessages(history, userMessage, responseText);
        if (messages.length > 0) {
          saveConversationToSupabase(conversationId, messages, undefined).then((newId) => {
            if (newId && !conversationId) {
              console.log("[Conversation] Created new conversation:", newId);
            }
          }).catch((err) => console.error("[Conversation] Save failed:", err));
        }
      }
    }
  }
}

function buildPersistedMessages(history: any, lastUserMessage: string, lastAssistantResponse: string | null): Array<{ id: string; text: string; sender: "user" | "assistant"; timestamp: string }> {
  const messages: Array<{ id: string; text: string; sender: "user" | "assistant"; timestamp: string }> = [];
  const now = new Date().toISOString();
  const historyArray = Array.isArray(history) ? history : [];
  
  if (historyArray.length > 0) {
    for (const msg of historyArray) {
      if (msg.role === "user" || msg.role === "assistant") {
        messages.push({
          id: generateMessageId(),
          text: typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content),
          sender: msg.role === "user" ? "user" : "assistant",
          timestamp: now,
        });
      }
    }
  }
  
  if (lastUserMessage) {
    messages.push({
      id: generateMessageId(),
      text: lastUserMessage,
      sender: "user",
      timestamp: now,
    });
  }
  
  if (lastAssistantResponse) {
    messages.push({
      id: generateMessageId(),
      text: lastAssistantResponse,
      sender: "assistant",
      timestamp: now,
    });
  }
  
  return messages;
}

function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}
