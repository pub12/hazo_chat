/**
 * Messages API Handler Factory
 *
 * Creates GET, POST, and DELETE handlers for the /api/hazo_chat/messages endpoint.
 * These handlers should be used in a Next.js API route.
 *
 * @example
 * ```typescript
 * // app/api/hazo_chat/messages/route.ts
 * import { createMessagesHandler } from 'hazo_chat/api';
 * import { getHazoConnectSingleton } from 'hazo_connect/nextjs/setup';
 *
 * export const dynamic = 'force-dynamic';
 *
 * const { GET, POST } = createMessagesHandler({
 *   getHazoConnect: () => getHazoConnectSingleton()
 * });
 *
 * export { GET, POST };
 * ```
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createCrudService, getSqliteAdminService } from 'hazo_connect/server';
import type { HazoConnectAdapter } from 'hazo_connect';
import type { Logger } from 'hazo_logs';
import type { MessagesHandlerOptions, ChatMessageInput, ChatMessageRecord, ChatGroupUserRecord, ApiErrorResponse, ApiSuccessResponse } from './types.js';
import { is_valid_uuid } from './validation.js';

// ============================================================================
// Constants for validation
// ============================================================================

/** Maximum message length in characters */
const MAX_MESSAGE_LENGTH = 5000;

/** Maximum length for reference_id */
const MAX_REFERENCE_ID_LENGTH = 255;

/** Maximum length for reference_type */
const MAX_REFERENCE_TYPE_LENGTH = 100;

/** Default messages per page */
const DEFAULT_LIMIT = 50;

/** Maximum messages per page */
const MAX_LIMIT = 100;

// ============================================================================
// Helper Functions
// ============================================================================

/** Generate a UUID v4 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Create a standardized error response */
function createErrorResponse(
  error: string,
  status: number,
  error_code?: string
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
      error_code,
    },
    { status }
  );
}

/** Create a standardized success response */
function createSuccessResponse<T>(data: T): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
  });
}

/**
 * Default function to get user ID from request cookies
 */
async function defaultGetUserIdFromRequest(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('hazo_auth_user_id')?.value || null;
}

/**
 * Verify that a user is a member of a chat group
 * @returns The membership record if found, null otherwise
 */
async function verifyGroupMembership(
  hazoConnect: HazoConnectAdapter,
  user_id: string,
  chat_group_id: string,
  logger: Logger
): Promise<ChatGroupUserRecord | null> {
  const membershipService = createCrudService<ChatGroupUserRecord>(hazoConnect, 'hazo_chat_group_users');

  try {
    const memberships = await membershipService.list((qb) =>
      qb.select('*')
        .where('chat_group_id', 'eq', chat_group_id)
        .where('user_id', 'eq', user_id)
    );
    return memberships[0] || null;
  } catch (error) {
    logger.error('[hazo_chat] Error verifying group membership:', { error });
    return null;
  }
}

/**
 * Creates GET and POST handlers for chat messages
 * 
 * @param options - Configuration options
 * @returns Object with GET and POST handlers
 */
export function createMessagesHandler(options: MessagesHandlerOptions) {
  const { getHazoConnect, getLogger, getUserIdFromRequest } = options;
  const logger = getLogger();

  /**
   * GET handler - Fetch chat messages with pagination
   *
   * Query params:
   * - chat_group_id (required): The chat group to fetch messages from
   * - reference_id (optional): Filter by reference ID
   * - reference_type (optional): Filter by reference type
   * - limit (optional): Number of messages per page (default: 50, max: 100)
   * - cursor (optional): Cursor for pagination (created_at timestamp of last message)
   * - direction (optional): 'older' or 'newer' relative to cursor (default: 'older')
   */
  async function GET(request: NextRequest): Promise<NextResponse> {
    try {
      // Get current user ID
      const current_user_id = getUserIdFromRequest
        ? await getUserIdFromRequest(request)
        : await defaultGetUserIdFromRequest();

      if (!current_user_id) {
        logger.error('[hazo_chat/messages GET] No user ID - not authenticated');
        return createErrorResponse('User not authenticated', 401, 'UNAUTHENTICATED');
      }

      // Get query params
      const { searchParams } = new URL(request.url);
      const chat_group_id = searchParams.get('chat_group_id');
      const reference_id = searchParams.get('reference_id') || '';
      const reference_type = searchParams.get('reference_type') || '';
      const cursor = searchParams.get('cursor') || '';
      const direction = searchParams.get('direction') || 'older';
      const limit_param = searchParams.get('limit');

      // Validate required params
      if (!chat_group_id) {
        logger.error('[hazo_chat/messages GET] Missing chat_group_id');
        return createErrorResponse('chat_group_id is required', 400, 'MISSING_CHAT_GROUP');
      }

      // Validate UUID formats before database queries
      if (!is_valid_uuid(chat_group_id)) {
        logger.debug('[hazo_chat/messages GET] Invalid chat_group_id format:', { chat_group_id });
        return createErrorResponse('chat_group_id must be a valid UUID', 400, 'INVALID_UUID_FORMAT');
      }

      if (!is_valid_uuid(current_user_id)) {
        logger.debug('[hazo_chat/messages GET] Invalid user_id format:', { current_user_id });
        return createErrorResponse('Invalid user ID format', 400, 'INVALID_UUID_FORMAT');
      }

      // Get hazo_connect instance early for membership check
      const hazoConnect = getHazoConnect() as HazoConnectAdapter;

      // Verify user is a member of the chat group
      const membership = await verifyGroupMembership(hazoConnect, current_user_id, chat_group_id, logger);
      if (!membership) {
        logger.error('[hazo_chat/messages GET] User is not a member of chat group:', {
          current_user_id,
          chat_group_id,
        });
        return createErrorResponse('Access denied - not a member of this chat group', 403, 'FORBIDDEN');
      }

      // Validate input lengths
      if (reference_id && reference_id.length > MAX_REFERENCE_ID_LENGTH) {
        return createErrorResponse(
          `reference_id exceeds maximum length of ${MAX_REFERENCE_ID_LENGTH}`,
          400,
          'INVALID_REFERENCE_ID'
        );
      }

      if (reference_type && reference_type.length > MAX_REFERENCE_TYPE_LENGTH) {
        return createErrorResponse(
          `reference_type exceeds maximum length of ${MAX_REFERENCE_TYPE_LENGTH}`,
          400,
          'INVALID_REFERENCE_TYPE'
        );
      }

      // Parse and validate limit
      let limit = DEFAULT_LIMIT;
      if (limit_param) {
        const parsed_limit = parseInt(limit_param, 10);
        if (isNaN(parsed_limit) || parsed_limit < 1) {
          return createErrorResponse('limit must be a positive integer', 400, 'INVALID_LIMIT');
        }
        limit = Math.min(parsed_limit, MAX_LIMIT);
      }

      logger.info('[hazo_chat/messages GET] Fetching messages:', {
        current_user_id,
        chat_group_id,
        reference_id,
        reference_type,
        cursor,
        direction,
        limit,
      });

      // Create CRUD service (hazoConnect already obtained above)
      const chatService = createCrudService<ChatMessageRecord>(hazoConnect, 'hazo_chat');

      let messages: ChatMessageRecord[] = [];

      try {
        // Build query with proper filtering
        const all_messages = await chatService.list((qb) => {
          let builder = qb.select('*');

          // Filter by chat group - this is the primary filter
          builder = builder.where('chat_group_id', 'eq', chat_group_id);

          // Filter by reference if provided
          if (reference_id) {
            builder = builder.where('reference_id', 'eq', reference_id);
          }
          if (reference_type) {
            builder = builder.where('reference_type', 'eq', reference_type);
          }

          // Apply cursor-based pagination
          if (cursor) {
            if (direction === 'newer') {
              builder = builder.where('created_at', 'gt', cursor);
            } else {
              builder = builder.where('created_at', 'lt', cursor);
            }
          }

          // Order by created_at
          // For 'older' direction, we want desc to get the most recent first before cursor
          // For 'newer' or initial load, we want asc
          if (direction === 'older' && cursor) {
            builder = builder.order('created_at', 'desc');
          } else {
            builder = builder.order('created_at', 'asc');
          }

          return builder;
        });

        // Filter out deleted messages (membership check already done above)
        const filtered_messages = all_messages.filter((msg) => !msg.deleted_at);

        // Apply limit after filtering
        messages = filtered_messages.slice(0, limit);

        // If we fetched in desc order, reverse to return in asc order
        if (direction === 'older' && cursor) {
          messages.reverse();
        }
      } catch (dbError) {
        logger.error('[hazo_chat/messages GET] Database error:', { dbError });
        throw dbError;
      }

      logger.info('[hazo_chat/messages GET] Found messages:', { count: messages.length });

      // Determine if there are more messages
      const has_more = messages.length === limit;

      // Get cursors for next/prev page
      const next_cursor = messages.length > 0 ? messages[messages.length - 1].created_at : null;
      const prev_cursor = messages.length > 0 ? messages[0].created_at : null;

      return NextResponse.json({
        success: true,
        messages,
        current_user_id,
        pagination: {
          limit,
          has_more,
          next_cursor,
          prev_cursor,
        },
      });
    } catch (error) {
      const error_message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('[hazo_chat/messages GET] Error:', { error_message, error });

      return createErrorResponse('Failed to fetch messages', 500, 'INTERNAL_ERROR');
    }
  }

  /**
   * POST handler - Create a new chat message
   *
   * Request body:
   * - chat_group_id (required): The chat group to send the message to
   * - message_text (required): The message content (max 5000 chars)
   * - reference_id (optional): Reference ID for context grouping
   * - reference_type (optional): Reference type (default: 'chat')
   */
  async function POST(request: NextRequest): Promise<NextResponse> {
    try {
      // Get current user ID (sender)
      const sender_user_id = getUserIdFromRequest
        ? await getUserIdFromRequest(request)
        : await defaultGetUserIdFromRequest();

      if (!sender_user_id) {
        logger.error('[hazo_chat/messages POST] No user ID - not authenticated');
        return createErrorResponse('User not authenticated', 401, 'UNAUTHENTICATED');
      }

      // Parse request body
      const body: ChatMessageInput = await request.json();
      const { chat_group_id, message_text, reference_id, reference_type } = body;

      // Validate required fields
      if (!chat_group_id) {
        logger.error('[hazo_chat/messages POST] Missing chat_group_id');
        return createErrorResponse('chat_group_id is required', 400, 'MISSING_CHAT_GROUP');
      }

      // Validate UUID formats before database queries
      if (!is_valid_uuid(chat_group_id)) {
        logger.debug('[hazo_chat/messages POST] Invalid chat_group_id format:', { chat_group_id });
        return createErrorResponse('chat_group_id must be a valid UUID', 400, 'INVALID_UUID_FORMAT');
      }

      if (!is_valid_uuid(sender_user_id)) {
        logger.debug('[hazo_chat/messages POST] Invalid user_id format:', { sender_user_id });
        return createErrorResponse('Invalid user ID format', 400, 'INVALID_UUID_FORMAT');
      }

      // Get hazo_connect instance early for membership check
      const hazoConnect = getHazoConnect() as HazoConnectAdapter;

      // Verify user is a member of the chat group
      const membership = await verifyGroupMembership(hazoConnect, sender_user_id, chat_group_id, logger);
      if (!membership) {
        logger.error('[hazo_chat/messages POST] User is not a member of chat group:', {
          sender_user_id,
          chat_group_id,
        });
        return createErrorResponse('Access denied - not a member of this chat group', 403, 'FORBIDDEN');
      }

      // Validate message_text
      if (!message_text || typeof message_text !== 'string') {
        logger.error('[hazo_chat/messages POST] Missing message_text');
        return createErrorResponse('message_text is required', 400, 'MISSING_MESSAGE');
      }

      const trimmed_message = message_text.trim();

      if (trimmed_message === '') {
        logger.error('[hazo_chat/messages POST] Empty message_text');
        return createErrorResponse(
          'message_text cannot be empty or whitespace-only',
          400,
          'EMPTY_MESSAGE'
        );
      }

      if (trimmed_message.length > MAX_MESSAGE_LENGTH) {
        logger.error('[hazo_chat/messages POST] Message too long:', { length: trimmed_message.length });
        return createErrorResponse(
          `Message exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters`,
          400,
          'MESSAGE_TOO_LONG'
        );
      }

      // Validate reference_id length
      if (reference_id && reference_id.length > MAX_REFERENCE_ID_LENGTH) {
        return createErrorResponse(
          `reference_id exceeds maximum length of ${MAX_REFERENCE_ID_LENGTH}`,
          400,
          'INVALID_REFERENCE_ID'
        );
      }

      // Validate reference_type length
      if (reference_type && reference_type.length > MAX_REFERENCE_TYPE_LENGTH) {
        return createErrorResponse(
          `reference_type exceeds maximum length of ${MAX_REFERENCE_TYPE_LENGTH}`,
          400,
          'INVALID_REFERENCE_TYPE'
        );
      }

      // Create CRUD service (hazoConnect already obtained above)
      const chatService = createCrudService<ChatMessageRecord>(hazoConnect, 'hazo_chat');

      // Generate message ID and timestamps
      const message_id = generateUUID();
      const now = new Date().toISOString();

      // Create message record
      const message_record: Partial<ChatMessageRecord> = {
        id: message_id,
        reference_id: reference_id || '',
        reference_type: reference_type || 'chat',
        sender_user_id,
        chat_group_id,
        message_text: trimmed_message,
        reference_list: null,
        read_at: null,
        deleted_at: null,
        created_at: now,
        changed_at: now,
      };

      logger.info('[hazo_chat/messages POST] Saving message:', {
        id: message_id,
        sender_user_id,
        chat_group_id,
        reference_id: reference_id || '',
        reference_type: reference_type || 'chat',
        message_length: trimmed_message.length,
      });

      // Save to database
      try {
        await chatService.insert(message_record);
      } catch (dbError) {
        logger.error('[hazo_chat/messages POST] Database error:', { dbError });
        throw dbError;
      }

      logger.info('[hazo_chat/messages POST] Message saved successfully:', { message_id });

      return NextResponse.json({
        success: true,
        message: {
          id: message_id,
          sender_user_id,
          chat_group_id,
          reference_id: reference_id || '',
          reference_type: reference_type || 'chat',
          message_text: trimmed_message,
          reference_list: null,
          read_at: null,
          deleted_at: null,
          created_at: now,
          changed_at: now,
        },
      });
    } catch (error) {
      const error_message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('[hazo_chat/messages POST] Error:', { error_message, error });

      return createErrorResponse('Failed to save message', 500, 'INTERNAL_ERROR');
    }
  }

  return { GET, POST };
}

/**
 * Creates a PATCH handler for marking a message as read
 * 
 * This handler should be used in a Next.js API route like:
 * /api/hazo_chat/messages/[id]/read/route.ts
 * 
 * @param options - Configuration options
 * @returns PATCH handler function
 */
export function createMarkAsReadHandler(options: MessagesHandlerOptions) {
  const { getHazoConnect, getLogger, getUserIdFromRequest } = options;
  const logger = getLogger();

  /**
   * PATCH handler - Mark a message as read
   * 
   * Route params:
   * - id (required): The message ID to mark as read
   * 
   * Note: In Next.js 13+ App Router, params may be a Promise
   */
  async function PATCH(
    request: NextRequest,
    context: { params: { id: string } | Promise<{ id: string }> }
  ): Promise<NextResponse> {
    try {
      // Get current user ID
      const current_user_id = getUserIdFromRequest
        ? await getUserIdFromRequest(request)
        : await defaultGetUserIdFromRequest();

      if (!current_user_id) {
        logger.error('[hazo_chat/messages/[id]/read PATCH] No user ID - not authenticated');
        return NextResponse.json(
          { success: false, error: 'User not authenticated' },
          { status: 401 }
        );
      }

      // Handle params as Promise (Next.js 15+) or direct object (Next.js 13-14)
      const params = context.params instanceof Promise ? await context.params : context.params;
      const message_id = params.id;

      if (!message_id) {
        logger.error('[hazo_chat/messages/[id]/read PATCH] Missing message ID');
        return NextResponse.json(
          { success: false, error: 'Message ID is required' },
          { status: 400 }
        );
      }

      // Validate UUID formats before database queries
      if (!is_valid_uuid(message_id)) {
        logger.debug('[hazo_chat/messages/[id]/read PATCH] Invalid message_id format:', { message_id });
        return NextResponse.json(
          { success: false, error: 'message_id must be a valid UUID', error_code: 'INVALID_UUID_FORMAT' },
          { status: 400 }
        );
      }

      if (!is_valid_uuid(current_user_id)) {
        logger.debug('[hazo_chat/messages/[id]/read PATCH] Invalid user_id format:', { current_user_id });
        return NextResponse.json(
          { success: false, error: 'Invalid user ID format', error_code: 'INVALID_UUID_FORMAT' },
          { status: 400 }
        );
      }

      logger.info('[hazo_chat/messages/[id]/read PATCH] Marking message as read:', {
        message_id,
        current_user_id,
      });

      // Get hazo_connect instance and create CRUD service
      const hazoConnect = getHazoConnect() as HazoConnectAdapter;
      const chatService = createCrudService<ChatMessageRecord>(hazoConnect, 'hazo_chat');

      // First, fetch the message to verify ownership
      let message: ChatMessageRecord | null = null;
      try {
        const messages = await chatService.list((qb) =>
          qb.select('*').where('id', 'eq', message_id)
        );
        message = messages[0] || null;
      } catch (dbError) {
        logger.error('[hazo_chat/messages/[id]/read PATCH] Database error fetching message:', { dbError });
        throw dbError;
      }

      if (!message) {
        logger.error('[hazo_chat/messages/[id]/read PATCH] Message not found:', { message_id });
        return NextResponse.json(
          { success: false, error: 'Message not found' },
          { status: 404 }
        );
      }

      // Verify that the current user is a member of the chat group
      const membership = await verifyGroupMembership(hazoConnect, current_user_id, message.chat_group_id, logger);
      if (!membership) {
        logger.error('[hazo_chat/messages/[id]/read PATCH] User is not a member of chat group:', {
          message_id,
          current_user_id,
          chat_group_id: message.chat_group_id,
        });
        return NextResponse.json(
          { success: false, error: 'Unauthorized - not a member of this chat group' },
          { status: 403 }
        );
      }

      // Cannot mark your own messages as read
      if (message.sender_user_id === current_user_id) {
        logger.error('[hazo_chat/messages/[id]/read PATCH] User cannot mark own message as read:', {
          message_id,
          current_user_id,
        });
        return NextResponse.json(
          { success: false, error: 'Cannot mark your own messages as read' },
          { status: 400 }
        );
      }

      // Don't update if already read
      if (message.read_at) {
        logger.info('[hazo_chat/messages/[id]/read PATCH] Message already read:', { message_id });
        return NextResponse.json({
          success: true,
          message: {
            ...message,
            read_at: message.read_at,
          },
        });
      }

      // Update the read_at timestamp
      // Use SQLite admin service's updateRows method for reliable updates
      const now = new Date().toISOString();
      try {
        // Use the SQLite admin service which has updateRows method
        const sqliteService = getSqliteAdminService();
        const updated_rows = await sqliteService.updateRows(
          'hazo_chat',
          { id: message_id }, // criteria: update where id matches
          { read_at: now, changed_at: now } // data to update
        );
        
        if (updated_rows.length === 0) {
          logger.warn('[hazo_chat/messages/[id]/read PATCH] No rows updated - message may not exist:', { message_id });
          // Don't throw error, just log warning - message might have been deleted
        } else {
          logger.info('[hazo_chat/messages/[id]/read PATCH] Successfully updated', { rows: updated_rows.length });
        }
      } catch (dbError) {
        logger.error('[hazo_chat/messages/[id]/read PATCH] Database error updating message:', { dbError });
        throw dbError;
      }

      logger.info('[hazo_chat/messages/[id]/read PATCH] Message marked as read successfully:', { message_id });

      return NextResponse.json({
        success: true,
        message: {
          ...message,
          read_at: now,
          changed_at: now,
        },
      });
    } catch (error) {
      const error_message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('[hazo_chat/messages/[id]/read PATCH] Error:', { error_message, error });

      return NextResponse.json(
        { success: false, error: 'Failed to mark message as read' },
        { status: 500 }
      );
    }
  }

  return { PATCH };
}

/**
 * Creates a DELETE handler for soft-deleting a message
 *
 * This handler should be used in a Next.js API route like:
 * /api/hazo_chat/messages/[id]/route.ts
 *
 * @example
 * ```typescript
 * // app/api/hazo_chat/messages/[id]/route.ts
 * import { createDeleteHandler } from 'hazo_chat/api';
 * import { getHazoConnectSingleton } from 'hazo_connect/nextjs/setup';
 *
 * export const dynamic = 'force-dynamic';
 *
 * const { DELETE } = createDeleteHandler({
 *   getHazoConnect: () => getHazoConnectSingleton()
 * });
 *
 * export { DELETE };
 * ```
 *
 * @param options - Configuration options
 * @returns DELETE handler function
 */
export function createDeleteHandler(options: MessagesHandlerOptions) {
  const { getHazoConnect, getLogger, getUserIdFromRequest } = options;
  const logger = getLogger();

  /**
   * DELETE handler - Soft delete a message
   *
   * Route params:
   * - id (required): The message ID to delete
   *
   * Note: This performs a soft delete by setting deleted_at timestamp.
   * Only the sender can delete their own messages.
   */
  async function DELETE(
    request: NextRequest,
    context: { params: { id: string } | Promise<{ id: string }> }
  ): Promise<NextResponse> {
    try {
      // Get current user ID
      const current_user_id = getUserIdFromRequest
        ? await getUserIdFromRequest(request)
        : await defaultGetUserIdFromRequest();

      if (!current_user_id) {
        logger.error('[hazo_chat/messages/[id] DELETE] No user ID - not authenticated');
        return createErrorResponse('User not authenticated', 401, 'UNAUTHENTICATED');
      }

      // Handle params as Promise (Next.js 15+) or direct object (Next.js 13-14)
      const params = context.params instanceof Promise ? await context.params : context.params;
      const message_id = params.id;

      if (!message_id) {
        logger.error('[hazo_chat/messages/[id] DELETE] Missing message ID');
        return createErrorResponse('Message ID is required', 400, 'MISSING_MESSAGE_ID');
      }

      // Validate UUID formats before database queries
      if (!is_valid_uuid(message_id)) {
        logger.debug('[hazo_chat/messages/[id] DELETE] Invalid message_id format:', { message_id });
        return createErrorResponse('message_id must be a valid UUID', 400, 'INVALID_UUID_FORMAT');
      }

      if (!is_valid_uuid(current_user_id)) {
        logger.debug('[hazo_chat/messages/[id] DELETE] Invalid user_id format:', { current_user_id });
        return createErrorResponse('Invalid user ID format', 400, 'INVALID_UUID_FORMAT');
      }

      logger.info('[hazo_chat/messages/[id] DELETE] Deleting message:', {
        message_id,
        current_user_id,
      });

      // Get hazo_connect instance and create CRUD service
      const hazoConnect = getHazoConnect() as HazoConnectAdapter;
      const chatService = createCrudService<ChatMessageRecord>(hazoConnect, 'hazo_chat');

      // Fetch the message to verify ownership
      let message: ChatMessageRecord | null = null;
      try {
        const messages = await chatService.list((qb) =>
          qb.select('*').where('id', 'eq', message_id)
        );
        message = messages[0] || null;
      } catch (dbError) {
        logger.error('[hazo_chat/messages/[id] DELETE] Database error fetching message:', { dbError });
        throw dbError;
      }

      if (!message) {
        logger.error('[hazo_chat/messages/[id] DELETE] Message not found:', { message_id });
        return createErrorResponse('Message not found', 404, 'MESSAGE_NOT_FOUND');
      }

      // Verify that the current user is a member of the chat group
      const membership = await verifyGroupMembership(hazoConnect, current_user_id, message.chat_group_id, logger);
      if (!membership) {
        logger.error('[hazo_chat/messages/[id] DELETE] User is not a member of chat group:', {
          message_id,
          current_user_id,
          chat_group_id: message.chat_group_id,
        });
        return createErrorResponse(
          'Unauthorized - not a member of this chat group',
          403,
          'FORBIDDEN'
        );
      }

      // Verify that the current user is the sender (only senders can delete their messages)
      if (message.sender_user_id !== current_user_id) {
        logger.error('[hazo_chat/messages/[id] DELETE] User is not the sender:', {
          message_id,
          current_user_id,
          sender_user_id: message.sender_user_id,
        });
        return createErrorResponse(
          'Unauthorized - only the sender can delete their messages',
          403,
          'UNAUTHORIZED'
        );
      }

      // Check if already deleted
      if (message.deleted_at) {
        logger.info('[hazo_chat/messages/[id] DELETE] Message already deleted:', { message_id });
        return NextResponse.json({
          success: true,
          message: {
            ...message,
            message_text: null,
          },
        });
      }

      // Soft delete: set deleted_at timestamp and clear message_text
      const now = new Date().toISOString();
      try {
        const sqliteService = getSqliteAdminService();
        const updated_rows = await sqliteService.updateRows(
          'hazo_chat',
          { id: message_id },
          { deleted_at: now, message_text: null, changed_at: now }
        );

        if (updated_rows.length === 0) {
          logger.warn('[hazo_chat/messages/[id] DELETE] No rows updated - message may not exist:', { message_id });
        } else {
          logger.info('[hazo_chat/messages/[id] DELETE] Successfully deleted', { rows: updated_rows.length });
        }
      } catch (dbError) {
        logger.error('[hazo_chat/messages/[id] DELETE] Database error deleting message:', { dbError });
        throw dbError;
      }

      logger.info('[hazo_chat/messages/[id] DELETE] Message deleted successfully:', { message_id });

      return NextResponse.json({
        success: true,
        message: {
          ...message,
          deleted_at: now,
          message_text: null,
          changed_at: now,
        },
      });
    } catch (error) {
      const error_message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('[hazo_chat/messages/[id] DELETE] Error:', { error_message, error });

      return createErrorResponse('Failed to delete message', 500, 'INTERNAL_ERROR');
    }
  }

  return { DELETE };
}
