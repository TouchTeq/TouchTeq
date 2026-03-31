Yes — **I would change the prompt**.

Your clarification matters a lot.

The prompt I gave before was aimed at the **AI inside the dashboard** to audit itself at runtime.

But now that you’ve explained it properly, what you actually need is a prompt for the **AI that is building the dashboard / website** — the one with access to the codebase, app structure, database schema, routes, actions, prompts, and integrations.

So the correct move is:

- **Do not use the previous prompt as-is**
- Use a **codebase/architecture audit prompt** instead

That AI should tell you:
- what the dashboard actually has,
- what the integrated AI is wired to do,
- what backend actions exist,
- what actions are missing,
- why it says “done” when nothing happened,
- where prompts need improvement,
- and what code changes are needed.

---

# Revised Prompt for the AI Building the Dashboard

You can paste this directly into the AI that is developing the website/dashboard.

```text
You are auditing the codebase and architecture of this website/dashboard application.

Your task is to produce a precise technical audit of:
1. the dashboard’s current features,
2. the integrated AI’s actual capabilities,
3. the backend actions/functions available to the integrated AI,
4. the failure points causing the AI to say tasks are done when they are not,
5. what is missing for reliable execution,
6. and what should be improved in prompts, logic, tools, and workflows.

IMPORTANT RULES

- Do NOT guess.
- Base your answer only on what you can inspect in the codebase, configuration, schema, routes, API handlers, server actions, tools, prompts, and UI components.
- If something appears in the UI but has no backend implementation, say so clearly.
- If something exists in the backend but is not exposed to the integrated AI, say so clearly.
- If a workflow is partial or broken, explain exactly where it breaks.
- If you are unsure, say “Unknown”.
- Be brutally honest.
- Do not give marketing language or generic advice.
- I want a real engineering-style audit.

YOUR OBJECTIVE

I need a full understanding of how this dashboard currently works, especially the integrated AI.

Focus especially on:
- invoices,
- credit notes,
- purchase orders,
- notes,
- tasks,
- planning/day organisation features,
- reminders,
- emails,
- WhatsApp,
- and any AI-assisted workflows.

I also want you to inspect the integrated AI implementation in detail:
- its system prompt,
- action/tool definitions,
- available function calls,
- guardrails,
- response handling,
- backend execution flow,
- verification flow,
- and failure behaviour.

Please inspect:
- routes/pages
- components
- API routes
- server actions
- database schema/models
- tool/function definitions used by the integrated AI
- prompt files/config
- integration services
- auth/permissions
- state management
- logs/error handling if available

OUTPUT FORMAT

==================================================
1. APPLICATION OVERVIEW
==================================================

Summarise:
- what this application is,
- what modules/features exist,
- the major architecture pattern,
- frontend framework,
- backend/API structure,
- database/ORM if identifiable,
- auth/roles if identifiable,
- how the integrated AI is wired into the system.

Use this structure:

- App type:
- Frontend stack:
- Backend/API stack:
- Database/ORM:
- Auth/roles:
- AI integration approach:
- Confidence level (High / Medium / Low):

Also include:
- Key folders/files inspected:
- Key limitations in what you were able to inspect:

==================================================
2. DASHBOARD FEATURE INVENTORY
==================================================

List every user-facing dashboard feature/module you can identify from the codebase.

Use this table:

| Module / Feature | Present in UI? | Backend implemented? | Database support? | AI can access it? | Status | Evidence (file names / functions / routes) |
|------------------|----------------|----------------------|-------------------|------------------|--------|--------------------------------------------|

Status must be one of:
- Fully implemented
- Partially implemented
- UI only
- Backend only
- Stub / placeholder
- Unknown

Check specifically for:
- Dashboard home
- Clients / customer management
- Quotations
- Invoices
- Credit notes
- Purchase orders
- Suppliers
- Projects / jobs
- Tasks
- Calendar / day planner
- Notes / call notes
- Documents / uploads
- Reports / analytics
- Settings
- User management
- AI assistant
- Email integration
- WhatsApp integration
- Notifications / reminders
- Approval workflow
- Asset register
- Job cards / site visits

==================================================
3. INTEGRATED AI ARCHITECTURE AUDIT
==================================================

Inspect the integrated AI implementation and explain exactly how it works.

Answer all of the following:

A. Where is the integrated AI defined?
B. What prompt/system instruction does it currently use?
C. What tools/actions/functions can it call?
D. How are tool calls executed?
E. Does it operate by:
   - plain text only,
   - frontend simulation,
   - API calls,
   - server actions,
   - direct DB writes,
   - or some other pattern?
F. How does it know whether an action succeeded?
G. Does it have a verification step after execution?
H. Does it have access to record IDs or only user text?
I. Does it return structured statuses or free-form text?
J. Is there any guard against false “done” responses?

Then provide this table:

| AI Capability Area | Current Implementation | Evidence | Risk Level | Notes |
|--------------------|------------------------|----------|------------|------|

Include:
- prompting
- tool calling
- action execution
- action verification
- error handling
- retry logic
- permission handling
- record lookup
- state awareness
- logging/audit trail

==================================================
4. ACTION / TOOL CAPABILITY MATRIX FOR THE INTEGRATED AI
==================================================

List every action/tool/function the integrated AI can actually use.

Use this table:

| Tool / Function Name | Purpose | Inputs Required | What It Actually Does | Can It Modify Data? | Can It Verify Success? | Failure Modes | Evidence |
|----------------------|---------|-----------------|------------------------|---------------------|------------------------|---------------|----------|

Then group them by module if possible:
- invoices
- credit notes
- purchase orders
- clients
- notes
- tasks
- calendar
- documents
- messages
- reports

==================================================
5. INVOICE WORKFLOW DEEP DIVE
==================================================

This section is critical.

Trace the full invoice workflow from UI to backend to database to AI.

I need to know:

1. How invoices are created
2. How invoices are edited
3. How invoice status is stored
4. What statuses exist
5. Whether “close invoice” is a real supported action
6. Whether closing requires preconditions (e.g. paid status)
7. Whether the integrated AI can trigger invoice close
8. Whether close is actually persisted in the database
9. Whether the UI refreshes correctly after the action
10. What causes invoice-related failures

Use this format:

- Invoice schema/model:
- Invoice status field:
- Allowed statuses:
- Invoice create flow:
- Invoice edit flow:
- Invoice close flow:
- Preconditions for close:
- AI access to close action:
- Verification method:
- Known gaps:

Then provide this table:

| Invoice Action | UI Support | Backend Support | AI Support | Persisted Correctly? | Verifiable? | Notes / Evidence |
|----------------|-----------|-----------------|------------|----------------------|-------------|------------------|

Check at minimum:
- create invoice
- find invoice
- edit invoice
- add/remove line items
- VAT handling
- mark sent
- mark paid
- close invoice
- reopen invoice
- cancel/void invoice
- generate PDF
- email invoice
- attach note
- link to client
- convert quote to invoice

==================================================
6. CREDIT NOTE AND PURCHASE ORDER DEEP DIVE
==================================================

Do the same audit for:
- credit notes
- purchase orders

Use separate tables for each:

| Action | UI Support | Backend Support | AI Support | Persisted Correctly? | Verifiable? | Notes / Evidence |
|--------|-----------|-----------------|------------|----------------------|-------------|------------------|

For CREDIT NOTES check:
- create
- link to invoice
- calculate totals
- update balances
- generate PDF
- send/export

For PURCHASE ORDERS check:
- create
- select supplier
- add line items
- update status
- close PO
- export/send
- track delivery/receipt

==================================================
7. OFFICE / ADMIN FEATURES AUDIT
==================================================

Check whether the following are actually implemented, partially implemented, or missing:

- day planner
- notes
- call notes
- task creation
- reminders
- calendar events
- client communication log
- email view/sync
- WhatsApp integration
- meeting notes
- note-to-task conversion
- AI summarisation of notes/emails
- follow-up reminders

Use this table:

| Feature | Exists in UI | Works End-to-End | AI Can Use It | Missing Pieces | Evidence |
|---------|--------------|------------------|---------------|----------------|----------|

==================================================
8. FAILURE ANALYSIS: WHY THE AI SAYS “DONE” WHEN IT ISN’T
==================================================

I want a direct analysis of why the integrated AI appears unreliable.

Specifically identify:
- where it generates text without actual execution,
- where it lacks backend actions,
- where tool calls fail silently,
- where no verification exists,
- where UI and backend are disconnected,
- where ambiguous user requests cause wrong behaviour,
- where status transitions are unsupported,
- where errors are swallowed,
- where prompt wording encourages overclaiming success.

Use this table:

| Failure Point | What User Experiences | Technical Root Cause | Severity | Evidence | Recommended Fix |
|--------------|-----------------------|----------------------|----------|----------|-----------------|

Then answer directly:
- Why might it say “invoice closed” when it is not closed?
- Why might it fail to close an invoice at all?
- Is the problem mostly prompt-related, tool-related, backend-related, or workflow-related?
- What are the top 5 causes of user trust loss?

==================================================
9. PROMPT AND EXECUTION AUDIT
==================================================

Inspect the current prompt(s) used by the integrated AI.

I need:
- the current system prompt or instruction if found,
- any tool descriptions,
- any hidden execution logic,
- and an evaluation of whether the prompting is causing unsafe behaviour.

Then answer:

1. Does the current prompt clearly distinguish between:
   - drafting,
   - attempting,
   - confirming,
   - failing,
   - unsupported actions?
2. Does it instruct the AI not to claim completion without verification?
3. Does it require clarifying questions when identifiers are vague?
4. Does it enforce structured outputs for actions?
5. Does it tell the AI what to do when tools are missing?

Use this table:

| Prompt / Config File | Purpose | Weaknesses | Risk Caused | Suggested Improvement |
|----------------------|---------|------------|-------------|-----------------------|

==================================================
10. WHAT IS MISSING FOR RELIABLE AI AUTOMATION
==================================================

List everything missing that would be required for the integrated AI to become truly reliable.

Examples may include:
- server actions for close/reopen flows,
- read-after-write verification,
- structured tool responses,
- proper record lookup,
- exact status enums,
- action confirmation from backend,
- better logs,
- audit trails,
- role/permission checks,
- retries,
- deterministic prompts,
- safer response formatting,
- task/note/calendar modules,
- email/WhatsApp integrations.

Use this table:

| Missing / Weak Area | Why It Matters | Impact on AI Reliability | Recommended Priority | Suggested Implementation |
|---------------------|----------------|--------------------------|----------------------|--------------------------|

==================================================
11. RECOMMENDED SAFE RESPONSE PROTOCOL FOR THE INTEGRATED AI
==================================================

Design the response protocol the integrated AI should follow whenever a user asks it to do something.

It should never just say “done”.

Define a better structure such as:
- Requested action
- Record found?
- Preconditions met?
- Action attempted?
- Action confirmed?
- Evidence
- Next step

Then provide:
A. A recommended structured output format
B. A list of approved status labels
C. Example responses for:
   - successful invoice close
   - failed invoice close
   - missing invoice identifier
   - draft-only action

==================================================
12. TOP IMPROVEMENTS TO BUILD NEXT
==================================================

Give me the most important improvements in priority order.

Split them into:
- Immediate fixes
- Short-term improvements
- Structural improvements

Format:

A. Immediate fixes (highest urgency)
B. Short-term improvements
C. Structural / architectural improvements

==================================================
13. FINAL SUMMARY
==================================================

End with these sections:

A. What the dashboard already supports well
B. What is partially implemented
C. What is missing
D. What the integrated AI can reliably do right now
E. What the integrated AI should NOT claim it can do
F. Top 10 actions needed to make the AI trustworthy

FINAL INSTRUCTION

Base everything on code inspection.
Cite files, components, routes, models, functions, or config locations wherever possible.
If something is not implemented, say it plainly.
If something is only in the UI, say “UI only”.
If something is only in code but not connected, say “not wired through”.
If something is impossible for the current integrated AI, say so directly.
Do not hide weaknesses.
```

---

# Why this prompt is better for your situation

Because now you’re asking the **builder AI** to inspect the actual system, not asking the in-app AI to guess.

This new prompt will help you discover:

## 1. What really exists
Sometimes there’s:
- a page in the UI,
- but no backend action,
- or a button,
- but no persistence.

This prompt exposes that.

## 2. What the integrated AI is actually connected to
A lot of “AI can do X” claims are false because the integrated AI can:
- generate text,
- but not call the right action,
- or call the action,
- but not verify it.

## 3. Why “done” is being said incorrectly
Usually the cause is one of these:
- no read-after-write check,
- no structured tool response,
- no status confirmation,
- prompt encourages helpfulness over accuracy,
- action exists in theory but is not wired up.

## 4. What code you need next
This prompt should reveal whether your next job is:
- better prompts,
- better tool definitions,
- backend actions,
- record matching,
- verification logic,
- or response formatting.

---

# My advice: ask for file evidence
The most important part of this prompt is that it asks for:

- file names,
- functions,
- routes,
- schema,
- evidence.

That stops the coding AI from giving you vague nonsense like:
> “The invoice module appears functional.”

Instead it should say something like:
> `app/invoices/page.tsx` exists,  
> `components/invoices/InvoiceTable.tsx` exists,  
> `api/invoices/[id]/close.ts` does not exist,  
> the AI prompt references invoice closing,  
> but there is no backend close action.

That’s what you want.

---

# Best next step
Use this revised prompt with the AI that is building the dashboard.

Then bring me its response.

After that, I can help you with any of these:

1. a **master system prompt for the integrated AI**,  
2. a **safe action execution protocol**,  
3. a **tool schema design for invoices / POs / notes / tasks**,  
4. or a **trustworthy status response format** so it stops falsely saying “done”.  

If you want, I can also prepare a **second prompt** specifically for the coding AI to redesign the integrated AI’s prompt and tool-calling architecture after it finishes the audit.