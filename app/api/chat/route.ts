import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { requireAuthenticatedUser, isAuthError } from "@/lib/auth/require-user";
import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getActiveApiKey } from "@/lib/api-keys/resolver";
import { createAdminClient } from "@/lib/supabase/admin";
import { ActionResult, wrapWithActionResult, actionSuccess, actionFailed, actionNeedInfo, actionUnsupported, actionAttempted } from "@/lib/assistant-action";
import { SYSTEM_PROMPT_BASE } from "@/lib/assistant-prompt";

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
  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("id, invoice_number, client_id, subtotal, vat_amount, total, status")
    .eq("id", invoiceId)
    .maybeSingle();

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

  const { count, error: countErr } = await supabase
    .from("invoice_line_items")
    .select("id", { count: "exact", head: true })
    .eq("invoice_id", invoiceId);

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
  const { data: quote, error } = await supabase
    .from("quotes")
    .select("id, quote_number, client_id, subtotal, total, status")
    .eq("id", quoteId)
    .maybeSingle();

  if (error || !quote) {
    return verifyResult(false, { reason: "Quote row not found after insert", error: error?.message });
  }

  if (quote.quote_number !== expected.quote_number) {
    return verifyResult(false, { reason: "quote_number mismatch", expected: expected.quote_number, actual: quote.quote_number });
  }

  const { count, error: countErr } = await supabase
    .from("quote_line_items")
    .select("id", { count: "exact", head: true })
    .eq("quote_id", quoteId);

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
  const { data: po, error } = await supabase
    .from("purchase_orders")
    .select("id, po_number, supplier_name, total, status")
    .eq("id", poId)
    .maybeSingle();

  if (error || !po) {
    return verifyResult(false, { reason: "PO row not found after insert", error: error?.message });
  }

  if (po.po_number !== expected.po_number) {
    return verifyResult(false, { reason: "po_number mismatch", expected: expected.po_number, actual: po.po_number });
  }

  const { count, error: countErr } = await supabase
    .from("purchase_order_items")
    .select("id", { count: "exact", head: true })
    .eq("purchase_order_id", poId);

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
  const { data: cn, error } = await supabase
    .from("credit_notes")
    .select("id, cn_number, client_id, total, status")
    .eq("id", cnId)
    .maybeSingle();

  if (error || !cn) {
    return verifyResult(false, { reason: "Credit note row not found after insert", error: error?.message });
  }

  if (cn.cn_number !== expected.cn_number) {
    return verifyResult(false, { reason: "cn_number mismatch", expected: expected.cn_number, actual: cn.cn_number });
  }

  const { count, error: countErr } = await supabase
    .from("credit_note_items")
    .select("id", { count: "exact", head: true })
    .eq("credit_note_id", cnId);

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
}>> {
  const ref = reference.trim().toUpperCase();
  if (!ref) return { kind: "not_found" };

  // 1. Exact match
  const { data: exact } = await supabase
    .from("credit_notes")
    .select("id, cn_number, total, status, clients(company_name)")
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
      },
    };
  }

  // 2. Fuzzy
  const { data: fuzzy } = await supabase
    .from("credit_notes")
    .select("id, cn_number, total, status, clients(company_name)")
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
    ],
  },
];

// ============================================================
// SERVER-SIDE TOOL EXECUTORS
// ============================================================

// Tools that execute server-side and return data for a follow-up AI call
const SERVER_SIDE_TOOLS = new Set(["queryBusinessData", "logTrip", "createClient", "logExpense", "recordPayment", "draftQuote", "draftInvoice", "draftPurchaseOrder", "draftCreditNote", "saveMemory", "logFuelPurchase", "updateInvoiceStatus", "markInvoicePaid", "voidInvoice"]);

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
        const { data: invoices } = await supabase
          .from("invoices")
          .select("total, amount_paid, balance_due, status, due_date")
          .order("created_at", { ascending: false });

        const { data: credits } = await supabase.from("credit_notes").select("total").neq("status", "Cancelled");

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
          .neq("status", "Paid")
          .lt("due_date", today)
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
        const overdueCount = invoices.filter((i: any) => i.status !== "Paid" && i.due_date && i.due_date < today).length;

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

  // Check for duplicates
  const { data: existing } = await supabase
    .from("clients")
    .select("id, company_name")
    .ilike("company_name", companyName)
    .limit(1)
    .maybeSingle();

  if (existing) {
    return wrapWithActionResult(
      actionFailed({ action: "create_client", targetType: "client", toolUsed: "createClient", targetReference: existing.company_name, error: `A client named "${existing.company_name}" already exists.`, nextStep: "Use a different name or edit the existing client." })
    );
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

  if (invoice.status === "Paid") {
    return wrapWithActionResult(
      actionFailed({ action: "record_payment", targetType: "payment", toolUsed: "recordPayment", targetReference: invoice.invoice_number, error: `Invoice ${invoice.invoice_number} is already fully paid (R${Number(invoice.total).toFixed(2)}).` })
    );
  }

  // Record payment
  const paymentData = {
    invoice_id: invoice.id,
    payment_date: args.paymentDate || today,
    amount: amount,
    payment_method: args.paymentMethod || "EFT",
    reference: args.reference || null,
    notes: args.notes || `Recorded via AI on ${today}`,
  };

  const { error: payErr } = await supabase.from("payments").insert(paymentData);
  if (payErr) {
    return wrapWithActionResult(
      actionFailed({ action: "record_payment", targetType: "payment", toolUsed: "recordPayment", targetReference: invoiceRef, error: payErr.message })
    );
  }

  // Update invoice totals
  const previouslyPaid = Number(invoice.amount_paid) || 0;
  const newTotalPaid = previouslyPaid + amount;
  const invoiceTotal = Number(invoice.total) || 0;
  const newBalance = invoiceTotal - newTotalPaid;

  let newStatus = invoice.status;
  if (newBalance <= 0) {
    newStatus = "Paid";
  } else if (newTotalPaid > 0 && newBalance > 0) {
    newStatus = "Partially Paid";
  }

  const { error: updateErr } = await supabase
    .from("invoices")
    .update({ amount_paid: newTotalPaid, status: newStatus })
    .eq("id", invoice.id);

  if (updateErr) {
    return wrapWithActionResult(
      actionFailed({ action: "record_payment", targetType: "payment", toolUsed: "recordPayment", targetReference: invoiceRef, error: "Payment recorded but invoice update failed: " + updateErr.message })
    );
  }

  const verification = await verifyPayment(supabase, invoice.id, {
    amountPaid: amount,
    expectedStatus: newStatus,
  });

  const clientName = (invoice as any).clients?.company_name || "Unknown";

  return wrapWithActionResult(
    actionSuccess({
      action: "record_payment",
      targetType: "payment",
      targetReference: invoice.invoice_number,
      toolUsed: "recordPayment",
      summary: `Payment of R${amount.toFixed(2)} recorded against ${invoice.invoice_number} (${clientName}). Status: ${newStatus}.`,
      verified: verification.status === "confirmed",
    }),
    {
      payment: {
        invoiceNumber: invoice.invoice_number,
        clientName,
        amountPaid: amount.toFixed(2),
        totalPaid: newTotalPaid.toFixed(2),
        invoiceTotal: invoiceTotal.toFixed(2),
        remainingBalance: Math.max(0, newBalance).toFixed(2),
        newStatus,
        paymentMethod: paymentData.payment_method,
        date: paymentData.payment_date,
      },
      verification,
      currency: "ZAR",
    }
  );
}

async function executeDraftQuote(args: any): Promise<string> {
  const supabase = getSupabase();
  const today = new Date().toISOString().split("T")[0];

  const clientName = String(args.clientName || "").trim();
  if (!clientName) {
    return wrapWithActionResult(
      actionFailed({ action: "draft_quote", targetType: "quote", toolUsed: "draftQuote", error: "Client name is required.", nextStep: "Please provide the client name." })
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

  // Generate quote number via database function (respects prefix, year, starting number settings)
  const { data: quoteNumber, error: numberError } = await supabase.rpc("generate_quote_number");
  if (numberError || !quoteNumber) {
    return wrapWithActionResult(
      actionFailed({ action: "draft_quote", targetType: "quote", toolUsed: "draftQuote", error: `Failed to generate quote number: ${numberError?.message || "No value returned"}` })
    );
  }

  // Default validity days
  const { data: profile } = await supabase.from("business_profile").select("document_settings").maybeSingle();
  const documentSettings = profile?.document_settings || {};
  const validityDays = Number.isFinite(Number(documentSettings.quote_validity_days)) ? Number(documentSettings.quote_validity_days) : 30;
  
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + validityDays);
  const expiryDateString = expiryDate.toISOString().split("T")[0];

  // Calculate totals
  const lineItems = args.lineItems || [];
  let subtotal = 0;
  for (const item of lineItems) {
    subtotal += (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0);
  }
  
  const includeVat = documentSettings.always_include_vat !== false;
  const vatAmount = includeVat ? subtotal * 0.15 : 0;
  const total = subtotal + vatAmount;

  // Insert Quote Header
  const quoteData = {
    quote_number: quoteNumber,
    client_id: client.id,
    issue_date: today,
    expiry_date: expiryDateString,
    status: "Draft",
    subtotal: subtotal,
    vat_amount: vatAmount,
    total: total,
    notes: args.notes || documentSettings.quote_default_notes || "",
    internal_notes: `Drafted by AI on ${today}`
  };

  const { data: newQuote, error: headerErr } = await supabase.from("quotes").insert(quoteData).select("id").single();
  if (headerErr) {
    return wrapWithActionResult(
      actionFailed({ action: "draft_quote", targetType: "quote", toolUsed: "draftQuote", error: `Failed to create quote header: ${headerErr.message}` })
    );
  }

  // Insert Line Items
  if (lineItems.length > 0) {
    const itemsToInsert = lineItems.map((item: any, i: number) => ({
      quote_id: newQuote.id,
      description: item.description,
      quantity: Number(item.quantity) || 1,
      unit_price: Number(item.unitPrice) || 0,
      sort_order: i
    }));
    const { error: lineItemErr } = await supabase.from("quote_line_items").insert(itemsToInsert);
    if (lineItemErr) {
      console.error("[draftQuote] Failed to insert line items:", lineItemErr);
      return wrapWithActionResult(
        actionFailed({ action: "draft_quote", targetType: "quote", toolUsed: "draftQuote", targetReference: quoteNumber, error: `Failed to insert line items: ${lineItemErr.message}` })
      );
    }
  }

  console.log("[draftQuote] Successfully created quote:", quoteNumber, "for client:", client.company_name);

  const verification = await verifyQuote(supabase, newQuote.id, {
    quote_number: quoteNumber,
    lineItemCount: lineItems.length,
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
      quote: { id: newQuote.id, quoteNumber, clientName: client.company_name, total: total.toFixed(2), status: "Draft" },
      verification,
    }
  );
}

async function executeDraftInvoice(args: any): Promise<string> {
  const supabase = getSupabase();
  const today = new Date().toISOString().split("T")[0];

  const clientName = String(args.clientName || "").trim();
  if (!clientName) {
    return wrapWithActionResult(
      actionFailed({ action: "draft_invoice", targetType: "invoice", toolUsed: "draftInvoice", error: "Client name is required.", nextStep: "Please provide the client name." })
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

  // Generate invoice number via database function (respects prefix, year, starting number settings)
  const { data: invoiceNumber, error: numberError } = await supabase.rpc("generate_invoice_number");
  if (numberError || !invoiceNumber) {
    return wrapWithActionResult(
      actionFailed({ action: "draft_invoice", targetType: "invoice", toolUsed: "draftInvoice", error: `Failed to generate invoice number: ${numberError?.message || "No value returned"}` })
    );
  }

  // Default terms
  const { data: profile } = await supabase.from("business_profile").select("document_settings").maybeSingle();
  const documentSettings = profile?.document_settings || {};
  const termsDays = Number.isFinite(Number(documentSettings.invoice_payment_terms_days)) ? Number(documentSettings.invoice_payment_terms_days) : 30;
  
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + termsDays);
  const dueDateString = dueDate.toISOString().split("T")[0];

  // Calculate totals
  const lineItems = args.lineItems || [];
  let subtotal = 0;
  for (const item of lineItems) {
    subtotal += (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0);
  }
  
  const includeVat = documentSettings.always_include_vat !== false;
  const vatAmount = includeVat ? subtotal * 0.15 : 0;
  const total = subtotal + vatAmount;

  // Insert Invoice Header
  const invoiceData = {
    invoice_number: invoiceNumber,
    client_id: client.id,
    issue_date: today,
    due_date: dueDateString,
    status: "Draft",
    subtotal: subtotal,
    vat_amount: vatAmount,
    total: total,
    amount_paid: 0,
    notes: args.notes || documentSettings.invoice_default_notes || "",
    internal_notes: `Drafted by AI on ${today}`,
    is_recurring: !!args.isRecurring,
    recurring_frequency: args.recurringFrequency || null,
    recurring_next_date: args.isRecurring ? today : null, // Set first recurring date to today
  };

  const { data: newInvoice, error: headerErr } = await supabase.from("invoices").insert(invoiceData).select("id").single();
  if (headerErr) {
    return wrapWithActionResult(
      actionFailed({ action: "draft_invoice", targetType: "invoice", toolUsed: "draftInvoice", targetReference: invoiceNumber, error: `Failed to create invoice header: ${headerErr.message}` })
    );
  }

  // Insert Line Items
  if (lineItems.length > 0) {
    const itemsToInsert = lineItems.map((item: any, i: number) => ({
      invoice_id: newInvoice.id,
      description: item.description,
      quantity: Number(item.quantity) || 1,
      unit_price: Number(item.unitPrice) || 0,
      sort_order: i
    }));
    const { error: lineItemErr } = await supabase.from("invoice_line_items").insert(itemsToInsert);
    if (lineItemErr) {
      console.error("[draftInvoice] Failed to insert line items:", lineItemErr);
      return wrapWithActionResult(
        actionFailed({ action: "draft_invoice", targetType: "invoice", toolUsed: "draftInvoice", targetReference: invoiceNumber, error: `Failed to insert line items: ${lineItemErr.message}` })
      );
    }
  }

  console.log("[draftInvoice] Successfully created invoice:", invoiceNumber, "for client:", client.company_name);

  const verification = await verifyInvoice(supabase, newInvoice.id, {
    invoice_number: invoiceNumber,
    client_id: client.id,
    lineItemCount: lineItems.length,
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
      invoice: { id: newInvoice.id, invoiceNumber, clientName: client.company_name, total: total.toFixed(2), status: "Draft" },
      verification,
    }
  );
}

async function executeDraftPurchaseOrder(args: any): Promise<string> {
  const supabase = getSupabase();
  const today = new Date().toISOString().split("T")[0];

  // Generate PO number via database function (respects prefix, year, starting number settings)
  const { data: poNumber, error: numberError } = await supabase.rpc("generate_po_number");
  if (numberError || !poNumber) {
    return wrapWithActionResult(
      actionFailed({ action: "draft_purchase_order", targetType: "purchase_order", toolUsed: "draftPurchaseOrder", error: `Failed to generate purchase order number: ${numberError?.message || "No value returned"}` })
    );
  }

  // Calculate totals
  const lineItems = args.lineItems || [];
  let subtotal = 0;
  for (const item of lineItems) {
    subtotal += (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0);
  }
  const vatAmount = subtotal * 0.15; // Standard 15%
  const total = subtotal + vatAmount;

  const poData = {
    po_number: poNumber,
    supplier_name: args.supplierName,
    date_raised: today,
    status: "Draft",
    subtotal,
    vat_amount: vatAmount,
    total,
    notes: args.notes || ""
  };

  const { data: newPO, error } = await supabase.from("purchase_orders").insert(poData).select("id").single();
  if (error) {
    console.error("[draftPurchaseOrder] Failed to insert PO header:", error);
    return wrapWithActionResult(
      actionFailed({ action: "draft_purchase_order", targetType: "purchase_order", toolUsed: "draftPurchaseOrder", error: error.message })
    );
  }

  if (lineItems.length > 0) {
    const itemsToInsert = lineItems.map((item: any) => ({
      purchase_order_id: newPO.id,
      description: item.description,
      quantity: Number(item.quantity) || 1,
      unit_price: Number(item.unitPrice) || 0,
      line_total: (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0)
    }));
    const { error: lineItemErr } = await supabase.from("purchase_order_items").insert(itemsToInsert);
    if (lineItemErr) {
      console.error("[draftPurchaseOrder] Failed to insert line items:", lineItemErr);
      return wrapWithActionResult(
        actionFailed({ action: "draft_purchase_order", targetType: "purchase_order", toolUsed: "draftPurchaseOrder", targetReference: poNumber, error: `Failed to insert line items: ${lineItemErr.message}` })
      );
    }
  }

  console.log("[draftPurchaseOrder] Successfully created PO:", poNumber, "for supplier:", args.supplierName);

  const verification = await verifyPurchaseOrder(supabase, newPO.id, {
    po_number: poNumber,
    lineItemCount: lineItems.length,
  });

  return wrapWithActionResult(
    actionSuccess({
      action: "draft_purchase_order",
      targetType: "purchase_order",
      targetReference: poNumber,
      toolUsed: "draftPurchaseOrder",
      summary: `PO ${poNumber} created for ${args.supplierName} — R${total.toFixed(2)}`,
      verified: verification.status === "confirmed",
    }),
    { po: { id: newPO.id, poNumber, supplierName: args.supplierName, total: total.toFixed(2) }, verification }
  );
}

async function executeDraftCreditNote(args: any): Promise<string> {
  const supabase = getSupabase();
  const today = new Date().toISOString().split("T")[0];

  // Resolve client — safe exact-match-first lookup
  const clientName = String(args.clientName || "").trim();
  if (!clientName) {
    return wrapWithActionResult(
      actionFailed({ action: "draft_credit_note", targetType: "credit_note", toolUsed: "draftCreditNote", error: "Client name is required.", nextStep: "Please provide the client name." })
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

  // Generate credit note number via database function (respects prefix, year, starting number settings)
  const { data: cnNumber, error: numberError } = await supabase.rpc("generate_credit_note_number");
  if (numberError || !cnNumber) {
    return wrapWithActionResult(
      actionFailed({ action: "draft_credit_note", targetType: "credit_note", toolUsed: "draftCreditNote", error: `Failed to generate credit note number: ${numberError?.message || "No value returned"}` })
    );
  }

  // Calculate totals
  const lineItems = args.lineItems || [];
  let subtotal = 0;
  for (const item of lineItems) {
    subtotal += (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0);
  }
  const vatAmount = subtotal * 0.15;
  const total = subtotal + vatAmount;

  const cnData = {
    cn_number: cnNumber,
    client_id: client.id,
    date_issued: today,
    status: "Draft",
    subtotal,
    vat_amount: vatAmount,
    total,
    reason: args.reason || ""
  };

  const { data: newCN, error } = await supabase.from("credit_notes").insert(cnData).select("id").single();
  if (error) {
    console.error("[draftCreditNote] Failed to insert CN header:", error);
    return wrapWithActionResult(
      actionFailed({ action: "draft_credit_note", targetType: "credit_note", toolUsed: "draftCreditNote", error: error.message })
    );
  }

  if (lineItems.length > 0) {
    const itemsToInsert = lineItems.map((item: any) => ({
      credit_note_id: newCN.id,
      description: item.description,
      quantity: Number(item.quantity) || 1,
      unit_price: Number(item.unitPrice) || 0,
      line_total: (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0)
    }));
    const { error: lineItemErr } = await supabase.from("credit_note_items").insert(itemsToInsert);
    if (lineItemErr) {
      console.error("[draftCreditNote] Failed to insert line items:", lineItemErr);
      return wrapWithActionResult(
        actionFailed({ action: "draft_credit_note", targetType: "credit_note", toolUsed: "draftCreditNote", targetReference: cnNumber, error: `Failed to insert line items: ${lineItemErr.message}` })
      );
    }
  }

  console.log("[draftCreditNote] Successfully created CN:", cnNumber, "for client:", client.company_name);

  const verification = await verifyCreditNote(supabase, newCN.id, {
    cn_number: cnNumber,
    lineItemCount: lineItems.length,
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
    { creditNote: { id: newCN.id, cnNumber, clientName: client.company_name, total: total.toFixed(2) }, verification }
  );
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
  const normalizedHistory = firstUserIndex !== -1 ? geminiHistory.slice(firstUserIndex) : [];

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
  try {
    await requireAuthenticatedUser();

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
    const preferences = parseAssistantPreferences(assistantPreferences);

    // Resolve Gemini API key: stored UI key takes priority over environment variable
    const geminiApiKey = await getActiveApiKey("gemini");
    if (!geminiApiKey) {
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

            let toolResult: string;
            try {
              if (toolName === "logTrip") toolResult = await executeLogTrip(toolArgs);
              else if (toolName === "queryBusinessData") toolResult = await executeQueryBusinessData(toolArgs);
              else if (toolName === "createClient") toolResult = await executeCreateClient(toolArgs);
              else if (toolName === "logExpense") toolResult = await executeLogExpense(toolArgs);
              else if (toolName === "recordPayment") toolResult = await executeRecordPayment(toolArgs);
              else if (toolName === "draftQuote") toolResult = await executeDraftQuote(toolArgs);
              else if (toolName === "draftInvoice") toolResult = await executeDraftInvoice(toolArgs);
              else if (toolName === "draftPurchaseOrder") toolResult = await executeDraftPurchaseOrder(toolArgs);
              else if (toolName === "draftCreditNote") toolResult = await executeDraftCreditNote(toolArgs);
              else if (toolName === "saveMemory") toolResult = await executeSaveMemory(toolArgs);
              else if (toolName === "logFuelPurchase") toolResult = await executeLogFuelPurchase(toolArgs);
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

            const followUpContents = [
              ...contents,
              {
                role: "model",
                parts:
                  payload.functionCallParts?.length
                    ? payload.functionCallParts
                    : [{ functionCall: { name: toolName, args: toolArgs } }],
              },
              { role: "user", parts: [{ functionResponse: { name: toolName, response: JSON.parse(toolResult) } }] },
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
    console.error("Gemini API Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
