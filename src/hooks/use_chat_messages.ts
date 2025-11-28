/**
 * useChatMessages Hook
 * 
 * Manages chat messages with:
 * - Cursor-based pagination (infinite scroll)
 * - Polling for new messages with configurable interval
 * - Optimistic updates for sent messages
 * - Soft delete functionality
 * - Exponential backoff on errors
 * 
 * Uses fetch() to call API endpoints instead of direct database access.
 * This allows the hook to work in client components without Node.js dependencies.
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  ChatMessage,
  ChatMessageDB,
  CreateMessagePayload,
  HazoUserProfile,
  UseChatMessagesReturn,
  PollingStatus
} from '../types/index.js';
import {
  DEFAULT_REALTIME_MODE,
  DEFAULT_POLLING_INTERVAL,
  DEFAULT_MESSAGES_PER_PAGE,
  MAX_RETRY_ATTEMPTS,
  RETRY_BASE_DELAY
} from '../lib/constants.js';
import type { RealtimeMode } from '../types/index.js';

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
// API Response Types
// ============================================================================

interface MessagesApiResponse {
  success: boolean;
  messages?: ChatMessageDB[];
  current_user_id?: string;
  error?: string;
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
// Hook Implementation
// ============================================================================

export function useChatMessages({
  receiver_user_id,
  reference_id = '',
  reference_type = 'chat',
  api_base_url = '/api/hazo_chat',
  realtime_mode = DEFAULT_REALTIME_MODE,
  polling_interval = DEFAULT_POLLING_INTERVAL,
  messages_per_page = DEFAULT_MESSAGES_PER_PAGE
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
  // Refs
  // -------------------------------------------------------------------------
  const cursor_ref = useRef(0);
  const retry_count_ref = useRef(0);
  const user_profiles_cache_ref = useRef<Map<string, HazoUserProfile>>(new Map());
  const polling_timer_ref = useRef<NodeJS.Timeout | null>(null);
  const is_mounted_ref = useRef(true);

  // -------------------------------------------------------------------------
  // Cleanup on unmount
  // -------------------------------------------------------------------------
  useEffect(() => {
    is_mounted_ref.current = true;
    return () => {
      is_mounted_ref.current = false;
      if (polling_timer_ref.current) {
        clearInterval(polling_timer_ref.current);
      }
    };
  }, []);

  // -------------------------------------------------------------------------
  // Fetch user profiles via API
  // -------------------------------------------------------------------------
  const fetch_user_profiles = useCallback(
    async (user_ids: string[]): Promise<Map<string, HazoUserProfile>> => {
      const uncached_ids = user_ids.filter(
        (id) => !user_profiles_cache_ref.current.has(id)
      );

      if (uncached_ids.length > 0) {
        try {
          // Use the hazo_auth profiles endpoint
          const response = await fetch('/api/hazo_auth/profiles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_ids: uncached_ids }),
            credentials: 'include'
          });

          if (response.ok) {
            const data: ProfilesApiResponse = await response.json();
            if (data.success && data.profiles) {
              data.profiles.forEach((profile) => {
                user_profiles_cache_ref.current.set(profile.id, profile);
              });
            }
          }
        } catch (err) {
          console.error('[useChatMessages] Failed to fetch user profiles:', err);
        }
      }

      return user_profiles_cache_ref.current;
    },
    []
  );

  // -------------------------------------------------------------------------
  // Transform DB messages to ChatMessage
  // -------------------------------------------------------------------------
  const transform_messages = useCallback(
    async (
      db_messages: ChatMessageDB[],
      user_id: string
    ): Promise<ChatMessage[]> => {
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
        send_status: 'sent' as const
      }));
    },
    [fetch_user_profiles]
  );

  // -------------------------------------------------------------------------
  // Fetch messages via API
  // -------------------------------------------------------------------------
  const fetch_messages_from_api = useCallback(
    async (): Promise<{ messages: ChatMessageDB[]; user_id: string | null }> => {
      if (!receiver_user_id) {
        return { messages: [], user_id: null };
      }

      try {
        const params = new URLSearchParams({
          receiver_user_id,
          ...(reference_id && { reference_id }),
          ...(reference_type && { reference_type }),
        });

        const response = await fetch(`${api_base_url}/messages?${params.toString()}`, {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data: MessagesApiResponse = await response.json();

        if (data.success) {
          return {
            messages: data.messages || [],
            user_id: data.current_user_id || null
          };
        } else {
          throw new Error(data.error || 'Failed to fetch messages');
        }
      } catch (err) {
        console.error('[useChatMessages] Fetch error:', err);
        throw err;
      }
    },
    [receiver_user_id, reference_id, reference_type, api_base_url]
  );

  // -------------------------------------------------------------------------
  // Initial load
  // -------------------------------------------------------------------------
  const load_initial = useCallback(async () => {
    if (!receiver_user_id) {
      set_is_loading(false);
      return;
    }

    set_is_loading(true);
    set_error(null);

    try {
      const { messages: db_messages, user_id } = await fetch_messages_from_api();
      
      if (user_id && is_mounted_ref.current) {
        set_current_user_id(user_id);
      }

      if (is_mounted_ref.current) {
        const transformed = user_id 
          ? await transform_messages(db_messages, user_id)
          : db_messages.map(msg => ({ ...msg, is_sender: false, send_status: 'sent' as const }));
        
        set_messages(transformed);
        set_has_more(db_messages.length >= messages_per_page);
        cursor_ref.current = db_messages.length;
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
  }, [receiver_user_id, fetch_messages_from_api, transform_messages, messages_per_page]);

  // -------------------------------------------------------------------------
  // Load more (pagination) - Note: simplified, API should support pagination params
  // -------------------------------------------------------------------------
  const load_more = useCallback(async () => {
    if (!current_user_id || !has_more || is_loading_more) {
      return;
    }

    set_is_loading_more(true);

    try {
      // For now, reload all messages - pagination can be added to API later
      const { messages: db_messages } = await fetch_messages_from_api();
      const transformed = await transform_messages(db_messages, current_user_id);

      if (is_mounted_ref.current) {
        set_messages(transformed);
        set_has_more(false); // Simplified - loaded all
        cursor_ref.current = db_messages.length;
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
  // Poll for new messages
  // -------------------------------------------------------------------------
  const poll_for_new_messages = useCallback(async () => {
    if (!current_user_id || !receiver_user_id) {
      return;
    }

    try {
      const { messages: db_messages } = await fetch_messages_from_api();

      if (db_messages.length > 0 && is_mounted_ref.current) {
        const transformed = await transform_messages(db_messages, current_user_id);
        
        set_messages((prev) => {
          // Merge new messages, avoiding duplicates
          const existing_ids = new Set(prev.map(m => m.id));
          const new_messages = transformed.filter(m => !existing_ids.has(m.id));
          
          if (new_messages.length > 0) {
            // Combine and sort by created_at
            const combined = [...prev, ...new_messages];
            combined.sort((a, b) => 
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
            return combined;
          }
          return prev;
        });
      }

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
    }
  }, [current_user_id, receiver_user_id, fetch_messages_from_api, transform_messages]);

  // -------------------------------------------------------------------------
  // Start polling (only if realtime_mode is 'polling')
  // -------------------------------------------------------------------------
  useEffect(() => {
    // Only start polling if mode is 'polling'
    if (realtime_mode !== 'polling' || !receiver_user_id) {
      // Clear any existing timer if switching to manual mode
      if (polling_timer_ref.current) {
        clearInterval(polling_timer_ref.current);
        polling_timer_ref.current = null;
      }
      // Set status to connected for manual mode (no polling needed)
      if (realtime_mode === 'manual') {
        set_polling_status('connected');
      }
      return;
    }

    // Clear any existing timer
    if (polling_timer_ref.current) {
      clearInterval(polling_timer_ref.current);
    }

    // Calculate delay with exponential backoff
    const get_poll_delay = () => {
      if (retry_count_ref.current === 0) {
        return polling_interval;
      }
      return Math.min(
        polling_interval * Math.pow(2, retry_count_ref.current),
        RETRY_BASE_DELAY * 30 // Cap at 30 seconds
      );
    };

    const start_polling = () => {
      polling_timer_ref.current = setInterval(() => {
        poll_for_new_messages();
      }, get_poll_delay());
    };

    start_polling();

    return () => {
      if (polling_timer_ref.current) {
        clearInterval(polling_timer_ref.current);
      }
    };
  }, [receiver_user_id, realtime_mode, polling_interval, poll_for_new_messages]);

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

      // Create optimistic message
      const optimistic_id = `optimistic-${Date.now()}`;
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
        sender_profile: user_profiles_cache_ref.current.get(current_user_id),
        receiver_profile: user_profiles_cache_ref.current.get(payload.receiver_user_id),
        is_sender: true,
        send_status: 'sending'
      };

      // Add optimistic message to state
      set_messages((prev) => [...prev, optimistic_message]);

      try {
        const response = await fetch(`${api_base_url}/messages`, {
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
            // Ensure all required fields are set with proper defaults
            reference_list: data.message.reference_list ?? null,
            read_at: data.message.read_at ?? null,
            deleted_at: data.message.deleted_at ?? null,
            changed_at: data.message.changed_at ?? data.message.created_at,
            sender_profile: user_profiles_cache_ref.current.get(current_user_id),
            receiver_profile: user_profiles_cache_ref.current.get(payload.receiver_user_id),
            is_sender: true,
            send_status: 'sent'
          };

          set_messages((prev) => {
            // Check if real message already exists (from polling)
            const real_message_exists = prev.some(msg => msg.id === real_message.id);
            
            if (real_message_exists) {
              // Real message already exists from polling, just remove optimistic one
              return prev.filter(msg => msg.id !== optimistic_id);
            } else {
              // Replace optimistic message with real one
              const replaced = prev.map((msg) =>
                msg.id === optimistic_id ? real_message : msg
              );
              // Sort to ensure correct chronological order
              return replaced.sort((a, b) => 
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
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
              msg.id === optimistic_id
                ? { ...msg, send_status: 'failed' as const }
                : msg
            )
          );
        }

        return false;
      }
    },
    [current_user_id, api_base_url]
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

      // Optimistic update
      set_messages((prev) =>
        prev.map((msg) =>
          msg.id === message_id
            ? { ...msg, deleted_at: new Date().toISOString(), message_text: null }
            : msg
        )
      );

      try {
        const response = await fetch(`${api_base_url}/messages/${message_id}`, {
          method: 'DELETE',
          credentials: 'include'
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
                ? { ...msg, deleted_at: message.deleted_at, message_text: message.message_text }
                : msg
            )
          );
        }

        return false;
      }
    },
    [current_user_id, messages, api_base_url]
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
        const response = await fetch(`${api_base_url}/messages/${message_id}/read`, {
          method: 'PATCH',
          credentials: 'include'
        });

        if (response.ok && is_mounted_ref.current) {
          set_messages((prev) =>
            prev.map((msg) =>
              msg.id === message_id
                ? { ...msg, read_at: new Date().toISOString() }
                : msg
            )
          );
        }
      } catch (err) {
        console.error('[useChatMessages] Mark as read error:', err);
      }
    },
    [current_user_id, messages, api_base_url]
  );

  // -------------------------------------------------------------------------
  // Refresh
  // -------------------------------------------------------------------------
  const refresh = useCallback(() => {
    cursor_ref.current = 0;
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
