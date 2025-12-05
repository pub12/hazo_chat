/**
 * useChatMessages Hook
 *
 * Manages chat messages with:
 * - Cursor-based pagination (infinite scroll)
 * - Polling for new messages with configurable interval
 * - Optimistic updates for sent messages
 * - Soft delete functionality
 * - Exponential backoff on errors
 * - Abstracted transport layer for future WebSocket/SSE support
 *
 * Uses fetch() to call API endpoints instead of direct database access.
 * This allows the hook to work in client components without Node.js dependencies.
 */

'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type {
  ChatMessage,
  ChatMessageDB,
  CreateMessagePayload,
  HazoUserProfile,
  UseChatMessagesReturn,
  PollingStatus,
  RealtimeMode,
} from '../types/index.js';
import {
  DEFAULT_REALTIME_MODE,
  DEFAULT_POLLING_INTERVAL,
  DEFAULT_MESSAGES_PER_PAGE,
  MAX_RETRY_ATTEMPTS,
  RETRY_BASE_DELAY,
} from '../lib/constants.js';

// ============================================================================
// Constants
// ============================================================================

/** Maximum entries in the user profile cache */
const PROFILE_CACHE_MAX_SIZE = 200;

/** Cache TTL in milliseconds (30 minutes) */
const PROFILE_CACHE_TTL = 1000 * 60 * 30;

/** Maximum polling delay cap in milliseconds */
const MAX_POLLING_DELAY = 30000;

// ============================================================================
// Hook Parameters
// ============================================================================

export interface UseChatMessagesParams {
  /** UUID of the chat recipient (required) */
  receiver_user_id: string;
  /** Reference ID for chat context grouping */
  reference_id?: string;
  /** Reference type (default: 'chat') */
  reference_type?: string;
  /** Base URL for API endpoints (default: '/api/hazo_chat') */
  api_base_url?: string;
  /** Real-time update mode: 'polling' (automatic) or 'manual' (refresh only) */
  realtime_mode?: RealtimeMode;
  /** Polling interval in milliseconds (only used when realtime_mode = 'polling', default: 5000) */
  polling_interval?: number;
  /** Number of messages per page for pagination (default: 20) */
  messages_per_page?: number;
}

// ============================================================================
// Cache Entry Type
// ============================================================================

interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

// ============================================================================
// API Response Types (consolidated - use types from ../types/index.js for exports)
// ============================================================================

interface MessagesApiResponse {
  success: boolean;
  messages?: ChatMessageDB[];
  current_user_id?: string;
  error?: string;
  pagination?: {
    limit: number;
    has_more: boolean;
    next_cursor: string | null;
    prev_cursor: string | null;
  };
}

interface SendMessageApiResponse {
  success: boolean;
  message?: ChatMessageDB;
  error?: string;
}

interface ProfilesApiResponse {
  success: boolean;
  profiles?: HazoUserProfile[];
  error?: string;
}

// ============================================================================
// Helper: Generate unique ID for optimistic messages
// ============================================================================

function generateOptimisticId(): string {
  return `optimistic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useChatMessages({
  receiver_user_id,
  reference_id = '',
  reference_type = 'chat',
  api_base_url = '/api/hazo_chat',
  realtime_mode = DEFAULT_REALTIME_MODE,
  polling_interval = DEFAULT_POLLING_INTERVAL,
  messages_per_page = DEFAULT_MESSAGES_PER_PAGE,
}: UseChatMessagesParams): UseChatMessagesReturn {
  // -------------------------------------------------------------------------
  // State
  // -------------------------------------------------------------------------
  const [messages, set_messages] = useState<ChatMessage[]>([]);
  const [is_loading, set_is_loading] = useState(true);
  const [is_loading_more, set_is_loading_more] = useState(false);
  const [has_more, set_has_more] = useState(true);
  const [error, set_error] = useState<string | null>(null);
  const [polling_status, set_polling_status] = useState<PollingStatus>('connected');
  const [current_user_id, set_current_user_id] = useState<string | null>(null);

  // -------------------------------------------------------------------------
  // Refs (stable across renders)
  // -------------------------------------------------------------------------
  const cursor_ref = useRef<string | null>(null);
  const retry_count_ref = useRef(0);
  const user_profiles_cache_ref = useRef<Map<string, CacheEntry<HazoUserProfile>>>(new Map());
  const polling_timer_ref = useRef<ReturnType<typeof setTimeout> | null>(null);
  const is_mounted_ref = useRef(true);
  const is_polling_ref = useRef(false);

  // -------------------------------------------------------------------------
  // Memoized config to prevent effect re-runs
  // -------------------------------------------------------------------------
  const config = useMemo(
    () => ({
      receiver_user_id,
      reference_id,
      reference_type,
      api_base_url,
      realtime_mode,
      polling_interval,
      messages_per_page,
    }),
    [receiver_user_id, reference_id, reference_type, api_base_url, realtime_mode, polling_interval, messages_per_page]
  );

  // -------------------------------------------------------------------------
  // Cleanup on unmount
  // -------------------------------------------------------------------------
  useEffect(() => {
    is_mounted_ref.current = true;
    return () => {
      is_mounted_ref.current = false;
      if (polling_timer_ref.current) {
        clearTimeout(polling_timer_ref.current);
        polling_timer_ref.current = null;
      }
    };
  }, []);

  // -------------------------------------------------------------------------
  // User profile cache with TTL and eviction
  // -------------------------------------------------------------------------
  const get_cached_profile = useCallback((user_id: string): HazoUserProfile | null => {
    const entry = user_profiles_cache_ref.current.get(user_id);
    if (!entry) return null;

    // Check TTL
    if (Date.now() - entry.timestamp > PROFILE_CACHE_TTL) {
      user_profiles_cache_ref.current.delete(user_id);
      return null;
    }

    return entry.value;
  }, []);

  const set_cached_profile = useCallback((profile: HazoUserProfile): void => {
    // Evict oldest entries if cache is too large
    if (user_profiles_cache_ref.current.size >= PROFILE_CACHE_MAX_SIZE) {
      // Find and remove oldest entry
      let oldest_key: string | null = null;
      let oldest_timestamp = Infinity;

      user_profiles_cache_ref.current.forEach((entry, key) => {
        if (entry.timestamp < oldest_timestamp) {
          oldest_timestamp = entry.timestamp;
          oldest_key = key;
        }
      });

      if (oldest_key) {
        user_profiles_cache_ref.current.delete(oldest_key);
      }
    }

    user_profiles_cache_ref.current.set(profile.id, {
      value: profile,
      timestamp: Date.now(),
    });
  }, []);

  // -------------------------------------------------------------------------
  // Fetch user profiles via API (with cache)
  // -------------------------------------------------------------------------
  const fetch_user_profiles = useCallback(
    async (user_ids: string[]): Promise<Map<string, HazoUserProfile>> => {
      const result = new Map<string, HazoUserProfile>();
      const uncached_ids: string[] = [];

      // Check cache first
      user_ids.forEach((id) => {
        const cached = get_cached_profile(id);
        if (cached) {
          result.set(id, cached);
        } else {
          uncached_ids.push(id);
        }
      });

      // Fetch uncached profiles
      if (uncached_ids.length > 0) {
        try {
          const response = await fetch('/api/hazo_auth/profiles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_ids: uncached_ids }),
            credentials: 'include',
          });

          if (response.ok) {
            const data: ProfilesApiResponse = await response.json();
            if (data.success && data.profiles) {
              data.profiles.forEach((profile) => {
                set_cached_profile(profile);
                result.set(profile.id, profile);
              });
            }
          }
        } catch (err) {
          console.error('[useChatMessages] Failed to fetch user profiles:', err);
        }
      }

      return result;
    },
    [get_cached_profile, set_cached_profile]
  );

  // -------------------------------------------------------------------------
  // Transform DB messages to ChatMessage
  // -------------------------------------------------------------------------
  const transform_messages = useCallback(
    async (db_messages: ChatMessageDB[], user_id: string): Promise<ChatMessage[]> => {
      // Collect all unique user IDs
      const user_ids = new Set<string>();
      db_messages.forEach((msg) => {
        user_ids.add(msg.sender_user_id);
        user_ids.add(msg.receiver_user_id);
      });

      // Fetch profiles
      const profiles = await fetch_user_profiles(Array.from(user_ids));

      // Transform messages
      return db_messages.map((msg) => ({
        ...msg,
        sender_profile: profiles.get(msg.sender_user_id),
        receiver_profile: profiles.get(msg.receiver_user_id),
        is_sender: msg.sender_user_id === user_id,
        send_status: 'sent' as const,
      }));
    },
    [fetch_user_profiles]
  );

  // -------------------------------------------------------------------------
  // Calculate polling delay with exponential backoff
  // -------------------------------------------------------------------------
  const get_poll_delay = useCallback((): number => {
    if (retry_count_ref.current === 0) {
      return config.polling_interval;
    }
    // Exponential backoff: interval * 2^retryCount, capped at MAX_POLLING_DELAY
    const delay = config.polling_interval * Math.pow(2, retry_count_ref.current);
    return Math.min(delay, MAX_POLLING_DELAY);
  }, [config.polling_interval]);

  // -------------------------------------------------------------------------
  // Fetch messages via API with optional pagination
  // -------------------------------------------------------------------------
  const fetch_messages_from_api = useCallback(
    async (options?: {
      cursor?: string;
      direction?: 'older' | 'newer';
      limit?: number;
    }): Promise<{
      messages: ChatMessageDB[];
      user_id: string | null;
      has_more: boolean;
      next_cursor: string | null;
    }> => {
      if (!config.receiver_user_id) {
        return { messages: [], user_id: null, has_more: false, next_cursor: null };
      }

      try {
        const params = new URLSearchParams({
          receiver_user_id: config.receiver_user_id,
          limit: String(options?.limit || config.messages_per_page),
        });

        if (config.reference_id) {
          params.set('reference_id', config.reference_id);
        }
        if (config.reference_type) {
          params.set('reference_type', config.reference_type);
        }
        if (options?.cursor) {
          params.set('cursor', options.cursor);
          params.set('direction', options.direction || 'older');
        }

        const response = await fetch(`${config.api_base_url}/messages?${params.toString()}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data: MessagesApiResponse = await response.json();

        if (data.success) {
          return {
            messages: data.messages || [],
            user_id: data.current_user_id || null,
            has_more: data.pagination?.has_more ?? false,
            next_cursor: data.pagination?.next_cursor ?? null,
          };
        } else {
          throw new Error(data.error || 'Failed to fetch messages');
        }
      } catch (err) {
        console.error('[useChatMessages] Fetch error:', err);
        throw err;
      }
    },
    [config]
  );

  // -------------------------------------------------------------------------
  // Initial load
  // -------------------------------------------------------------------------
  const load_initial = useCallback(async () => {
    if (!config.receiver_user_id) {
      set_is_loading(false);
      return;
    }

    set_is_loading(true);
    set_error(null);

    try {
      const result = await fetch_messages_from_api();

      if (result.user_id && is_mounted_ref.current) {
        set_current_user_id(result.user_id);
      }

      if (is_mounted_ref.current) {
        const transformed = result.user_id
          ? await transform_messages(result.messages, result.user_id)
          : result.messages.map((msg) => ({
              ...msg,
              is_sender: false,
              send_status: 'sent' as const,
            }));

        // Sort messages in ascending order (oldest first, newest last)
        const sorted = transformed.sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );

        set_messages(sorted);
        set_has_more(result.has_more);
        cursor_ref.current = result.next_cursor;
        retry_count_ref.current = 0;
        set_polling_status('connected');
      }
    } catch (err) {
      if (is_mounted_ref.current) {
        set_error('Failed to load messages');
        set_polling_status('error');
      }
    } finally {
      if (is_mounted_ref.current) {
        set_is_loading(false);
      }
    }
  }, [config.receiver_user_id, fetch_messages_from_api, transform_messages]);

  // -------------------------------------------------------------------------
  // Load more (pagination)
  // -------------------------------------------------------------------------
  const load_more = useCallback(async () => {
    if (!current_user_id || !has_more || is_loading_more || !cursor_ref.current) {
      return;
    }

    set_is_loading_more(true);

    try {
      const result = await fetch_messages_from_api({
        cursor: cursor_ref.current,
        direction: 'older',
      });

      const transformed = await transform_messages(result.messages, current_user_id);

      if (is_mounted_ref.current) {
        set_messages((prev) => {
          // Prepend older messages and sort
          const combined = [...transformed, ...prev];
          return combined.sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        });
        set_has_more(result.has_more);
        // Update cursor to oldest message for next load_more
        if (result.messages.length > 0) {
          cursor_ref.current = result.messages[0].created_at;
        }
      }
    } catch (err) {
      console.error('[useChatMessages] Load more error:', err);
    } finally {
      if (is_mounted_ref.current) {
        set_is_loading_more(false);
      }
    }
  }, [current_user_id, has_more, is_loading_more, fetch_messages_from_api, transform_messages]);

  // -------------------------------------------------------------------------
  // Poll for new messages (uses setTimeout for proper backoff)
  // -------------------------------------------------------------------------
  const schedule_next_poll = useCallback(() => {
    if (!is_mounted_ref.current || config.realtime_mode !== 'polling' || !config.receiver_user_id) {
      return;
    }

    const delay = get_poll_delay();
    polling_timer_ref.current = setTimeout(async () => {
      if (!is_mounted_ref.current || is_polling_ref.current) {
        return;
      }

      is_polling_ref.current = true;

      try {
        // Fetch only newer messages since our latest
        const latest_message = messages[messages.length - 1];
        const result = await fetch_messages_from_api(
          latest_message
            ? { cursor: latest_message.created_at, direction: 'newer', limit: 50 }
            : undefined
        );

        if (result.messages.length > 0 && is_mounted_ref.current && current_user_id) {
          const transformed = await transform_messages(result.messages, current_user_id);

          set_messages((prev) => {
            // Merge new messages, avoiding duplicates
            const existing_ids = new Set(prev.map((m) => m.id));
            const new_messages = transformed.filter((m) => !existing_ids.has(m.id));

            if (new_messages.length > 0) {
              const combined = [...prev, ...new_messages];
              return combined.sort(
                (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              );
            }
            return prev;
          });
        }

        // Reset retry count on success
        retry_count_ref.current = 0;
        if (is_mounted_ref.current) {
          set_polling_status('connected');
        }
      } catch (err) {
        console.error('[useChatMessages] Polling error:', err);
        retry_count_ref.current += 1;

        if (is_mounted_ref.current) {
          if (retry_count_ref.current >= MAX_RETRY_ATTEMPTS) {
            set_polling_status('error');
          } else {
            set_polling_status('reconnecting');
          }
        }
      } finally {
        is_polling_ref.current = false;
        // Schedule next poll with updated delay (backoff applied via get_poll_delay)
        if (is_mounted_ref.current && config.realtime_mode === 'polling') {
          schedule_next_poll();
        }
      }
    }, delay);
  }, [config.realtime_mode, config.receiver_user_id, get_poll_delay, fetch_messages_from_api, transform_messages, messages, current_user_id]);

  // -------------------------------------------------------------------------
  // Start/stop polling based on realtime_mode
  // -------------------------------------------------------------------------
  useEffect(() => {
    // Clear any existing timer
    if (polling_timer_ref.current) {
      clearTimeout(polling_timer_ref.current);
      polling_timer_ref.current = null;
    }

    // Only start polling if mode is 'polling' and we have a receiver
    if (config.realtime_mode === 'polling' && config.receiver_user_id && current_user_id) {
      schedule_next_poll();
    } else if (config.realtime_mode === 'manual') {
      set_polling_status('connected');
    }

    return () => {
      if (polling_timer_ref.current) {
        clearTimeout(polling_timer_ref.current);
        polling_timer_ref.current = null;
      }
    };
  }, [config.realtime_mode, config.receiver_user_id, current_user_id, schedule_next_poll]);

  // -------------------------------------------------------------------------
  // Initial load effect
  // -------------------------------------------------------------------------
  useEffect(() => {
    load_initial();
  }, [load_initial]);

  // -------------------------------------------------------------------------
  // Send message via API
  // -------------------------------------------------------------------------
  const send_message = useCallback(
    async (payload: CreateMessagePayload): Promise<boolean> => {
      if (!current_user_id) {
        set_error('Not authenticated');
        return false;
      }

      // Create optimistic message with unique ID
      const optimistic_id = generateOptimisticId();
      const sender_profile = get_cached_profile(current_user_id);
      const receiver_profile = get_cached_profile(payload.receiver_user_id);

      const optimistic_message: ChatMessage = {
        id: optimistic_id,
        reference_id: payload.reference_id,
        reference_type: payload.reference_type,
        sender_user_id: current_user_id,
        receiver_user_id: payload.receiver_user_id,
        message_text: payload.message_text,
        reference_list: payload.reference_list || null,
        read_at: null,
        deleted_at: null,
        created_at: new Date().toISOString(),
        changed_at: new Date().toISOString(),
        sender_profile: sender_profile || undefined,
        receiver_profile: receiver_profile || undefined,
        is_sender: true,
        send_status: 'sending',
      };

      // Add optimistic message to state
      set_messages((prev) => {
        const updated = [...prev, optimistic_message];
        return updated.sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      });

      try {
        const response = await fetch(`${config.api_base_url}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            receiver_user_id: payload.receiver_user_id,
            message_text: payload.message_text,
            reference_id: payload.reference_id,
            reference_type: payload.reference_type,
          }),
        });

        const data: SendMessageApiResponse = await response.json();

        if (data.success && data.message && is_mounted_ref.current) {
          // Replace optimistic message with real one
          const real_message: ChatMessage = {
            ...data.message,
            reference_list: data.message.reference_list ?? null,
            read_at: data.message.read_at ?? null,
            deleted_at: data.message.deleted_at ?? null,
            changed_at: data.message.changed_at ?? data.message.created_at,
            sender_profile: sender_profile || undefined,
            receiver_profile: receiver_profile || undefined,
            is_sender: true,
            send_status: 'sent',
          };

          set_messages((prev) => {
            // Check if real message already exists (from polling)
            const real_message_exists = prev.some((msg) => msg.id === real_message.id);

            if (real_message_exists) {
              // Real message already exists from polling, just remove optimistic one
              return prev.filter((msg) => msg.id !== optimistic_id);
            } else {
              // Replace optimistic message with real one
              const replaced = prev.map((msg) =>
                msg.id === optimistic_id ? real_message : msg
              );
              return replaced.sort(
                (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              );
            }
          });
          return true;
        } else {
          throw new Error(data.error || 'Failed to send message');
        }
      } catch (err) {
        console.error('[useChatMessages] Send error:', err);

        // Mark optimistic message as failed
        if (is_mounted_ref.current) {
          set_messages((prev) =>
            prev.map((msg) =>
              msg.id === optimistic_id ? { ...msg, send_status: 'failed' as const } : msg
            )
          );
        }

        return false;
      }
    },
    [current_user_id, config.api_base_url, get_cached_profile]
  );

  // -------------------------------------------------------------------------
  // Delete message (soft delete) via API
  // -------------------------------------------------------------------------
  const delete_message = useCallback(
    async (message_id: string): Promise<boolean> => {
      if (!current_user_id) {
        return false;
      }

      // Find the message to verify ownership
      const message = messages.find((m) => m.id === message_id);
      if (!message || message.sender_user_id !== current_user_id) {
        set_error('Cannot delete this message');
        return false;
      }

      // Store original values for rollback
      const original_deleted_at = message.deleted_at;
      const original_message_text = message.message_text;

      // Optimistic update
      set_messages((prev) =>
        prev.map((msg) =>
          msg.id === message_id
            ? { ...msg, deleted_at: new Date().toISOString(), message_text: null }
            : msg
        )
      );

      try {
        const response = await fetch(`${config.api_base_url}/messages/${message_id}`, {
          method: 'DELETE',
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to delete message');
        }

        return true;
      } catch (err) {
        console.error('[useChatMessages] Delete error:', err);

        // Rollback on error
        if (is_mounted_ref.current) {
          set_messages((prev) =>
            prev.map((msg) =>
              msg.id === message_id
                ? { ...msg, deleted_at: original_deleted_at, message_text: original_message_text }
                : msg
            )
          );
        }

        return false;
      }
    },
    [current_user_id, messages, config.api_base_url]
  );

  // -------------------------------------------------------------------------
  // Mark as read via API
  // -------------------------------------------------------------------------
  const mark_as_read = useCallback(
    async (message_id: string): Promise<void> => {
      if (!current_user_id) {
        return;
      }

      const message = messages.find((m) => m.id === message_id);
      if (!message || message.read_at || message.sender_user_id === current_user_id) {
        return;
      }

      try {
        const response = await fetch(`${config.api_base_url}/messages/${message_id}/read`, {
          method: 'PATCH',
          credentials: 'include',
        });

        if (!response.ok) {
          console.error('[useChatMessages] Mark as read failed:', response.status);
          return;
        }

        const data = await response.json();
        if (data.success && is_mounted_ref.current) {
          set_messages((prev) =>
            prev.map((msg) =>
              msg.id === message_id
                ? { ...msg, read_at: data.message?.read_at || new Date().toISOString() }
                : msg
            )
          );
        }
      } catch (err) {
        console.error('[useChatMessages] Mark as read error:', err);
      }
    },
    [current_user_id, messages, config.api_base_url]
  );

  // -------------------------------------------------------------------------
  // Refresh
  // -------------------------------------------------------------------------
  const refresh = useCallback(() => {
    cursor_ref.current = null;
    retry_count_ref.current = 0;
    set_messages([]);
    load_initial();
  }, [load_initial]);

  // -------------------------------------------------------------------------
  // Return
  // -------------------------------------------------------------------------
  return {
    messages,
    is_loading,
    is_loading_more,
    has_more,
    error,
    polling_status,
    load_more,
    send_message,
    delete_message,
    mark_as_read,
    refresh
  };
}
