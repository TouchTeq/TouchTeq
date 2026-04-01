/**
 * AI Tool Execution Telemetry
 * 
 * Captures structured telemetry for AI tool execution including:
 * - Tool selection and execution phases
 * - Latency tracking
 * - Error classification
 * - Verification outcomes
 * - Client-side acknowledgement status
 */

import { createAdminClient } from '@/lib/supabase/admin';

// ============================================================
// Error Taxonomy
// ============================================================

export type TelemetryErrorType =
  | 'validation_error'        // Input validation failed
  | 'lookup_error'            // Database lookup failed
  | 'ambiguous_match'         // Multiple matches found, user needs to disambiguate
  | 'db_error'                // Database operation failed
  | 'verification_failed'     // Post-action verification failed
  | 'client_ack_timeout'      // Client-side acknowledgement timed out
  | 'unsupported_action'      // Action not supported by any tool
  | 'conflict_error'          // Concurrent modification conflict
  | 'timeout_error'           // Operation timed out
  | 'unknown_error';          // Unclassified error

export type ToolPhase =
  | 'selection'    // Model selected a tool
  | 'execution'    // Tool is executing
  | 'verification' // Post-execution verification
  | 'response'     // Response being sent to user
  | 'complete';    // Full request complete

export type VerificationStatus =
  | 'confirmed'
  | 'could_not_verify'
  | 'failed'
  | 'not_applicable';

export type ClientAckStatus =
  | 'success'
  | 'timeout'
  | 'failed'
  | 'not_applicable';

// ============================================================
// Telemetry Record
// ============================================================

export interface ToolTelemetryRecord {
  // Context
  request_id: string;
  conversation_id: string | null;
  user_id: string | null;
  
  // Tool info
  model_name: string;
  tool_name: string | null;
  tool_phase: ToolPhase;
  
  // Timing
  started_at: number;  // Date.now()
  completed_at: number | null;
  latency_ms: number | null;
  
  // Outcome
  success: boolean | null;
  error_type: TelemetryErrorType | null;
  error_message: string | null;
  
  // Match info
  ambiguous_match_count: number;
  matched_record_count: number;
  
  // Verification
  verification_status: VerificationStatus;
  
  // Client ack (for client-side tools)
  client_ack_status: ClientAckStatus;
  
  // Summary
  summary: string;
}

// ============================================================
// Telemetry Builder
// ============================================================

export class ToolTelemetryBuilder {
  protected record: Partial<ToolTelemetryRecord>;

  constructor(requestId: string, modelName: string) {
    this.record = {
      request_id: requestId,
      model_name: modelName,
      conversation_id: null,
      user_id: null,
      tool_name: null,
      tool_phase: 'selection',
      started_at: Date.now(),
      completed_at: null,
      latency_ms: null,
      success: null,
      error_type: null,
      error_message: null,
      ambiguous_match_count: 0,
      matched_record_count: 0,
      verification_status: 'not_applicable',
      client_ack_status: 'not_applicable',
      summary: '',
    };
  }

  setConversationId(id: string | null): this {
    this.record.conversation_id = id;
    return this;
  }

  setUserId(id: string | null): this {
    this.record.user_id = id;
    return this;
  }

  setToolName(name: string | null): this {
    this.record.tool_name = name;
    return this;
  }

  setPhase(phase: ToolPhase): this {
    this.record.tool_phase = phase;
    return this;
  }

  setSuccess(success: boolean): this {
    this.record.success = success;
    return this;
  }

  setError(errorType: TelemetryErrorType, message: string | null): this {
    this.record.success = false;
    this.record.error_type = errorType;
    this.record.error_message = message;
    return this;
  }

  setAmbiguousMatchCount(count: number): this {
    this.record.ambiguous_match_count = count;
    if (count > 0) {
      this.record.error_type = 'ambiguous_match';
    }
    return this;
  }

  setMatchedRecordCount(count: number): this {
    this.record.matched_record_count = count;
    return this;
  }

  setVerificationStatus(status: VerificationStatus): this {
    this.record.verification_status = status;
    return this;
  }

  setClientAckStatus(status: ClientAckStatus): this {
    this.record.client_ack_status = status;
    return this;
  }

  setSummary(summary: string): this {
    this.record.summary = summary;
    return this;
  }

  setLatencyMs(ms: number | undefined): this {
    if (ms !== undefined) {
      this.record.latency_ms = ms;
    }
    return this;
  }

  build(): ToolTelemetryRecord {
    const now = Date.now();
    return {
      ...this.record,
      completed_at: this.record.completed_at ?? now,
      latency_ms: this.record.latency_ms ?? (now - (this.record.started_at ?? now)),
    } as ToolTelemetryRecord;
  }
}

// ============================================================
// Logging Helpers
// ============================================================

/**
 * Log telemetry to console and persist to DB.
 * Failures are silently caught to avoid breaking the chat.
 */
export function logToolTelemetry(record: ToolTelemetryRecord): void {
  try {
    // Console logging (errors + slow ops in production, all in dev)
    const isProduction = process.env.NODE_ENV === 'production';
    const isSlow = (record.latency_ms ?? 0) > 5000;
    const isError = !record.success;
    
    if (!isProduction || isError || isSlow) {
      const level = isError ? 'warn' : isSlow ? 'info' : 'debug';
      console[level]('[AI Telemetry]', JSON.stringify({
        ...record,
        summary: record.summary?.slice(0, 200),
      }));
    }

    // Persist to DB (fire-and-forget)
    persistTelemetryToDb(record).catch(() => {});
  } catch {
    // Never let telemetry logging break the chat
  }
}

/**
 * Persist telemetry record to database.
 */
async function persistTelemetryToDb(record: ToolTelemetryRecord): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from('ai_tool_telemetry').insert({
      request_id: record.request_id,
      conversation_id: record.conversation_id,
      user_id: record.user_id || null,
      model_name: record.model_name,
      tool_name: record.tool_name,
      tool_phase: record.tool_phase,
      started_at: record.started_at,
      completed_at: record.completed_at,
      latency_ms: record.latency_ms,
      success: record.success,
      error_type: record.error_type,
      error_message: record.error_message,
      ambiguous_match_count: record.ambiguous_match_count,
      matched_record_count: record.matched_record_count,
      verification_status: record.verification_status,
      client_ack_status: record.client_ack_status,
      summary: record.summary?.slice(0, 500) || null,
    });
  } catch {
    // Silently fail - telemetry should never break the app
  }
}

/**
 * Create a telemetry record for a tool execution and log it.
 */
export function recordToolExecution(
  requestId: string,
  modelName: string,
  toolName: string,
  success: boolean,
  options?: {
    latencyMs?: number;
    errorType?: TelemetryErrorType;
    errorMessage?: string;
    ambiguousMatchCount?: number;
    verificationStatus?: VerificationStatus;
    clientAckStatus?: ClientAckStatus;
    summary?: string;
  }
): ToolTelemetryRecord {
  const builder = new ToolTelemetryBuilder(requestId, modelName)
    .setToolName(toolName)
    .setPhase('complete')
    .setSuccess(success)
    .setLatencyMs(options?.latencyMs);

  if (!success && options?.errorType) {
    builder.setError(options.errorType, options.errorMessage ?? null);
  }

  if (options?.ambiguousMatchCount) {
    builder.setAmbiguousMatchCount(options.ambiguousMatchCount);
  }

  if (options?.verificationStatus) {
    builder.setVerificationStatus(options.verificationStatus);
  }

  if (options?.clientAckStatus) {
    builder.setClientAckStatus(options.clientAckStatus);
  }

  if (options?.summary) {
    builder.setSummary(options.summary);
  }

  const record = builder.build();
  logToolTelemetry(record);
  return record;
}