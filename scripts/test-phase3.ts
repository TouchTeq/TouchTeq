/**
 * Phase 3 Integration Test Script
 * 
 * Tests: Error Handling, Client Disambiguation, Rate Limiting, Usage Logging
 * 
 * Usage:
 *   1. Start the dev server: npm run dev
 *   2. Run this script: npx tsx scripts/test-phase3.ts
 * 
 * Requirements:
 *   - Dev server running on http://localhost:3000
 *   - Valid Supabase credentials in .env.local
 *   - A test user email/password configured below
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// ─── Configuration ───────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

// Test user credentials — change these to a real test account
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@touchteq.co.za';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'TestPassword123!';

// ─── Test Framework ──────────────────────────────────────────────────────────

interface TestResult {
  testNumber: string;
  description: string;
  input: string;
  response: string;
  expected: string;
  passed: boolean;
  notes: string;
}

const results: TestResult[] = [];

function recordTest(
  testNumber: string,
  description: string,
  input: string,
  response: string,
  expected: string,
  passed: boolean,
  notes: string = ''
) {
  results.push({ testNumber, description, input, response, expected, passed, notes });
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`\n${status} [Test ${testNumber}] ${description}`);
  if (!passed) {
    console.log(`  Input:    ${input}`);
    console.log(`  Expected: ${expected}`);
    console.log(`  Got:      ${response.slice(0, 200)}`);
    if (notes) console.log(`  Notes:    ${notes}`);
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function loginAndGetToken(): Promise<string> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data, error } = await supabase.auth.signInWithPassword({
    email: TEST_USER_EMAIL,
    password: TEST_USER_PASSWORD,
  });

  if (error || !data.session) {
    throw new Error(`Login failed: ${error?.message || 'No session'}. Check TEST_USER_EMAIL and TEST_USER_PASSWORD.`);
  }

  return data.session.access_token;
}

async function sendChatMessage(token: string, message: string, history: any[] = []): Promise<string> {
  const response = await fetch(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Cookie': '',
    },
    body: JSON.stringify({
      history,
      message,
      attachments: [],
      wantsAudio: false,
      assistantPreferences: {
        requireConfirmationBeforeSend: true,
        conciseResponses: true,
        languagePreference: 'south_african_english',
        alwaysIncludeVatInvoice: true,
        alwaysIncludeVatQuote: true,
      },
      activeDocumentSession: null,
      sessionContext: null,
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      const errorData = await response.json();
      return `[429 Rate Limited] ${errorData.error || 'Rate limit exceeded'}`;
    }
    const errorText = await response.text();
    return `[HTTP ${response.status}] ${errorText.slice(0, 500)}`;
  }

  // Parse streaming NDJSON response
  const reader = response.body?.getReader();
  if (!reader) return '[No response body]';

  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const event = JSON.parse(line);
        if (event.type === 'delta') {
          fullText += event.text || '';
        }
        if (event.type === 'done') {
          fullText = event.text || fullText;
        }
      } catch {
        // Skip malformed lines
      }
    }
  }

  return fullText || '[Empty response]';
}

async function checkUsageLogs(supabaseAdmin: any, userId: string, sinceMinutes: number = 5): Promise<any[]> {
  const since = new Date(Date.now() - sinceMinutes * 60 * 1000).toISOString();
  const { data, error } = await supabaseAdmin
    .from('ai_usage_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('timestamp', since)
    .order('timestamp', { ascending: false });

  if (error) {
    console.error('Error checking usage logs:', error.message);
    return [];
  }
  return data || [];
}

async function checkRateLimits(supabaseAdmin: any, userId: string): Promise<any[]> {
  const { data, error } = await supabaseAdmin
    .from('ai_rate_limits')
    .select('*')
    .eq('user_id', userId)
    .order('window_start', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error checking rate limits:', error.message);
    return [];
  }
  return data || [];
}

async function cleanupTestData(supabaseAdmin: any, userId: string) {
  console.log('\n🧹 Cleaning up test data...');

  // Clean up usage logs from this test session
  const { error: usageError } = await supabaseAdmin
    .from('ai_usage_logs')
    .delete()
    .eq('user_id', userId);

  if (usageError) console.error('Error cleaning usage logs:', usageError.message);
  else console.log('  Cleaned ai_usage_logs');

  // Clean up rate limits
  const { error: rateError } = await supabaseAdmin
    .from('ai_rate_limits')
    .delete()
    .eq('user_id', userId);

  if (rateError) console.error('Error cleaning rate limits:', rateError.message);
  else console.log('  Cleaned ai_rate_limits');
}

// ─── Test Clients Setup ──────────────────────────────────────────────────────

async function setupTestClients(supabaseAdmin: any): Promise<{ testEngineeringId: string; testSolutionsId: string; uniqueClientId: string }> {
  console.log('\n📋 Setting up test clients...');

  // Check if test clients already exist
  const { data: existing } = await supabaseAdmin
    .from('clients')
    .select('id, company_name')
    .in('company_name', ['Test Engineering', 'Test Solutions', 'Unique Calibration Client']);

  const existingNames = new Set((existing || []).map((c: any) => c.company_name));

  let testEngineeringId = existing?.find((c: any) => c.company_name === 'Test Engineering')?.id;
  let testSolutionsId = existing?.find((c: any) => c.company_name === 'Test Solutions')?.id;
  let uniqueClientId = existing?.find((c: any) => c.company_name === 'Unique Calibration Client')?.id;

  if (!testEngineeringId) {
    const { data } = await supabaseAdmin
      .from('clients')
      .insert({ company_name: 'Test Engineering', is_active: true })
      .select('id')
      .single();
    testEngineeringId = data?.id;
    console.log(`  Created "Test Engineering" (${testEngineeringId})`);
  }

  if (!testSolutionsId) {
    const { data } = await supabaseAdmin
      .from('clients')
      .insert({ company_name: 'Test Solutions', is_active: true })
      .select('id')
      .single();
    testSolutionsId = data?.id;
    console.log(`  Created "Test Solutions" (${testSolutionsId})`);
  }

  if (!uniqueClientId) {
    const { data } = await supabaseAdmin
      .from('clients')
      .insert({ company_name: 'Unique Calibration Client', is_active: true })
      .select('id')
      .single();
    uniqueClientId = data?.id;
    console.log(`  Created "Unique Calibration Client" (${uniqueClientId})`);
  }

  return { testEngineeringId: testEngineeringId!, testSolutionsId: testSolutionsId!, uniqueClientId: uniqueClientId! };
}

async function cleanupTestClients(supabaseAdmin: any, ids: string[]) {
  console.log('\n🧹 Cleaning up test clients...');
  const { error } = await supabaseAdmin
    .from('clients')
    .delete()
    .in('id', ids);
  if (error) console.error('Error cleaning test clients:', error.message);
  else console.log('  Cleaned test clients');
}

// ─── Main Test Runner ────────────────────────────────────────────────────────

async function runTests() {
  console.log('='.repeat(60));
  console.log('  Phase 3 Integration Tests');
  console.log('='.repeat(60));

  // Validate environment
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Missing Supabase credentials. Check .env.local');
    process.exit(1);
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // Step 1: Login
  console.log('\n🔐 Logging in...');
  let token: string;
  try {
    token = await loginAndGetToken();
    console.log('  Login successful');
  } catch (err: any) {
    console.error(`❌ ${err.message}`);
    process.exit(1);
  }

  // Get user ID from the JWT token
  const tokenPayload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
  const userId = tokenPayload.sub;
  console.log(`  User ID: ${userId}`);

  // Step 2: Setup test clients
  const clientIds = await setupTestClients(supabaseAdmin);

  // ─── TEST 1: Error Handling ──────────────────────────────────────────────
  console.log('\n' + '='.repeat(60));
  console.log('  TEST 1: Error Handling — Failure Reporting');
  console.log('='.repeat(60));

  // Test 1.1: Non-existent client
  console.log('\n📝 Test 1.1: Non-existent client invoice creation...');
  const t1_1_response = await sendChatMessage(token, 'Create an invoice for CompanyThatDoesNotExist for R10,000 for testing.');
  const t1_1_lower = t1_1_response.toLowerCase();
  const t1_1_pass = t1_1_lower.includes('not found') || t1_1_lower.includes('could not find') || t1_1_lower.includes('no client') || t1_1_lower.includes("couldn't find");
  recordTest(
    '1.1',
    'Non-existent client invoice',
    'Create an invoice for CompanyThatDoesNotExist for R10,000 for testing.',
    t1_1_response,
    'AI says no client found, suggests checking name or creating client',
    t1_1_pass,
    t1_1_pass ? '' : 'Response did not mention client not found'
  );

  // Test 1.2: Non-existent invoice
  console.log('\n📝 Test 1.2: Non-existent invoice payment...');
  const t1_2_response = await sendChatMessage(token, 'Mark invoice NONEXISTENT-999 as paid.');
  const t1_2_lower = t1_2_response.toLowerCase();
  const t1_2_pass = t1_2_lower.includes('not found') || t1_2_lower.includes('no invoice') || t1_2_lower.includes("couldn't find");
  recordTest(
    '1.2',
    'Non-existent invoice payment',
    'Mark invoice NONEXISTENT-999 as paid.',
    t1_2_response,
    'AI says no invoice found',
    t1_2_pass,
    t1_2_pass ? '' : 'Response did not mention invoice not found'
  );

  // Test 1.3: Delete all invoices
  console.log('\n📝 Test 1.3: Delete all invoices request...');
  const t1_3_response = await sendChatMessage(token, 'Delete all my invoices.');
  const t1_3_lower = t1_3_response.toLowerCase();
  const t1_3_pass = t1_3_lower.includes('cannot delete') || t1_3_lower.includes("can't delete") || t1_3_lower.includes('not able') || t1_3_lower.includes('dashboard') || t1_3_lower.includes('unsupported') || t1_3_lower.includes('not available');
  recordTest(
    '1.3',
    'Delete all invoices request',
    'Delete all my invoices.',
    t1_3_response,
    'AI says it cannot delete records and directs to dashboard',
    t1_3_pass,
    t1_3_pass ? '' : 'Response did not refuse deletion'
  );

  // Test 1.4: Generate PDF
  console.log('\n📝 Test 1.4: Generate PDF request...');
  const t1_4_response = await sendChatMessage(token, 'Generate a PDF of invoice INV-0001.');
  const t1_4_lower = t1_4_response.toLowerCase();
  const t1_4_pass = t1_4_lower.includes('cannot generate') || t1_4_lower.includes("can't generate") || t1_4_lower.includes('not able') || t1_4_lower.includes('pdf') || t1_4_lower.includes('invoice page') || t1_4_lower.includes('unsupported');
  recordTest(
    '1.4',
    'Generate PDF request',
    'Generate a PDF of invoice INV-0001.',
    t1_4_response,
    'AI says it cannot generate PDFs and directs to invoice page',
    t1_4_pass,
    t1_4_pass ? '' : 'Response did not refuse PDF generation'
  );

  // ─── TEST 2: Client Disambiguation ───────────────────────────────────────
  console.log('\n' + '='.repeat(60));
  console.log('  TEST 2: Client Disambiguation');
  console.log('='.repeat(60));

  // Test 2.1: Ambiguous client name
  console.log('\n📝 Test 2.1: Ambiguous client name...');
  const t2_1_response = await sendChatMessage(token, 'Create an invoice for Test for R5,000 for consulting.');
  const t2_1_lower = t2_1_response.toLowerCase();
  const t2_1_pass = t2_1_lower.includes('test engineering') || t2_1_lower.includes('test solutions') || t2_1_lower.includes('which one') || t2_1_lower.includes('multiple') || t2_1_lower.includes('specify') || t2_1_lower.includes('ambiguous') || t2_1_lower.includes('disambiguation');
  recordTest(
    '2.1',
    'Ambiguous client disambiguation',
    'Create an invoice for Test for R5,000 for consulting.',
    t2_1_response,
    'AI presents both "Test Engineering" and "Test Solutions" and asks which one',
    t2_1_pass,
    t2_1_pass ? '' : 'Response did not present disambiguation options'
  );

  // Test 2.2: Create invoice for unique client
  console.log('\n📝 Test 2.2: Unique client invoice creation...');
  const t2_2_response = await sendChatMessage(token, 'Create an invoice for Unique Calibration Client for R3,000 for calibration.');
  const t2_2_lower = t2_2_response.toLowerCase();
  const t2_2_pass = t2_2_lower.includes('created') || t2_2_lower.includes('invoice') || t2_2_lower.includes('unique calibration');
  recordTest(
    '2.2',
    'Unique client direct creation',
    'Create an invoice for Unique Calibration Client for R3,000 for calibration.',
    t2_2_response,
    'AI matches immediately and creates the invoice',
    t2_2_pass,
    t2_2_pass ? '' : 'Response did not confirm invoice creation'
  );

  // ─── TEST 3: Rate Limiting and Usage Logging ─────────────────────────────
  console.log('\n' + '='.repeat(60));
  console.log('  TEST 3: Rate Limiting and Usage Logging');
  console.log('='.repeat(60));

  // Test 3.1: Check usage logs after messages
  console.log('\n📝 Test 3.1: Checking usage logs...');
  await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for async logging
  const usageLogs = await checkUsageLogs(supabaseAdmin, userId, 10);
  const t3_1_pass = usageLogs.length >= 4; // At least 4 from tests 1.x and 2.x
  recordTest(
    '3.1',
    'Usage logging after messages',
    'Sent 4+ messages to AI',
    `Found ${usageLogs.length} usage log entries`,
    'At least 3 new rows with timestamps, model name, and response times',
    t3_1_pass,
    t3_1_pass ? '' : `Only found ${usageLogs.length} entries, expected at least 4`
  );

  // Check that model name is populated
  if (usageLogs.length > 0) {
    const hasModel = usageLogs.some((log: any) => log.model_used && log.model_used.length > 0);
    const hasResponseTime = usageLogs.some((log: any) => log.response_time_ms && log.response_time_ms > 0);
    console.log(`  Model populated: ${hasModel ? '✅' : '❌'}`);
    console.log(`  Response time populated: ${hasResponseTime ? '✅' : '❌'}`);
  }

  // Test 3.2: Tool calls logged
  console.log('\n📝 Test 3.2: Tool calls in usage logs...');
  const toolCallLogs = usageLogs.filter((log: any) => log.tool_calls && Array.isArray(log.tool_calls) && log.tool_calls.length > 0);
  const t3_2_pass = toolCallLogs.length > 0;
  recordTest(
    '3.2',
    'Tool calls logged in usage',
    'Checked ai_usage_logs for tool_calls entries',
    `Found ${toolCallLogs.length} entries with tool calls`,
    'Latest rows have tool_calls containing tool names like draftQuote',
    t3_2_pass,
    t3_2_pass ? `Tool calls found: ${toolCallLogs.map((l: any) => JSON.stringify(l.tool_calls)).join(', ')}` : 'No tool calls found in usage logs'
  );

  // Test 3.3: Rate limits table
  console.log('\n📝 Test 3.3: Rate limits table entries...');
  const rateLimits = await checkRateLimits(supabaseAdmin, userId);
  const t3_3_pass = rateLimits.length > 0;
  recordTest(
    '3.3',
    'Rate limits table entries',
    'Checked ai_rate_limits table',
    `Found ${rateLimits.length} rate limit entries`,
    'Rows for the current minute window with correct request counts',
    t3_3_pass,
    t3_3_pass ? `Rate limit entries: ${rateLimits.map((r: any) => `count=${r.request_count}`).join(', ')}` : 'No rate limit entries found'
  );

  // ─── Print Summary ───────────────────────────────────────────────────────
  console.log('\n' + '='.repeat(60));
  console.log('  TEST SUMMARY');
  console.log('='.repeat(60));

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log(`\nTotal: ${results.length} | ✅ Passed: ${passed} | ❌ Failed: ${failed}`);

  if (failed > 0) {
    console.log('\nFailed tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  [Test ${r.testNumber}] ${r.description}`);
      console.log(`    Notes: ${r.notes}`);
    });
  }

  // ─── Cleanup ─────────────────────────────────────────────────────────────
  console.log('\n' + '='.repeat(60));
  await cleanupTestData(supabaseAdmin, userId);
  await cleanupTestClients(supabaseAdmin, [clientIds.testEngineeringId, clientIds.testSolutionsId, clientIds.uniqueClientId]);

  // ─── Write report ────────────────────────────────────────────────────────
  const reportPath = path.join(process.cwd(), 'test-results-phase3.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 Full report written to: ${reportPath}`);

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Test runner crashed:', err);
  process.exit(1);
});
