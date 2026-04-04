// Using any type to match the pattern in the original route.ts which uses
// parametersJsonSchema property that may not be in the official type definitions
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const functionDeclarations: any[] = [
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
  // === TASKS ===
  {
    name: "createTask",
    description: "Creates a new task or to-do item. Use this when the user asks to create a task, add a to-do, set a reminder, or when they say things like 'remind me to...', 'I need to...', 'don't forget to...', 'schedule...', or 'add to my list...'.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "The task title — a clear, concise description of what needs to be done." },
        description: { type: "string", description: "Optional longer description with additional details or context." },
        priority: { type: "string", enum: ["low", "medium", "high", "urgent"], description: "Task priority. Default to 'medium' if the user does not specify. Use 'urgent' only if the user explicitly says urgent, critical, or ASAP. Use 'high' if they say important or high priority." },
        dueDate: { type: "string", description: "Due date in YYYY-MM-DD format. Interpret natural language: 'tomorrow', 'next Tuesday', 'end of the week', 'next month', etc. If the user says 'remind me' with a date, use that as the due date." },
        dueTime: { type: "string", description: "Optional due time in HH:MM format (24-hour). Only set if the user specifies a specific time." },
        category: { type: "string", description: "Task category. Common categories: Admin, Site Visit, Follow-up, Procurement, Documentation, Maintenance, Client Communication, Invoicing, Safety. Infer from context if not explicitly stated." },
        clientName: { type: "string", description: "Client name to link the task to, if the task relates to a specific client. Will be looked up by name." },
        tags: { type: "array", items: { type: "string" }, description: "Optional tags for the task." },
        notes: { type: "string", description: "Optional additional notes." }
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
        taskIdentifier: { type: "string", description: "The task title or a description that identifies the task. Will be searched by title." },
        title: { type: "string", description: "New title, if changing." },
        description: { type: "string", description: "New description, if changing." },
        priority: { type: "string", enum: ["low", "medium", "high", "urgent"], description: "New priority, if changing." },
        status: { type: "string", enum: ["todo", "in_progress", "done", "cancelled"], description: "New status, if changing." },
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
        taskIdentifier: { type: "string", description: "The task title or description that identifies the task." }
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
        queryType: { type: "string", enum: ["today", "overdue", "this_week", "all_open", "by_priority", "by_client", "by_category", "stats", "search"], description: "The type of query to run." },
        priority: { type: "string", enum: ["low", "medium", "high", "urgent"], description: "Filter by priority (for by_priority query)." },
        clientName: { type: "string", description: "Client name to filter by (for by_client query)." },
        category: { type: "string", description: "Category to filter by (for by_category query)." },
        searchTerm: { type: "string", description: "Search term for task titles and descriptions (for search query)." }
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
        taskIdentifier: { type: "string", description: "The task title or description that identifies the task to delete." }
      },
      required: ["taskIdentifier"]
    },
  },
  // === NOTES ===
  {
    name: "createNote",
    description: "Creates a new note. Use this when the user says 'take a note', 'note that...', 'jot down...', 'write down...', 'remember that...', or describes something they want to record. For phone calls, use note_type 'call'. For meetings, use 'meeting'. For site visits, use 'site_visit'. For quick one-liners, use 'quick'. For everything else, use 'general'.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Optional title for the note. Generate a short descriptive title if the user does not provide one." },
        content: { type: "string", description: "The note content. Capture what the user said, organized clearly. For call notes, structure as: who was called, what was discussed, outcomes. For site visits: site name, observations, action items." },
        noteType: { type: "string", enum: ["general", "call", "meeting", "site_visit", "quick"], description: "The type of note. Infer from context: if the user mentions a phone call, use 'call'. If they mention a meeting, use 'meeting'. If they mention a site visit or being on site, use 'site_visit'. If it is a brief note or reminder-style, use 'quick'. Default to 'general'." },
        contactName: { type: "string", description: "For call/meeting notes: the name of the person contacted or who attended." },
        contactPhone: { type: "string", description: "For call notes: the phone number if mentioned." },
        callDirection: { type: "string", enum: ["inbound", "outbound"], description: "For call notes: whether the call was inbound or outbound." },
        meetingAttendees: { type: "array", items: { type: "string" }, description: "For meeting notes: list of attendee names." },
        siteName: { type: "string", description: "For site visit notes: the name of the site." },
        clientName: { type: "string", description: "Client to link this note to, if it relates to a specific client." },
        followUpRequired: { type: "boolean", description: "Whether a follow-up action is needed. Set to true if the user mentions needing to follow up, get back to someone, or take further action." },
        followUpDate: { type: "string", description: "If follow-up is required, the date by which it should happen (YYYY-MM-DD). Interpret natural language dates." },
        followUpNotes: { type: "string", description: "Brief description of the follow-up action needed." },
        tags: { type: "array", items: { type: "string" }, description: "Optional tags for categorising the note." }
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
        searchTerm: { type: "string", description: "Text to search for in note titles and content." },
        noteType: { type: "string", enum: ["general", "call", "meeting", "site_visit", "quick", "all"], description: "Filter by note type. Default to 'all'." },
        clientName: { type: "string", description: "Filter notes by client name." },
        followUpPending: { type: "boolean", description: "If true, only return notes with pending (not completed) follow-ups." },
        limit: { type: "number", description: "Maximum number of notes to return. Default 10." }
      },
      required: [],
    },
  },
  {
    name: "logCallNote",
    description: "Quickly logs a phone call note. Use this when the user explicitly mentions a phone call: 'just got off the phone with...', 'called [person/company]...', 'log a call with...', '[person] called about...'. This is a shortcut that pre-sets the note type to 'call'.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        contactName: { type: "string", description: "Who the call was with." },
        clientName: { type: "string", description: "The client company, if applicable." },
        callDirection: { type: "string", enum: ["inbound", "outbound"], description: "Whether the user called them (outbound) or they called the user (inbound). Infer from context: 'I called' = outbound, 'they called' or '[person] called' = inbound." },
        content: { type: "string", description: "What was discussed, decisions made, outcomes, and any action items. Structure the content clearly." },
        followUpRequired: { type: "boolean", description: "Whether follow-up is needed." },
        followUpDate: { type: "string", description: "Follow-up date if needed (YYYY-MM-DD)." },
        followUpNotes: { type: "string", description: "What the follow-up should involve." }
      },
      required: ["contactName", "content"]
    },
  },
  // === CALENDAR ===
  {
    name: "createCalendarEvent",
    description: "Creates a new calendar event or appointment. Use this when the user asks to schedule a meeting, add an appointment, block time, set up a call, or when they say 'book...', 'schedule...', 'set up...', 'add to calendar...', or 'I have a meeting with...'.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "The event title — what the event is called." },
        description: { type: "string", description: "Optional longer description with additional details." },
        eventType: { type: "string", enum: ["appointment", "meeting", "site_visit", "deadline", "reminder", "travel", "other"], description: "Type of event. Default to 'appointment' if not specified." },
        startDate: { type: "string", description: "Start date in YYYY-MM-DD format. Interpret natural language: 'tomorrow', 'next Tuesday', 'next week', etc." },
        startTime: { type: "string", description: "Start time in HH:MM format (24-hour). Only set if the user specifies a specific time." },
        endDate: { type: "string", description: "End date in YYYY-MM-DD format. If not set, defaults to start date." },
        endTime: { type: "string", description: "End time in HH:MM format (24-hour)." },
        allDay: { type: "boolean", description: "Whether this is an all-day event. Default false." },
        location: { type: "string", description: "Where the event takes place." },
        clientName: { type: "string", description: "Client name to link the event to, if applicable. Will be looked up by name." },
        status: { type: "string", enum: ["scheduled", "completed", "cancelled", "rescheduled"], description: "Event status. Default to 'scheduled'." },
        colour: { type: "string", description: "Event colour in hex format (e.g., '#3B82F6'). Optional." },
        notes: { type: "string", description: "Internal/private notes about the event." }
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
        startDate: { type: "string", description: "Start date in YYYY-MM-DD format. If not set, defaults to today." },
        endDate: { type: "string", description: "End date in YYYY-MM-DD format. If not set, defaults to start date." },
        eventType: { type: "string", enum: ["appointment", "meeting", "site_visit", "deadline", "reminder", "travel", "other"], description: "Filter by event type." },
        clientName: { type: "string", description: "Filter events by client name." },
        status: { type: "string", enum: ["scheduled", "completed", "cancelled", "rescheduled"], description: "Filter by event status." },
        limit: { type: "number", description: "Maximum number of events to return. Default 20." }
      },
      required: [],
    },
  },
  {
    name: "updateCalendarEvent",
    description: "Updates an existing calendar event. Use this when the user asks to change an event's time, location, title, status, or any other field.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        eventIdentifier: { type: "string", description: "The event title or description that identifies the event. Will be searched by title." },
        title: { type: "string", description: "New event title." },
        description: { type: "string", description: "New description." },
        eventType: { type: "string", enum: ["appointment", "meeting", "site_visit", "deadline", "reminder", "travel", "other"], description: "New event type." },
        startDate: { type: "string", description: "New start date in YYYY-MM-DD format." },
        startTime: { type: "string", description: "New start time in HH:MM format." },
        endDate: { type: "string", description: "New end date in YYYY-MM-DD format." },
        endTime: { type: "string", description: "New end time in HH:MM format." },
        allDay: { type: "boolean", description: "Whether this is an all-day event." },
        location: { type: "string", description: "New location." },
        status: { type: "string", enum: ["scheduled", "completed", "cancelled", "rescheduled"], description: "New status." },
        notes: { type: "string", description: "New internal notes." }
      },
      required: ["eventIdentifier"]
    },
  },
  // === REMINDERS ===
  {
    name: "createReminder",
    description: "Creates a new reminder or follow-up. Use this when the user asks to set a reminder, be reminded about something, follow up on something, or says 'remind me to...', 'don't forget to...', 'I need to follow up on...'.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "The reminder title — what needs to be reminded." },
        description: { type: "string", description: "Optional longer description with additional details." },
        reminderType: { type: "string", enum: ["task", "follow_up", "meeting", "call", "custom"], description: "Type of reminder. Default to 'custom' if not specified." },
        reminderAt: { type: "string", description: "When the reminder should trigger in ISO 8601 format. Interpret natural language: 'tomorrow at 9am', 'next Friday at 2pm', 'in 30 minutes'." },
        clientName: { type: "string", description: "Client name to link the reminder to, if applicable. Will be looked up by name." },
        isRecurring: { type: "boolean", description: "Whether this is a recurring reminder. Default false." },
        recurringFrequency: { type: "string", enum: ["daily", "weekly", "monthly", "yearly"], description: "If recurring, how often." }
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
        status: { type: "string", enum: ["pending", "completed", "cancelled", "all"], description: "Filter by status. Default to 'pending'." },
        startDate: { type: "string", description: "Start date in YYYY-MM-DD format." },
        endDate: { type: "string", description: "End date in YYYY-MM-DD format." },
        reminderType: { type: "string", enum: ["task", "follow_up", "meeting", "call", "custom"], description: "Filter by reminder type." },
        clientName: { type: "string", description: "Filter reminders by client name." },
        limit: { type: "number", description: "Maximum number of reminders to return. Default 20." }
      },
      required: [],
    },
  },
  {
    name: "updateReminder",
    description: "Updates an existing reminder. Use this when the user asks to change a reminder's time, reschedule it, or mark it complete.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        reminderIdentifier: { type: "string", description: "The reminder title that identifies the reminder. Will be searched by title." },
        title: { type: "string", description: "New reminder title." },
        description: { type: "string", description: "New description." },
        reminderAt: { type: "string", description: "New reminder time in ISO 8601 format." },
        reminderType: { type: "string", enum: ["task", "follow_up", "meeting", "call", "custom"], description: "New reminder type." },
        status: { type: "string", enum: ["pending", "completed", "cancelled"], description: "New status. Use 'completed' to mark as done, 'cancelled' to cancel." },
        snoozeMinutes: { type: "number", description: "Snooze the reminder by this many minutes." }
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
        date: { type: "string", description: "Date to query in YYYY-MM-DD format. Defaults to today." },
        includeOverdue: { type: "boolean", description: "Include overdue items. Default true." },
        includeReminders: { type: "boolean", description: "Include reminders. Default true." },
        includeCalendar: { type: "boolean", description: "Include calendar events. Default true." }
      },
      required: [],
    },
  },
  {
    name: "convertNoteToTasks",
    description: "Converts a note into one or more tasks. Use this when the user asks to 'convert this note to tasks', 'create tasks from this note', 'turn this note into a to-do list', or when the user mentions action items in a note that should become tasks.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        noteIdentifier: { type: "string", description: "The note title or content that identifies the note to convert. Search by title or content." },
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
  }
];

export const tools = [{ functionDeclarations }];
export const SERVER_SIDE_TOOLS = new Set([
  "queryBusinessData", "logTrip", "createClient", "updateClient", "addClientCommunication", "createClientContact", "updateClientContact", "logExpense", "recordPayment", "draftQuote", "draftInvoice", "draftPurchaseOrder", "draftCreditNote", "saveMemory", "logFuelPurchase", "updateInvoiceStatus", "updatePurchaseOrderStatus", "updateCreditNoteStatus", "markInvoicePaid", "voidInvoice", "markInvoiceSent", "reopenInvoice", "markQuoteSent", "acceptQuote", "declineQuote", "expireQuote", "reopenQuote", "rejectQuote", "issueQuote", "markPOSent", "acknowledgePO", "markPODelivered", "cancelPO", "issueCreditNote", "sendCreditNote", "applyCreditNote", "cancelCreditNote", "transitionDocumentStatus", "convertQuoteToInvoice", "createTask", "updateTask", "completeTask", "queryTasks", "deleteTask", "createNote", "searchNotes", "logCallNote", "createCalendarEvent", "queryCalendarEvents", "updateCalendarEvent", "createReminder", "queryReminders", "updateReminder", "queryAgenda", "convertNoteToTasks"
]);

export function isServerSideTool(toolName: string): boolean {
  return SERVER_SIDE_TOOLS.has(toolName);
}