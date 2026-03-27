import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { requireAuthenticatedUser, isAuthError } from "@/lib/auth/require-user";
import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getActiveApiKey } from "@/lib/api-keys/resolver";

// Server-side Supabase client for data queries
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}
const CHAT_MODEL = "gemini-3.1-flash-lite-preview";
const TTS_MODEL = "gemini-2.5-flash-preview-tts";
const DEFAULT_VOICE = "Aoede";
const BRITISH_VOICE = "Kore";

const SYSTEM_PROMPT_BASE = `
You are the Touch Teq AI Assistant — an action-oriented business copilot embedded inside the Touch Teq Office dashboard. Touch Teq Engineering is a South African fire and gas detection and control & instrumentation engineering firm based in Johannesburg (Randburg).

## CORE PRINCIPLE — ACT, DON'T NAVIGATE
When you can perform an action directly, DO IT — never ask the user to click a button to do something you can do yourself. Only show navigation tools (openQuotationBuilder, openInvoiceManager, generateCertificate) when a BRAND NEW document needs to be created from scratch AND the user has confirmed the details. For all edits, saves, updates, deletions, and navigation — act immediately and confirm in chat. Never tell the user "tap here" or "click this button" when you can execute the action directly.

## DECISION TREE — Before calling ANY function:

### Step 1: Check Active Document Context
- If an invoice/quote is already open AND the user is asking about that document type → work directly on it. Use addLineItem, updateDocumentField, saveDocument, etc.
- If no document is open AND the user wants to create a new one → follow the extraction flow, then call **draftQuote** or **draftInvoice** to build the document server-side. Do not use openQuotationBuilder unless the user explicitly asks to "open the empty builder".

### Step 2: Map user intent to the correct action
| User says | AI must do |
|---|---|
| "Create a quote for..." | Extract details, confirm, then call draftQuote() |
| "Create an invoice for..." | Extract details, confirm, then call draftInvoice() |
| "Create a certificate" | Extract type, client, site details, confirm, THEN call generateCertificate() |
| "Add a line item" | Call addLineItem() directly — NO navigation (Invoices/Quotes only) |
| "Remove/delete line item" | Call removeLineItem() directly — NO navigation (Invoices/Quotes only) |
| "Change/update/edit [field]" | Call updateDocumentField() or updateLineItem() directly — NO navigation |
| "Save the document" | Call saveDocument() — confirm in chat: "Saved." — NO navigation |
| "Close the document" | Call closeDocument() — confirm in chat: "Document closed." — NO navigation |
| "Open the dashboard" | Call navigateTo() with the destination — NO confirmation needed |
| "Email this document" | Call sendEmail() with pre-filled context |
| "Open [Reference]" | Call openExistingDocument() with the reference number (INV-, QT-, CERT-) |
| "Log a trip" | Call logTrip() with destination, distance, purpose — AI executes directly |
| "Add a client" / "New client" | Call createClient() with company name and contact details — saves directly |
| "Log an expense" / "Record expense" | Call logExpense() with supplier, amount, category, description — saves directly |
| "Record a payment" / "Client paid" | Call recordPayment() with invoice reference and amount — saves directly and updates invoice status |
| "How many invoices...?" / "What is my revenue?" / Any business question | Call queryBusinessData() to fetch real data, then summarise it naturally |

### Step 3: NEVER show a navigation button for an action you can perform directly
Navigation buttons (Open Invoice Manager, Open Quotation Builder, Generate Certificate) must ONLY appear when:
1. The user explicitly asks to create a brand new document AND the document context is not already open
2. A new document has just been created and needs visual review for the first time

For ALL edit, save, close, add, remove, update, and navigation actions — execute directly and confirm in chat. No buttons.

## DATA QUERYING
When the user asks QUESTIONS about their business data — revenue, invoices, quotes, clients, expenses, travel, certificates — call queryBusinessData() with the matching queryType. The system will query the database and return real numbers for you to summarise. Always use this for data questions rather than guessing or making up numbers. Supported queryTypes:
- 'revenue_summary' — total invoiced, outstanding, paid, overdue counts
- 'invoice_list' — list of recent invoices with statuses/amounts
- 'overdue_invoices' — invoices past due date
- 'quote_list' — list of recent quotes
- 'client_list' — all active clients
- 'client_lookup' — find a specific client by name
- 'expense_summary' — total expenses and breakdown
- 'travel_summary' — total trips, distance, fuel costs
- 'certificate_list' — list of certificates
- 'vat_summary' — VAT period data
- 'dashboard_stats' — overview of key business metrics
- 'purchase_order_list' — list of recent purchase orders
- 'credit_note_list' — list of recent credit notes
- 'recurring_invoice_list' — list of setup recurring invoices

## OPERATIONAL FLOW for creating new documents:
1. **Extraction First**: When a user asks to create an invoice or quotation, extract all possible details (client name, line items, quantities, prices).
2. **Conversational Confirmation**: Summarize the extracted data in chat. Example:
   "Got it. Here's what I have for the invoice to [Client]:
   - 3x Optical Flame Detector — R15,000 each
   - Subtotal: R45,000 | VAT (15%): R6,750 | Total: R51,750
   Ready to create — shall I draft it?"
3. **Draft the Document**: Call 'draftQuote' or 'draftInvoice' to generate the document server-side.
4. **Link to Document**: Once drafted, ask if the user wants to open it (e.g., "I've drafted QT-0042. Shall I open it?"). If yes, call 'openExistingDocument'.

## OPERATIONAL FLOW for editing open documents:
1. When the user says things like "add a line item for cable installation at R5000" — call addLineItem() immediately with the details.
2. When the user says "remove the second line item" — call removeLineItem() immediately with index 1.
3. When the user says "change the quantity to 5" or "update the price to R2000" — call updateLineItem() immediately.
4. When multiple items need to be added — call addLineItem() for EACH item. List them all in your response.
5. Confirm each action in chat with updated totals.

## SENDING DOCUMENTS
When the user wants to send a document, you MUST call 'stageEmailForConfirmation'. This triggers a confirmation UI in the app. NEVER send directly. Inform the user they need to click "Confirm Send".

I'm the user's business owner and qualified engineer. Keep responses concise, professional, and action-oriented. Document numbers: Quotations start with 'QT-', Invoices start with 'INV-', Certificates start with 'CERT-'. VAT is 15%. All amounts in R (ZAR).

When drafting technical content, use terminology like: SIL 2/3, flame detection, hazardous area certification, SARS compliance, South African fire regulations (SANS 10139).
`;

type AssistantPreferences = {
  requireConfirmationBeforeSend: boolean;
  conciseResponses: boolean;
  languagePreference: "south_african_english" | "british_english";
  alwaysIncludeVat: boolean;
};

type ActiveDocumentSession = {
  documentType: "invoice" | "quote" | "certificate" | null;
  documentId: string | null;
  documentData: Record<string, any> | null;
  isOpen: boolean;
} | null;

function parseAssistantPreferences(value: any): AssistantPreferences {
  return {
    requireConfirmationBeforeSend: value?.requireConfirmationBeforeSend !== false,
    conciseResponses: value?.conciseResponses !== false,
    languagePreference: value?.languagePreference === "british_english" ? "british_english" : "south_african_english",
    alwaysIncludeVat: value?.alwaysIncludeVat !== false,
  };
}

function buildSystemInstruction(preferences: AssistantPreferences, activeDocumentSession: ActiveDocumentSession) {
  const modeInstruction = preferences.requireConfirmationBeforeSend
    ? `Before any send action, always call 'stageEmailForConfirmation' and wait for explicit confirmation.`
    : `When all required send details are present, call 'stageEmailForConfirmation' immediately so the app can execute send without extra conversational confirmation.`;

  const brevityInstruction = preferences.conciseResponses
    ? `Keep every normal response to a maximum of 3 sentences.`
    : `You may provide full detailed responses when needed.`;

  const languageInstruction =
    preferences.languagePreference === "british_english"
      ? `Use British English spelling and phrasing.`
      : `Use South African English phrasing and local business tone.`;

  const vatInstruction = preferences.alwaysIncludeVat
    ? `For new invoices and quotations, default to including VAT (15%) unless the user explicitly asks to remove it.`
    : `For new invoices and quotations, ask whether VAT (15%) should be included before finalising totals.`;

  let liveSessionInstruction: string;
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

    liveSessionInstruction = `
## ACTIVE DOCUMENT SESSION (CRITICAL)
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
- Confirm each action with a brief summary including updated item count and total.
`;
  } else {
    liveSessionInstruction = `
## NO ACTIVE DOCUMENT
No invoice, quote, or certificate is currently open. If the user wants to create or edit a document:
- For new documents: Extract details (client, type, site, etc.), confirm with user, then call openInvoiceManager, openQuotationBuilder, or generateCertificate.
- For existing documents: Use openExistingDocument() with the reference number (INV-, QT-, CERT-).
- For all other actions: Use addLineItem, updateLineItem, etc. only AFTER a document is open.
`;
  }

  return [SYSTEM_PROMPT_BASE.trim(), modeInstruction, brevityInstruction, languageInstruction, vatInstruction, liveSessionInstruction].join("\n\n");
}

const tools = [
  {
    functionDeclarations: [
      // === SERVER-SIDE DOCUMENT GENERATION ===
      {
        name: "draftQuote",
        description: "Creates a new Quote directly in the database. Use when the user asks to generate, create, or draft a quote. This is completely automated and executes server-side.",
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
        description: "Creates a new Invoice directly in the database. Use when the user asks to generate, create, or draft an invoice. This is completely automated and executes server-side.",
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
        description: "Opens the quotation builder to create a NEW quotation. ONLY call this when no quotation is currently open AND the user has confirmed the details for a new quote. Never call this for edits to an open document.",
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
        description: "Opens the invoice manager to create a NEW invoice. ONLY call this when no invoice is currently open AND the user has confirmed the details for a new invoice. Never call this for edits to an open document.",
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
              description: "Type of query: 'revenue_summary', 'invoice_list', 'overdue_invoices', 'quote_list', 'client_list', 'client_lookup', 'expense_summary', 'travel_summary', 'certificate_list', 'vat_summary', 'dashboard_stats', 'purchase_order_list', 'credit_note_list', 'recurring_invoice_list', 'communication_log'.",
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
    ],
  },
];

// ============================================================
// SERVER-SIDE TOOL EXECUTORS
// ============================================================

// Tools that execute server-side and return data for a follow-up AI call
const SERVER_SIDE_TOOLS = new Set(["queryBusinessData", "logTrip", "createClient", "logExpense", "recordPayment", "draftQuote", "draftInvoice", "draftPurchaseOrder", "draftCreditNote"]);

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
    return JSON.stringify({ success: false, error: "No active vehicle found. Add a vehicle in Travel Settings first." });
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

  // Match client if provided
  let clientId = null;
  if (args.clientName) {
    const { data: clientData } = await supabase
      .from("clients")
      .select("id")
      .ilike("company_name", `%${String(args.clientName).trim()}%`)
      .limit(1)
      .single();
    if (clientData) clientId = clientData.id;
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

  const { error } = await supabase.from("travel_trips").insert(tripData);

  if (error) {
    return JSON.stringify({ success: false, error: error.message });
  }

  return JSON.stringify({
    success: true,
    trip: {
      date: tripData.date,
      from: tripData.from_location,
      to: tripData.to_location,
      distanceKm,
      purpose: tripData.purpose,
      odometerStart: tripData.odometer_start,
      odometerEnd: tripData.odometer_end,
    },
  });
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
          .select("id, company_name, contact_person, email, phone")
          .eq("is_active", true)
          .order("company_name")
          .limit(limit);

        return JSON.stringify({ clients: data || [], count: (data || []).length });
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
        const clientId = filters.clientId;
        let query = supabase
          .from("client_communications")
          .select("*")
          .order("timestamp", { ascending: false })
          .limit(limit);

        if (clientId) query = query.eq("client_id", clientId);
        
        const { data } = await query;
        return JSON.stringify({ communications: data || [], count: (data || []).length });
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
    return JSON.stringify({ success: false, error: "Company name is required." });
  }

  // Check for duplicates
  const { data: existing } = await supabase
    .from("clients")
    .select("id, company_name")
    .ilike("company_name", companyName)
    .limit(1)
    .maybeSingle();

  if (existing) {
    return JSON.stringify({
      success: false,
      error: `A client named "${existing.company_name}" already exists.`,
      existingClientId: existing.id,
    });
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
    return JSON.stringify({ success: false, error: error.message });
  }

  return JSON.stringify({
    success: true,
    client: {
      id: data.id,
      companyName: data.company_name,
      contactPerson: clientData.contact_person,
      email: clientData.email,
      phone: clientData.phone,
    },
  });
}

async function executeLogExpense(args: any): Promise<string> {
  const supabase = getSupabase();
  const today = new Date().toISOString().split("T")[0];

  const supplierName = String(args.supplierName || "").trim();
  const description = String(args.description || "").trim();
  const amountInclusive = Number(args.amountInclusive) || 0;

  if (!supplierName || !description || amountInclusive <= 0) {
    return JSON.stringify({ success: false, error: "Supplier name, description, and a positive amount are required." });
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
    return JSON.stringify({ success: false, error: error.message });
  }

  return JSON.stringify({
    success: true,
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
    currency: "ZAR",
  });
}

async function executeRecordPayment(args: any): Promise<string> {
  const supabase = getSupabase();
  const today = new Date().toISOString().split("T")[0];

  const invoiceRef = String(args.invoiceReference || "").trim().toUpperCase();
  const amount = Number(args.amount) || 0;

  if (!invoiceRef || amount <= 0) {
    return JSON.stringify({ success: false, error: "Invoice reference and a positive payment amount are required." });
  }

  // Look up the invoice
  const { data: invoice, error: lookupErr } = await supabase
    .from("invoices")
    .select("id, invoice_number, total, amount_paid, balance_due, status, clients(company_name)")
    .ilike("invoice_number", invoiceRef)
    .limit(1)
    .maybeSingle();

  if (lookupErr || !invoice) {
    return JSON.stringify({ success: false, error: `Invoice "${invoiceRef}" not found. Please check the reference.` });
  }

  if (invoice.status === "Paid") {
    return JSON.stringify({
      success: false,
      error: `Invoice ${invoice.invoice_number} is already fully paid (R${Number(invoice.total).toFixed(2)}).`,
    });
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
    return JSON.stringify({ success: false, error: payErr.message });
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
    return JSON.stringify({
      success: true,
      warning: "Payment recorded but invoice update failed: " + updateErr.message,
    });
  }

  const clientName = (invoice as any).clients?.company_name || "Unknown";

  return JSON.stringify({
    success: true,
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
    currency: "ZAR",
  });
}

async function executeDraftQuote(args: any): Promise<string> {
  const supabase = getSupabase();
  const today = new Date().toISOString().split("T")[0];

  const clientName = String(args.clientName || "").trim();
  if (!clientName) {
    return JSON.stringify({ success: false, error: "Client name is required." });
  }

  // Find Client
  const { data: client } = await supabase
    .from("clients")
    .select("id, company_name")
    .ilike("company_name", `%${clientName}%`)
    .limit(1)
    .maybeSingle();

  if (!client) {
    return JSON.stringify({ success: false, error: `Could not find a client matching "${clientName}". Please create the client first.` });
  }

  // Get next quote number
  const { count } = await supabase.from("quotes").select("*", { count: "exact", head: true });
  const quoteNumber = `QT-${String((count || 0) + 1).padStart(4, "0")}`;

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
    return JSON.stringify({ success: false, error: `Failed to create quote header: ${headerErr.message}` });
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
    await supabase.from("quote_line_items").insert(itemsToInsert);
  }

  return JSON.stringify({
    success: true,
    quote: { id: newQuote.id, quoteNumber, clientName: client.company_name, total: total.toFixed(2), status: "Draft" }
  });
}

async function executeDraftInvoice(args: any): Promise<string> {
  const supabase = getSupabase();
  const today = new Date().toISOString().split("T")[0];

  const clientName = String(args.clientName || "").trim();
  if (!clientName) {
    return JSON.stringify({ success: false, error: "Client name is required." });
  }

  // Find Client
  const { data: client } = await supabase
    .from("clients")
    .select("id, company_name")
    .ilike("company_name", `%${clientName}%`)
    .limit(1)
    .maybeSingle();

  if (!client) {
    return JSON.stringify({ success: false, error: `Could not find a client matching "${clientName}". Please create the client first.` });
  }

  // Get next invoice number
  const { count } = await supabase.from("invoices").select("*", { count: "exact", head: true });
  const invoiceNumber = `INV-${String((count || 0) + 1).padStart(4, "0")}`;

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
    return JSON.stringify({ success: false, error: `Failed to create invoice header: ${headerErr.message}` });
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
    await supabase.from("invoice_line_items").insert(itemsToInsert);
  }

  return JSON.stringify({
    success: true,
    invoice: { id: newInvoice.id, invoiceNumber, clientName: client.company_name, total: total.toFixed(2), status: "Draft" }
  });
}

async function executeDraftPurchaseOrder(args: any): Promise<string> {
  const supabase = getSupabase();
  const today = new Date().toISOString().split("T")[0];

  // Logic to generate PO number
  const year_str = new Date().getFullYear().toString();
  const { data: latestPO } = await supabase
    .from("purchase_orders")
    .select("po_number")
    .like("po_number", `PO-${year_str}-%`)
    .order("po_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  let nextNum = 1;
  if (latestPO) {
    const match = latestPO.po_number.match(/PO-\d{4}-(\d{4})/);
    if (match) nextNum = parseInt(match[1]) + 1;
  }
  const poNumber = `PO-${year_str}-${String(nextNum).padStart(4, '0')}`;

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
  if (error) return JSON.stringify({ success: false, error: error.message });

  if (lineItems.length > 0) {
    const itemsToInsert = lineItems.map((item: any) => ({
      purchase_order_id: newPO.id,
      description: item.description,
      quantity: Number(item.quantity) || 1,
      unit_price: Number(item.unitPrice) || 0,
      line_total: (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0)
    }));
    await supabase.from("purchase_order_items").insert(itemsToInsert);
  }

  return JSON.stringify({ success: true, po: { id: newPO.id, poNumber, supplierName: args.supplierName, total: total.toFixed(2) } });
}

async function executeDraftCreditNote(args: any): Promise<string> {
  const supabase = getSupabase();
  const today = new Date().toISOString().split("T")[0];

  // Resolve client
  const { data: client } = await supabase.from("clients").select("id, company_name").ilike("company_name", `%${args.clientName}%`).limit(1).maybeSingle();
  if (!client) return JSON.stringify({ success: false, error: "Client not found." });

  // Logic to generate CN number
  const year_str = new Date().getFullYear().toString();
  const { data: latestCN } = await supabase
    .from("credit_notes")
    .select("cn_number")
    .like("cn_number", `CN-${year_str}-%`)
    .order("cn_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  let nextNum = 1;
  if (latestCN) {
    const match = latestCN.cn_number.match(/CN-\d{4}-(\d{4})/);
    if (match) nextNum = parseInt(match[1]) + 1;
  }
  const cnNumber = `CN-${year_str}-${String(nextNum).padStart(4, '0')}`;

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
  if (error) return JSON.stringify({ success: false, error: error.message });

  if (lineItems.length > 0) {
    const itemsToInsert = lineItems.map((item: any) => ({
      credit_note_id: newCN.id,
      description: item.description,
      quantity: Number(item.quantity) || 1,
      unit_price: Number(item.unitPrice) || 0,
      line_total: (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0)
    }));
    await supabase.from("credit_note_items").insert(itemsToInsert);
  }

  return JSON.stringify({ success: true, creditNote: { id: newCN.id, cnNumber, clientName: client.company_name, total: total.toFixed(2) } });
}

function normalizeHistory(history: any[] | undefined, message: string) {
  const geminiHistory = (history || []).map((msg: any) => ({
    role: msg.sender === "user" ? "user" : "model",
    parts: [{ text: msg.text }],
  }));

  const firstUserIndex = geminiHistory.findIndex((m: any) => m.role === "user");
  const normalizedHistory = firstUserIndex !== -1 ? geminiHistory.slice(firstUserIndex) : [];

  return [...normalizedHistory, { role: "user", parts: [{ text: message }] }];
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

  return {
    text: text || "",
    audio: audioBase64,
    audioBase64,
    audioMimeType: audioFromParts.audioMimeType,
    toolCall,
    toolCalls: allToolCalls.length > 0 ? allToolCalls : toolCall ? [toolCall] : [],
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

export async function POST(req: NextRequest) {
  try {
    await requireAuthenticatedUser();

    const body = await req.json();
    const { history, message, wantsAudio = false, assistantPreferences, activeDocumentSession = null } = body;
    const preferences = parseAssistantPreferences(assistantPreferences);

    // Resolve Gemini API key: stored UI key takes priority over environment variable
    const geminiApiKey = await getActiveApiKey("gemini");
    if (!geminiApiKey) {
      return NextResponse.json({ error: "Gemini API key is not configured. Please add your API key in Settings → API Keys." }, { status: 401 });
    }

    // Create a per-request GoogleGenAI instance with the resolved key
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });

    if (!message) throw new Error("Missing message in request body");

    const systemInstruction = buildSystemInstruction(preferences, activeDocumentSession);
    const contents = normalizeHistory(history, message);

    const response = await ai.models.generateContent({
      model: CHAT_MODEL,
      contents,
      config: {
        responseModalities: ["TEXT"],
        tools: tools as any,
      },
      systemInstruction,
    } as any);

    let payload = extractPayload(response);

    // ──────────────────────────────────────────────────
    // SERVER-SIDE TOOL EXECUTION LOOP
    // If the AI calls a server-side tool, execute it,
    // then feed results back to the AI for a natural
    // language summary.
    // ──────────────────────────────────────────────────
    if (payload.toolCall && SERVER_SIDE_TOOLS.has(payload.toolCall.name)) {
      const toolName = payload.toolCall.name;
      const toolArgs = payload.toolCall.args || {};

      let toolResult: string;
      try {
        if (toolName === "logTrip") {
          toolResult = await executeLogTrip(toolArgs);
        } else if (toolName === "queryBusinessData") {
          toolResult = await executeQueryBusinessData(toolArgs);
        } else if (toolName === "createClient") {
          toolResult = await executeCreateClient(toolArgs);
        } else if (toolName === "logExpense") {
          toolResult = await executeLogExpense(toolArgs);
        } else if (toolName === "recordPayment") {
          toolResult = await executeRecordPayment(toolArgs);
        } else if (toolName === "draftQuote") {
          toolResult = await executeDraftQuote(toolArgs);
        } else if (toolName === "draftInvoice") {
          toolResult = await executeDraftInvoice(toolArgs);
        } else if (toolName === "draftPurchaseOrder") {
          toolResult = await executeDraftPurchaseOrder(toolArgs);
        } else if (toolName === "draftCreditNote") {
          toolResult = await executeDraftCreditNote(toolArgs);
        } else {
          toolResult = JSON.stringify({ error: "Unknown server-side tool" });
        }
      } catch (err: any) {
        toolResult = JSON.stringify({ error: err.message || "Tool execution failed" });
      }

      // Build a follow-up conversation with the tool result
      const followUpContents = [
        ...contents,
        {
          role: "model",
          parts: [
            {
              functionCall: {
                name: toolName,
                args: toolArgs,
              },
            },
          ],
        },
        {
          role: "user",
          parts: [
            {
              functionResponse: {
                name: toolName,
                response: JSON.parse(toolResult),
              },
            },
          ],
        },
      ];

      const followUpResponse = await ai.models.generateContent({
        model: CHAT_MODEL,
        contents: followUpContents,
        config: {
          responseModalities: ["TEXT"],
          tools: tools as any,
        },
        systemInstruction,
      } as any);

      const followUpPayload = extractPayload(followUpResponse);

      // If the follow-up also calls a server-side tool, just return the raw result
      // (prevents infinite loops). Otherwise use the natural language response.
      if (followUpPayload.toolCall && SERVER_SIDE_TOOLS.has(followUpPayload.toolCall.name)) {
        // Prevent recursion — return the data as text
        const parsed = JSON.parse(toolResult);
        payload = {
          ...payload,
          text: parsed.error
            ? `Sorry, there was an issue: ${parsed.error}`
            : `Here's what I found: ${toolResult}`,
          toolCall: null,
          toolCalls: [],
        };
      } else {
        // Use the AI's natural language summary, but preserve any client-side tool call
        payload = {
          ...followUpPayload,
          // If the follow-up calls a client-side tool, keep it
          toolCall: followUpPayload.toolCall || null,
          toolCalls: followUpPayload.toolCalls || [],
        };
      }
    }

    const shouldSynthesizeAudio = Boolean(wantsAudio && payload.text && !payload.toolCall);
    const speechPayload = shouldSynthesizeAudio
      ? await synthesizeSpeech(ai, payload.text, preferences.languagePreference)
      : null;

    return NextResponse.json({
      ...payload,
      audio: speechPayload?.audioBase64 || payload.audioBase64 || "",
      audioBase64: speechPayload?.audioBase64 || payload.audioBase64 || "",
      audioMimeType: speechPayload?.audioMimeType || payload.audioMimeType || "audio/wav",
    });
  } catch (error: any) {
    if (isAuthError(error)) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    console.error("Gemini API Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
