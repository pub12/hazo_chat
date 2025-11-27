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
 * Uses hazo_connect's createTableQuery for database operations.
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createTableQuery, type ExecutableQueryBuilder } from 'hazo_connect/server';
import type { HazoConnectAdapter } from 'hazo_connect';
import type {
  ChatMessage,
  ChatMessageDB,
  CreateMessagePayload,
  HazoAuthInstance,
  HazoUserProfile,
  UseChatMessagesReturn,
  PollingStatus,
  ChatReferenceItem
} from '../types/index.js';
import {
  DEFAULT_POLLING_INTERVAL,
  DEFAULT_MESSAGES_PER_PAGE,
  MAX_RETRY_ATTEMPTS,
  RETRY_BASE_DELAY
} from '../lib/constants.js';

// ============================================================================
// Hook Parameters
// ============================================================================

interface UseChatMessagesParams {
  hazo_connect: HazoConnectAdapter;
  hazo_auth: HazoAuthInstance;
  reference_id?: string;
  receiver_user_id: string;
  polling_interval?: number;
  messages_per_page?: number;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useChatMessages({
  hazo_connect,
  hazo_auth,
  reference_id,
  receiver_user_id,
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
  // Get current user on mount
  // -------------------------------------------------------------------------
  useEffect(() => {
    async function get_current_user() {
      try {
        const auth_user = await hazo_auth.hazo_get_auth();
        if (auth_user && is_mounted_ref.current) {
          set_current_user_id(auth_user.id);
        }
      } catch (err) {
        console.error('[useChatMessages] Failed to get current user:', err);
      }
    }
    get_current_user();

    return () => {
      is_mounted_ref.current = false;
    };
  }, [hazo_auth]);

  // -------------------------------------------------------------------------
  // Fetch user profiles
  // -------------------------------------------------------------------------
  const fetch_user_profiles = useCallback(
    async (user_ids: string[]): Promise<Map<string, HazoUserProfile>> => {
      const uncached_ids = user_ids.filter(
        (id) => !user_profiles_cache_ref.current.has(id)
      );

      if (uncached_ids.length > 0) {
        try {
          const profiles = await hazo_auth.hazo_get_user_profiles(uncached_ids);
          profiles.forEach((profile) => {
            user_profiles_cache_ref.current.set(profile.id, profile);
          });
        } catch (err) {
          console.error('[useChatMessages] Failed to fetch user profiles:', err);
        }
      }

      return user_profiles_cache_ref.current;
    },
    [hazo_auth]
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
  // Fetch messages
  // -------------------------------------------------------------------------
  const fetch_messages = useCallback(
    async (cursor: number, limit: number): Promise<ChatMessageDB[]> => {
      if (!reference_id || !current_user_id) {
        return [];
      }

      try {
        // Use createTableQuery to get an executable query builder
        const query = createTableQuery(hazo_connect, 'hazo_chat')
          .select('*')
          .where('reference_id', 'eq', reference_id)
          .whereOr([
            { field: 'sender_user_id', operator: 'eq', value: current_user_id },
            { field: 'receiver_user_id', operator: 'eq', value: current_user_id }
          ])
          .order('created_at', 'desc')
          .limit(limit)
          .offset(cursor);

        // Execute returns data directly
        const data = await query.execute('GET');
        return (data as ChatMessageDB[]) || [];
      } catch (err) {
        console.error('[useChatMessages] Fetch error:', err);
        throw err;
      }
    },
    [hazo_connect, reference_id, current_user_id]
  );

  // -------------------------------------------------------------------------
  // Initial load
  // -------------------------------------------------------------------------
  const load_initial = useCallback(async () => {
    if (!current_user_id || !reference_id) {
      set_is_loading(false);
      return;
    }

    set_is_loading(true);
    set_error(null);

    try {
      const db_messages = await fetch_messages(0, messages_per_page);
      const transformed = await transform_messages(db_messages, current_user_id);
      
      if (is_mounted_ref.current) {
        set_messages(transformed);
        set_has_more(db_messages.length === messages_per_page);
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
  }, [current_user_id, reference_id, fetch_messages, transform_messages, messages_per_page]);

  // -------------------------------------------------------------------------
  // Load more (pagination)
  // -------------------------------------------------------------------------
  const load_more = useCallback(async () => {
    if (!current_user_id || !has_more || is_loading_more) {
      return;
    }

    set_is_loading_more(true);

    try {
      const db_messages = await fetch_messages(
        cursor_ref.current,
        messages_per_page
      );
      const transformed = await transform_messages(db_messages, current_user_id);

      if (is_mounted_ref.current) {
        set_messages((prev) => [...prev, ...transformed]);
        set_has_more(db_messages.length === messages_per_page);
        cursor_ref.current += db_messages.length;
      }
    } catch (err) {
      console.error('[useChatMessages] Load more error:', err);
    } finally {
      if (is_mounted_ref.current) {
        set_is_loading_more(false);
      }
    }
  }, [current_user_id, has_more, is_loading_more, fetch_messages, transform_messages, messages_per_page]);

  // -------------------------------------------------------------------------
  // Poll for new messages
  // -------------------------------------------------------------------------
  const poll_for_new_messages = useCallback(async () => {
    if (!current_user_id || !reference_id) {
      return;
    }

    try {
      // Only fetch messages newer than the newest one we have
      const newest_timestamp = messages.length > 0 ? messages[0].created_at : null;

      // Build query using createTableQuery
      let query = createTableQuery(hazo_connect, 'hazo_chat')
        .select('*')
        .where('reference_id', 'eq', reference_id)
        .whereOr([
          { field: 'sender_user_id', operator: 'eq', value: current_user_id },
          { field: 'receiver_user_id', operator: 'eq', value: current_user_id }
        ])
        .order('created_at', 'desc');

      // If we have messages, only fetch newer ones
      if (newest_timestamp) {
        query = query.where('created_at', 'gt', newest_timestamp);
      }

      // Execute with limit
      const data = await query.limit(50).execute('GET');
      const new_messages = (data as ChatMessageDB[]) || [];

      if (new_messages.length > 0 && is_mounted_ref.current) {
        const transformed = await transform_messages(new_messages, current_user_id);
        set_messages((prev) => {
          // Filter out any optimistic messages that now have real versions
          const filtered = prev.filter(
            (msg) => !new_messages.some((nm) => nm.id === msg.id)
          );
          return [...transformed, ...filtered];
        });
        cursor_ref.current += new_messages.length;
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
  }, [current_user_id, reference_id, messages, hazo_connect, transform_messages]);

  // -------------------------------------------------------------------------
  // Start polling
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!current_user_id || !reference_id) {
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
  }, [current_user_id, reference_id, polling_interval, poll_for_new_messages]);

  // -------------------------------------------------------------------------
  // Initial load effect
  // -------------------------------------------------------------------------
  useEffect(() => {
    load_initial();
  }, [load_initial]);

  // -------------------------------------------------------------------------
  // Send message
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
      set_messages((prev) => [optimistic_message, ...prev]);

      try {
        const insert_data = {
          reference_id: payload.reference_id,
          reference_type: payload.reference_type,
          sender_user_id: current_user_id,
          receiver_user_id: payload.receiver_user_id,
          message_text: payload.message_text,
          reference_list: payload.reference_list || null
        };

        // Use createTableQuery for insert - execute with POST and body
        const query = createTableQuery(hazo_connect, 'hazo_chat');
        const data = await query.execute('POST', insert_data);
        const result = Array.isArray(data) ? data[0] : data;

        // Replace optimistic message with real one
        if (result && is_mounted_ref.current) {
          const real_message: ChatMessage = {
            ...(result as ChatMessageDB),
            sender_profile: user_profiles_cache_ref.current.get(current_user_id),
            receiver_profile: user_profiles_cache_ref.current.get(payload.receiver_user_id),
            is_sender: true,
            send_status: 'sent'
          };

          set_messages((prev) =>
            prev.map((msg) =>
              msg.id === optimistic_id ? real_message : msg
            )
          );
        }

        return true;
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
    [current_user_id, hazo_connect]
  );

  // -------------------------------------------------------------------------
  // Delete message (soft delete)
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
        const update_data = { deleted_at: new Date().toISOString() };
        const query = createTableQuery(hazo_connect, 'hazo_chat')
          .where('id', 'eq', message_id)
          .where('sender_user_id', 'eq', current_user_id);

        await query.execute('PATCH', update_data);
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
    [current_user_id, messages, hazo_connect]
  );

  // -------------------------------------------------------------------------
  // Mark as read
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
        const update_data = { read_at: new Date().toISOString() };
        const query = createTableQuery(hazo_connect, 'hazo_chat')
          .where('id', 'eq', message_id)
          .where('receiver_user_id', 'eq', current_user_id);

        await query.execute('PATCH', update_data);

        // Update local state
        if (is_mounted_ref.current) {
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
    [current_user_id, messages, hazo_connect]
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

