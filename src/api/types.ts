/**
 * API Handler Types
 *
 * Shared types for the exportable API route handlers.
 * These are used by consumers when setting up their API routes.
 */

import type { NextRequest } from 'next/server';

// ============================================================================
// Standardized API Response Types
// ============================================================================

/**
 * Standardized error response format for all API endpoints
 */
export interface ApiErrorResponse {
  success: false;
  error: string;
  error_code?: string;
  details?: Record<string, unknown>;
}

/**
 * Standardized success response format for all API endpoints
 */
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
}

/**
 * Pagination metadata included in list responses
 */
export interface PaginationMeta {
  limit: number;
  has_more: boolean;
  next_cursor: string | null;
  prev_cursor: string | null;
}

// ============================================================================
// Handler Options
// ============================================================================

/**
 * Options for creating message API handlers
 */
export interface MessagesHandlerOptions {
  /**
   * Function to get the hazo_connect adapter instance.
   * Called on each request to get a fresh connection.
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
   * Optional function to extract user ID from the request.
   * Defaults to reading from 'hazo_auth_user_id' cookie.
   *
   * @example
   * ```typescript
   * // Custom auth extraction
   * const options = {
   *   getUserIdFromRequest: (request) => {
   *     const token = request.headers.get('Authorization');
   *     return decodeToken(token)?.userId || null;
   *   }
   * };
   * ```
   */
  getUserIdFromRequest?: (request: NextRequest) => string | null | Promise<string | null>;
}

/**
 * Chat message input for creating new messages
 */
export interface ChatMessageInput {
  chat_group_id: string;
  message_text: string;
  reference_id?: string;
  reference_type?: string;
}

/**
 * Chat message database record
 */
export interface ChatMessageRecord {
  id: string;
  reference_id: string;
  reference_type: string;
  sender_user_id: string;
  chat_group_id: string;
  message_text: string;
  reference_list: string | null;
  read_at: string | null;
  deleted_at: string | null;
  created_at: string;
  changed_at: string;
  [key: string]: unknown;
}

/**
 * Chat group user membership record
 */
export interface ChatGroupUserRecord {
  chat_group_id: string;
  user_id: string;
  role: 'client' | 'staff' | 'owner' | 'admin' | 'member';
  created_at: string;
  changed_at: string | null;
  [key: string]: unknown;
}

/**
 * Chat group database record
 */
export interface ChatGroupRecord {
  id: string;
  client_user_id: string | null;
  group_type: 'support' | 'peer' | 'group' | null;
  name: string | null;
  created_at: string;
  changed_at: string | null;
  [key: string]: unknown;
}






