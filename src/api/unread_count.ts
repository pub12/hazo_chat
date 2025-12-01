/**
 * Unread Count Library Function Factory
 * 
 * Creates a function to get unread message counts grouped by reference_id
 * for a given receiver user ID.
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
 * const unreadCounts = await getUnreadCount('receiver-user-id-123');
 * // Returns: [{ reference_id: 'ref-1', count: 5 }, { reference_id: 'ref-2', count: 3 }]
 * ```
 */

import { createCrudService } from 'hazo_connect/server';
import type { HazoConnectAdapter } from 'hazo_connect';
import type { ChatMessageRecord } from './types.js';

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
}

/**
 * Result type for unread count function
 */
export interface UnreadCountResult {
  /** The reference ID */
  reference_id: string;
  /** Number of unread messages for this reference */
  count: number;
}

/**
 * Creates a function to get unread message counts by reference_id
 * 
 * @param options - Configuration options
 * @returns Function that takes receiver_user_id and returns unread counts
 */
export function createUnreadCountFunction(options: UnreadCountFunctionOptions) {
  const { getHazoConnect } = options;

  /**
   * Get unread message counts grouped by reference_id for a receiver user
   * 
   * @param receiver_user_id - The user ID to get unread counts for
   * @returns Array of objects with reference_id and count of unread messages
   */
  return async function hazo_chat_get_unread_count(
    receiver_user_id: string
  ): Promise<UnreadCountResult[]> {
    try {
      if (!receiver_user_id || receiver_user_id.trim() === '') {
        console.error('[hazo_chat_get_unread_count] Missing receiver_user_id');
        return [];
      }

      console.log('[hazo_chat_get_unread_count] Fetching unread counts for:', {
        receiver_user_id,
      });

      // Get hazo_connect instance and create CRUD service
      const hazoConnect = getHazoConnect() as HazoConnectAdapter;
      const chatService = createCrudService<ChatMessageRecord>(hazoConnect, 'hazo_chat');

      // Fetch all unread messages for this receiver
      const unread_messages = await chatService.list((qb) => {
        return qb
          .select('*')
          .where('receiver_user_id', 'eq', receiver_user_id)
          .where('read_at', 'is', null)
          .where('deleted_at', 'is', null);
      });

      // Group by reference_id and count
      const count_map = new Map<string, number>();

      for (const message of unread_messages) {
        const ref_id = message.reference_id || '';
        const current_count = count_map.get(ref_id) || 0;
        count_map.set(ref_id, current_count + 1);
      }

      // Convert map to array of results
      const results: UnreadCountResult[] = Array.from(count_map.entries()).map(
        ([reference_id, count]) => ({
          reference_id,
          count,
        })
      );

      // Sort by count descending (most unread first)
      results.sort((a, b) => b.count - a.count);

      console.log('[hazo_chat_get_unread_count] Found unread counts:', {
        receiver_user_id,
        total_references: results.length,
        total_unread: unread_messages.length,
      });

      return results;
    } catch (error) {
      const error_message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[hazo_chat_get_unread_count] Error:', error_message, error);
      
      // Return empty array on error rather than throwing
      return [];
    }
  };
}


