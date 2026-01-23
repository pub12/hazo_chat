/**
 * Unread Count Library Function Factory
 *
 * Creates a function to get unread message counts grouped by chat_group_id
 * for a given user who is a member of those groups.
 *
 * @example
 * ```typescript
 * // In your server-side code
 * import { createUnreadCountFunction } from 'hazo_chat/api';
 * import { getHazoConnectSingleton } from 'hazo_connect/nextjs/setup';
 *
 * const getUnreadCount = createUnreadCountFunction({
 *   getHazoConnect: () => getHazoConnectSingleton()
 * });
 *
 * // Use the function
 * const unreadCounts = await getUnreadCount({ user_id: 'user-123' });
 * // Returns: [{ chat_group_id: 'group-1', count: 5 }, { chat_group_id: 'group-2', count: 3 }]
 * ```
 */

import { createCrudService } from 'hazo_connect/server';
import type { HazoConnectAdapter } from 'hazo_connect';
import type { Logger } from 'hazo_logs';
import type { ChatMessageRecord, ChatGroupUserRecord } from './types.js';
import { is_valid_uuid, validate_uuid_array } from './validation.js';

/**
 * Options for creating the unread count function
 */
export interface UnreadCountFunctionOptions {
  /**
   * Function to get the hazo_connect adapter instance.
   * Called each time the function is invoked to get a fresh connection.
   *
   * @example
   * ```typescript
   * import { getHazoConnectSingleton } from 'hazo_connect/nextjs/setup';
   *
   * const options = {
   *   getHazoConnect: () => getHazoConnectSingleton()
   * };
   * ```
   */
  getHazoConnect: () => unknown;

  /**
   * Function to get the logger instance from hazo_logs.
   * Required for structured logging.
   *
   * @example
   * ```typescript
   * import { createLogger } from 'hazo_logs';
   *
   * const logger = createLogger('hazo_chat');
   * const options = {
   *   getLogger: () => logger
   * };
   * ```
   */
  getLogger: () => Logger;
}

/**
 * Parameters for getting unread counts
 */
export interface UnreadCountParams {
  /** The user ID to get unread counts for */
  user_id: string;
  /** Optional: Filter by specific chat group IDs. If not provided, returns counts for all groups the user belongs to */
  chat_group_ids?: string[];
}

/**
 * Result type for unread count function
 */
export interface UnreadCountResult {
  /** The chat group ID */
  chat_group_id: string;
  /** Number of unread messages in this group */
  count: number;
}

/**
 * Creates a function to get unread message counts by chat_group_id
 *
 * @param options - Configuration options
 * @returns Function that takes UnreadCountParams and returns unread counts
 */
export function createUnreadCountFunction(options: UnreadCountFunctionOptions) {
  const { getHazoConnect, getLogger } = options;
  const logger = getLogger();

  /**
   * Get unread message counts grouped by chat_group_id for a user
   *
   * @param params - The parameters including user_id and optional chat_group_ids filter
   * @returns Array of objects with chat_group_id and count of unread messages
   */
  return async function hazo_chat_get_unread_count(
    params: UnreadCountParams
  ): Promise<UnreadCountResult[]> {
    try {
      let { user_id, chat_group_ids } = params;

      if (!user_id || user_id.trim() === '') {
        logger.error('[hazo_chat_get_unread_count] Missing user_id');
        return [];
      }

      // Validate user_id format before database queries
      if (!is_valid_uuid(user_id)) {
        logger.debug('[hazo_chat_get_unread_count] Invalid user_id format:', { user_id });
        return [];
      }

      // Validate chat_group_ids if provided (lenient mode: filter to valid IDs only)
      if (chat_group_ids && chat_group_ids.length > 0) {
        const validation = validate_uuid_array(chat_group_ids);
        if (!validation.all_valid) {
          logger.debug('[hazo_chat_get_unread_count] Invalid chat_group_ids:', {
            invalid: validation.invalid,
          });
          if (validation.valid.length === 0) {
            return [];
          }
          // Continue with only valid IDs (lenient mode)
          chat_group_ids = validation.valid;
        }
      }

      logger.info('[hazo_chat_get_unread_count] Fetching unread counts for:', {
        user_id,
        chat_group_ids,
      });

      // Get hazo_connect instance
      const hazoConnect = getHazoConnect() as HazoConnectAdapter;

      // First, get all groups the user is a member of
      const membershipService = createCrudService<ChatGroupUserRecord>(
        hazoConnect,
        'hazo_chat_group_users'
      );

      const memberships = await membershipService.list((qb) =>
        qb.select('*').where('user_id', 'eq', user_id)
      );

      if (memberships.length === 0) {
        logger.info('[hazo_chat_get_unread_count] User is not a member of any groups');
        return [];
      }

      // Get the group IDs to check (either filtered or all)
      const user_group_ids = memberships.map((m) => m.chat_group_id);
      const groups_to_check = chat_group_ids
        ? chat_group_ids.filter((id) => user_group_ids.includes(id))
        : user_group_ids;

      if (groups_to_check.length === 0) {
        logger.info('[hazo_chat_get_unread_count] No matching groups to check');
        return [];
      }

      // Fetch all unread messages from those groups (excluding user's own messages)
      const chatService = createCrudService<ChatMessageRecord>(hazoConnect, 'hazo_chat');

      // We need to query each group and aggregate
      // Since hazo_connect may not support IN clause directly, fetch all messages and filter
      const all_unread_messages: ChatMessageRecord[] = [];

      for (const group_id of groups_to_check) {
        const group_messages = await chatService.list((qb) =>
          qb
            .select('*')
            .where('chat_group_id', 'eq', group_id)
            .where('read_at', 'is', null)
            .where('deleted_at', 'is', null)
        );

        // Filter out messages sent by the current user (they don't count as unread for sender)
        const unread_for_user = group_messages.filter(
          (msg) => msg.sender_user_id !== user_id
        );

        all_unread_messages.push(...unread_for_user);
      }

      // Group by chat_group_id and count
      const count_map = new Map<string, number>();

      for (const message of all_unread_messages) {
        const group_id = message.chat_group_id;
        const current_count = count_map.get(group_id) || 0;
        count_map.set(group_id, current_count + 1);
      }

      // Convert map to array of results
      const results: UnreadCountResult[] = Array.from(count_map.entries()).map(
        ([chat_group_id, count]) => ({
          chat_group_id,
          count,
        })
      );

      // Sort by count descending (most unread first)
      results.sort((a, b) => b.count - a.count);

      logger.info('[hazo_chat_get_unread_count] Found unread counts:', {
        user_id,
        total_groups: results.length,
        total_unread: all_unread_messages.length,
      });

      return results;
    } catch (error) {
      const error_message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('[hazo_chat_get_unread_count] Error:', { error_message, error });

      // Return empty array on error rather than throwing
      return [];
    }
  };
}
