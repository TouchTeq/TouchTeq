import { createClient } from "@/lib/supabase/client";

/**
 * Serializable message shape — every field can round-trip through JSON.stringify / JSON.parse.
 * The AiAssistant `Message` type uses `timestamp: Date`, so before saving we convert to ISO
 * and on restore we convert back.
 */
export interface PersistedMessage {
  id: string;
  text: string;
  sender: "user" | "assistant";
  timestamp: string;          // ISO-8601
  attachments?: Array<{ name: string; type: string; size: number }>;
}

/**
 * What we store in localStorage and in the Supabase JSONB column.
 */
export interface PersistedConversation {
  conversationId: string | null;
  messages: PersistedMessage[];
  savedAt: string;            // ISO-8601
}

const LOCALSTORAGE_KEY = "touchteq_ai_conversation";
/** Keep only the most recent N messages to avoid unbounded growth */
const MAX_MESSAGES = 100;

/* ─────────────────────────── localStorage ─────────────────────────── */

/**
 * Serialize the supplied `messages` (already PersistedMessage[]) and write
 * to localStorage.  Non-blocking, synchronous, fails silently.
 */
export function saveConversationToLocal(
  messages: PersistedMessage[],
  conversationId?: string | null
): void {
  try {
    const data: PersistedConversation = {
      conversationId: conversationId ?? null,
      messages: messages.slice(-MAX_MESSAGES),
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn("[Conversation] Failed to save to localStorage:", e);
  }
}

/**
 * Read PersistedConversation from localStorage.
 * Returns `null` when nothing is stored or the data is corrupt.
 */
export function loadConversationFromLocal(): PersistedConversation | null {
  try {
    const raw = localStorage.getItem(LOCALSTORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedConversation;
  } catch (e) {
    console.warn("[Conversation] Failed to load from localStorage:", e);
    return null;
  }
}

export function clearLocalConversation(): void {
  localStorage.removeItem(LOCALSTORAGE_KEY);
}

/* ─────────────────────────── Supabase ─────────────────────────────── */

/**
 * Upsert the active conversation into Supabase.
 * - If `conversationId` is provided we UPDATE.
 * - Otherwise we INSERT a new row and return the new UUID.
 */
export async function saveConversationToSupabase(
  conversationId: string | null,
  messages: PersistedMessage[],
  title?: string
): Promise<string | null> {
  const supabase = createClient();

  const trimmed = messages.slice(-MAX_MESSAGES);

  if (conversationId) {
    const { error } = await supabase
      .from("ai_conversations")
      .update({
        messages: trimmed,
        title: title || generateTitle(trimmed),
      })
      .eq("id", conversationId);

    if (error) {
      console.error("[Conversation] Supabase update failed:", error);
    }
    return conversationId;
  }

  const { data, error } = await supabase
    .from("ai_conversations")
    .insert({
      messages: trimmed,
      title: title || generateTitle(trimmed),
      is_active: true,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[Conversation] Supabase insert failed:", error);
    return null;
  }
  return (data as { id: string }).id;
}

/**
 * Return the most recently-updated *active* conversation for the current user,
 * or null if none exists.
 */
export async function loadActiveConversation(): Promise<PersistedConversation | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("ai_conversations")
    .select("id, title, messages, is_active, created_at, updated_at")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  return {
    conversationId: data.id,
    messages: (data.messages ?? []) as PersistedMessage[],
    savedAt: data.updated_at ?? data.created_at ?? new Date().toISOString(),
  };
}

/**
 * List up to `limit` conversation summaries (no message content).
 */
export async function listConversationSummaries(
  limit: number = 20
): Promise<Array<{ id: string; title: string; is_active: boolean; updated_at: string }>> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("ai_conversations")
    .select("id, title, is_active, updated_at")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[Conversation] listConversations failed:", error);
    return [];
  }
  return data as any[];
}

/**
 * Mark a conversation as inactive (soft-delete / archive).
 */
export async function archiveConversation(conversationId: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("ai_conversations")
    .update({ is_active: false })
    .eq("id", conversationId);
  return !error;
}

/**
 * Delete a conversation permanently.
 */
export async function deleteConversation(conversationId: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("ai_conversations")
    .delete()
    .eq("id", conversationId);
  return !error;
}

/* ─────────────────────── Helpers ──────────────────────────────────── */

/**
 * Convert from the internal `Message` shape (runtime, has `timestamp: Date`)
 * to the `PersistedMessage` shape (JSON-safe, `timestamp: string`).
 */
export function toPersistedMessages(
  messages: Array<{ id: string; text: string; sender: "user" | "assistant"; timestamp: Date; attachments?: Array<{ name: string; type: string; size: number }> }>
): PersistedMessage[] {
  return messages.map((m) => ({
    id: m.id,
    text: m.text,
    sender: m.sender,
    timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : m.timestamp,
    attachments: m.attachments,
  }));
}

/**
 * Convert `PersistedMessage[]` back to the runtime Message shape.
 */
export function fromPersistedMessages(
  persisted: PersistedMessage[]
): Array<{ id: string; text: string; sender: "user" | "assistant"; timestamp: Date; attachments?: Array<{ name: string; type: string; size: number }> }> {
  return persisted.map((m) => ({
    id: m.id,
    text: m.text,
    sender: m.sender,
    timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
    ...(m.attachments ? { attachments: m.attachments } : {}),
  }));
}

/** Generate a title from the first user message, falling back to timestamp */
export function generateTitle(messages: PersistedMessage[]): string {
  const firstUser = messages.find((m) => m.sender === "user");
  if (!firstUser) {
    return `Conversation ${new Date().toLocaleDateString()}`;
  }
  const text = firstUser.text.trim();
  return text.length > 60 ? text.slice(0, 57) + "…" : text;
}

/**
 * Helper: sanitize a PersistedMessage[] to ensure only serialisable keys
 * are present.  Any non-primitive / function values are stripped.
 */
export function sanitizeMessages(msgs: PersistedMessage[]): PersistedMessage[] {
  return msgs.map((m) => ({
    id:        typeof m.id === "string"              ? m.id                        : "",
    text:      typeof m.text === "string"            ? m.text                      : "",
    sender:    m.sender === "user" || m.sender === "assistant" ? m.sender : "assistant",
    timestamp: typeof m.timestamp === "string"       ? m.timestamp                 : new Date().toISOString(),
    attachments: Array.isArray(m.attachments)
      ? m.attachments.map((a) => ({
          name: String(a?.name ?? ""),
          type: String(a?.type ?? ""),
          size: Number(a?.size ?? 0),
        }))
      : undefined,
  }));
}
