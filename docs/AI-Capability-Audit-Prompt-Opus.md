**This is not a feature request. This is not a task. Do not build anything. Do not change any code.**

**This is a full audit of the current state of the project. I need you to describe what exists right now — the dashboard, its features, its database, and especially the integrated AI assistant. I need this information so I can hand it to another specialist who will help me improve the AI integration and fix issues with it.**

**Answer every section below in full. Be specific and technical. Reference actual file names, function names, database tables, API routes, and model names where you can. If you are unsure about something, say so — do not guess.**

---

## SECTION 1: PROJECT OVERVIEW

1. What is the tech stack for this project? List everything:
   - Frontend framework (React, Next.js, Vue, etc.)
   - Backend framework (Node/Express, Django, Laravel, etc.)
   - Database (PostgreSQL, MySQL, MongoDB, Supabase, Firebase, etc.)
   - Hosting / deployment (Vercel, Netlify, Railway, VPS, etc.)
   - Authentication method (JWT, session, OAuth, Supabase Auth, etc.)
   - Any other services, libraries, or platforms in use

2. Describe the overall structure of the project. What are the main folders and files? Give me a high-level file/folder tree of the project.

3. Is this a monorepo or are frontend and backend separate? How are they connected?

---

## SECTION 2: DASHBOARD FEATURES — WHAT EXISTS RIGHT NOW

List **every feature** that currently exists in the dashboard. For each feature, provide:
- What it does (brief description)
- Whether it is fully working, partially working, or broken
- The main files/components involved

Specifically confirm the status of each of these:

| Feature | Exists? | Status | Notes |
|---|---|---|---|
| Invoice creation | | | |
| Invoice editing | | | |
| Invoice PDF generation | | | |
| Invoice sending (email) | | | |
| Invoice status management (draft, sent, paid, overdue, void, closed) | | | |
| Credit note creation | | | |
| Purchase order creation | | | |
| Quote / estimate creation | | | |
| Client / contact management | | | |
| Product or service line items (saved/reusable) | | | |
| Dashboard home / overview screen | | | |
| User authentication and login | | | |
| Settings / company profile | | | |
| Reports or analytics | | | |
| Any other feature not listed above — list it | | | |

---

## SECTION 3: DATABASE SCHEMA

1. List **every database table or collection** that currently exists. For each table, provide:
   - Table name
   - Key columns/fields and their types
   - Relationships to other tables (foreign keys)

2. Specifically, describe the schema for:
   - Invoices (all fields, statuses, relationships)
   - Credit notes
   - Purchase orders
   - Clients / contacts
   - Users
   - Any AI-related tables (conversation logs, message history, etc.)

3. Are there any fields or tables that were created but are not currently being used?

4. Is there an audit trail or activity log table? If yes, what does it capture?

---

## SECTION 4: THE INTEGRATED AI ASSISTANT — FULL BREAKDOWN

This is the most important section. Be thorough.

**4.1 AI Model and Configuration**

1. What AI model is the integrated assistant using? (GPT-4, GPT-4o, GPT-3.5-turbo, Claude — specify exactly)
2. What API is it calling? (OpenAI, Anthropic, a wrapper service, etc.)
3. Where is the API key stored and how is it managed?
4. What is the temperature setting?
5. What is the max token limit set for responses?
6. Is there a conversation history / context window? How many previous messages are sent with each request?

**4.2 System Prompt**

1. Reproduce the **full system prompt** that the integrated AI currently receives. Every word. Do not summarise it.
2. Where is this system prompt stored? (Hardcoded in a file? In the database? In an environment variable?)
3. Does the system prompt change dynamically based on context, or is it static?

**4.3 Tools and Function Calling**

1. Does the integrated AI have **function calling** or **tool use** enabled? (Yes/No)
2. If YES — list **every function/tool** that has been defined for the AI. For each one provide:
   - Function name
   - Description (as given to the AI)
   - Parameters it accepts
   - What it actually does in the backend (which API route it calls, what database operation it performs)
   - What it returns to the AI on success
   - What it returns to the AI on failure
3. If NO — how does the AI perform actions? Does it just generate text and the frontend parses it? Does it return structured JSON that the frontend interprets? Describe the exact mechanism.
4. Show me the actual code or configuration where these tools/functions are defined.

**4.4 How the AI Executes Actions**

Walk me through the **exact technical flow** when a user says "Create an invoice for Client X for R15,000":

1. Where does the user's message go first? (Which component/file handles it?)
2. How is the message sent to the AI? (Direct API call? Through a backend route? Through a middleware?)
3. What does the AI receive? (Just the user message? The system prompt plus conversation history? Any additional context like client data or recent invoices?)
4. How does the AI decide to perform an action vs just respond with text?
5. If the AI decides to create an invoice, what happens next — step by step through the code?
6. After the action is performed (or fails), how does the result get back to the AI?
7. Does the AI see the success/failure result before composing its response to the user?
8. Or does the AI compose its response at the same time as (or before) the action is executed?

**4.5 The "Says Done But Isn't" Problem**

Based on how the AI is currently wired up:

1. Is there **any mechanism** that forces the AI to verify an action was completed before responding to the user?
2. Is it possible, given the current architecture, for the AI to say "Done, your invoice has been created" when the database insert actually failed? Explain how this could happen.
3. When a function call or API call fails, does the error get sent back to the AI so it can tell the user? Or does the error get swallowed somewhere?
4. Are there any **try/catch blocks** or error handling in the AI action execution flow? Show me the relevant code or describe it.

**4.6 What the AI Currently Cannot Do**

Based on the tools/functions that have been defined:

1. List every action the AI **has no function for** but a user might reasonably ask it to do.
2. Are there any dashboard features that exist in the UI but the AI **has no way to interact with**?
3. Can the AI read/query data from the database, or can it only create/write?
4. Can the AI perform multi-step operations? (e.g., "Create an invoice and send it to the client" — two actions in sequence)

---

## SECTION 5: API ROUTES AND BACKEND ENDPOINTS

1. List **every API route** in the backend. For each, provide:
   - Method (GET, POST, PUT, PATCH, DELETE)
   - Route path
   - What it does
   - Whether it is protected (requires authentication)

2. Which of these routes are used by the AI's function calls?

3. Which of these routes exist but are **not connected to the AI** (meaning the AI cannot use them even though the functionality exists)?

---

## SECTION 6: WHAT IS MISSING OR BROKEN

1. List any features that are **partially built** or **not fully connected**.
2. List any known bugs or issues you are aware of.
3. Are there any database tables that exist but have no corresponding frontend UI?
4. Are there any frontend pages/components that exist but have no working backend connection?
5. Is there anything in the codebase that you would flag as a concern — messy code, security issues, missing validation, etc.?

---

## SECTION 7: AI IMPROVEMENT — YOUR ASSESSMENT

Based on your knowledge of the codebase:

1. What would need to change in the code to make the AI **verify actions before confirming them to the user**?
2. What additional **functions/tools** should be defined to make the AI more useful?
3. What **data or context** should be injected into the AI's system prompt or conversation to make it smarter? (e.g., client list, recent invoices, company details, current date)
4. Do you recommend any architectural changes to how the AI is integrated?
5. If you could fix three things about the AI integration right now, what would they be?

---

## FORMAT YOUR RESPONSE

Use the exact section numbers and headings above. Do not skip any question. Do not merge sections. If something does not exist, say "Does not exist" and move on.

**Do not build, fix, or change anything. Just describe what is there right now. I need a complete picture before I make any changes.**

---
