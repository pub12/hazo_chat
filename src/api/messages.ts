/**
 * Messages API Handler Factory
 * 
 * Creates GET and POST handlers for the /api/hazo_chat/messages endpoint.
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
import type { MessagesHandlerOptions, ChatMessageInput, ChatMessageRecord } from './types.js';

// UUID generation for message IDs
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
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
 * Creates GET and POST handlers for chat messages
 * 
 * @param options - Configuration options
 * @returns Object with GET and POST handlers
 */
export function createMessagesHandler(options: MessagesHandlerOptions) {
  const { getHazoConnect, getUserIdFromRequest } = options;

  /**
   * GET handler - Fetch chat messages
   * 
   * Query params:
   * - receiver_user_id (required): The other user in the conversation
   * - reference_id (optional): Filter by reference ID
   * - reference_type (optional): Filter by reference type
   */
  async function GET(request: NextRequest): Promise<NextResponse> {
    try {
      // Get current user ID
      const current_user_id = getUserIdFromRequest
        ? await getUserIdFromRequest(request)
        : await defaultGetUserIdFromRequest();

      if (!current_user_id) {
        console.error('[hazo_chat/messages GET] No user ID - not authenticated');
        return NextResponse.json(
          { success: false, error: 'User not authenticated', messages: [] },
          { status: 401 }
        );
      }

      // Get query params
      const { searchParams } = new URL(request.url);
      const receiver_user_id = searchParams.get('receiver_user_id');
      const reference_id = searchParams.get('reference_id') || '';
      const reference_type = searchParams.get('reference_type') || '';

      if (!receiver_user_id) {
        console.error('[hazo_chat/messages GET] Missing receiver_user_id');
        return NextResponse.json(
          { success: false, error: 'receiver_user_id is required', messages: [] },
          { status: 400 }
        );
      }

      console.log('[hazo_chat/messages GET] Fetching messages:', {
        current_user_id,
        receiver_user_id,
        reference_id,
        reference_type,
      });

      // Get hazo_connect instance and create CRUD service
      const hazoConnect = getHazoConnect() as HazoConnectAdapter;
      const chatService = createCrudService<ChatMessageRecord>(hazoConnect, 'hazo_chat');

      let messages: ChatMessageRecord[] = [];
      
      try {
        // Fetch all messages with reference filters
        const all_messages = await chatService.list((qb) => {
          let builder = qb.select('*');
          
          if (reference_id) {
            builder = builder.where('reference_id', 'eq', reference_id);
          }
          if (reference_type) {
            builder = builder.where('reference_type', 'eq', reference_type);
          }
          
          return builder.order('created_at', 'asc');
        });

        // Filter to only messages between current user and receiver
        messages = all_messages.filter((msg) => {
          const is_sent_by_me = msg.sender_user_id === current_user_id && msg.receiver_user_id === receiver_user_id;
          const is_sent_to_me = msg.sender_user_id === receiver_user_id && msg.receiver_user_id === current_user_id;
          return is_sent_by_me || is_sent_to_me;
        });
      } catch (dbError) {
        console.error('[hazo_chat/messages GET] Database error:', dbError);
        throw dbError;
      }

      console.log('[hazo_chat/messages GET] Found messages:', messages.length);

      return NextResponse.json({
        success: true,
        messages,
        current_user_id,
      });
    } catch (error) {
      const error_message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[hazo_chat/messages GET] Error:', error_message, error);
      
      return NextResponse.json(
        { success: false, error: 'Failed to fetch messages', messages: [] },
        { status: 500 }
      );
    }
  }

  /**
   * POST handler - Create a new chat message
   * 
   * Request body:
   * - receiver_user_id (required): The recipient user ID
   * - message_text (required): The message content
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
        console.error('[hazo_chat/messages POST] No user ID - not authenticated');
        return NextResponse.json(
          { success: false, error: 'User not authenticated' },
          { status: 401 }
        );
      }

      // Parse request body
      const body: ChatMessageInput = await request.json();
      const { receiver_user_id, message_text, reference_id, reference_type } = body;

      // Validate required fields
      if (!receiver_user_id) {
        console.error('[hazo_chat/messages POST] Missing receiver_user_id');
        return NextResponse.json(
          { success: false, error: 'receiver_user_id is required' },
          { status: 400 }
        );
      }

      if (!message_text || message_text.trim() === '') {
        console.error('[hazo_chat/messages POST] Missing or empty message_text');
        return NextResponse.json(
          { success: false, error: 'message_text is required' },
          { status: 400 }
        );
      }

      // Get hazo_connect instance and create CRUD service
      const hazoConnect = getHazoConnect() as HazoConnectAdapter;
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
        receiver_user_id,
        message_text: message_text.trim(),
        reference_list: null,
        read_at: null,
        deleted_at: null,
        created_at: now,
        changed_at: now,
      };

      console.log('[hazo_chat/messages POST] Saving message:', {
        id: message_id,
        sender_user_id,
        receiver_user_id,
        reference_id: reference_id || '',
        reference_type: reference_type || 'chat',
        message_length: message_text.length,
      });

      // Save to database
      try {
        await chatService.insert(message_record);
      } catch (dbError) {
        console.error('[hazo_chat/messages POST] Database error:', dbError);
        throw dbError;
      }

      console.log('[hazo_chat/messages POST] Message saved successfully:', message_id);

      return NextResponse.json({
        success: true,
        message: {
          id: message_id,
          sender_user_id,
          receiver_user_id,
          reference_id: reference_id || '',
          reference_type: reference_type || 'chat',
          message_text: message_text.trim(),
          reference_list: null,
          read_at: null,
          deleted_at: null,
          created_at: now,
          changed_at: now,
        },
      });
    } catch (error) {
      const error_message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[hazo_chat/messages POST] Error:', error_message, error);
      
      return NextResponse.json(
        { success: false, error: 'Failed to save message' },
        { status: 500 }
      );
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
  const { getHazoConnect, getUserIdFromRequest } = options;

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
        console.error('[hazo_chat/messages/[id]/read PATCH] No user ID - not authenticated');
        return NextResponse.json(
          { success: false, error: 'User not authenticated' },
          { status: 401 }
        );
      }

      // Handle params as Promise (Next.js 15+) or direct object (Next.js 13-14)
      const params = context.params instanceof Promise ? await context.params : context.params;
      const message_id = params.id;

      if (!message_id) {
        console.error('[hazo_chat/messages/[id]/read PATCH] Missing message ID');
        return NextResponse.json(
          { success: false, error: 'Message ID is required' },
          { status: 400 }
        );
      }

      console.log('[hazo_chat/messages/[id]/read PATCH] Marking message as read:', {
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
        console.error('[hazo_chat/messages/[id]/read PATCH] Database error fetching message:', dbError);
        throw dbError;
      }

      if (!message) {
        console.error('[hazo_chat/messages/[id]/read PATCH] Message not found:', message_id);
        return NextResponse.json(
          { success: false, error: 'Message not found' },
          { status: 404 }
        );
      }

      // Verify that the current user is the receiver (only receivers can mark as read)
      if (message.receiver_user_id !== current_user_id) {
        console.error('[hazo_chat/messages/[id]/read PATCH] User is not the receiver:', {
          message_id,
          current_user_id,
          receiver_user_id: message.receiver_user_id,
        });
        return NextResponse.json(
          { success: false, error: 'Unauthorized - only the receiver can mark messages as read' },
          { status: 403 }
        );
      }

      // Don't update if already read
      if (message.read_at) {
        console.log('[hazo_chat/messages/[id]/read PATCH] Message already read:', message_id);
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
          console.warn('[hazo_chat/messages/[id]/read PATCH] No rows updated - message may not exist:', message_id);
          // Don't throw error, just log warning - message might have been deleted
        } else {
          console.log('[hazo_chat/messages/[id]/read PATCH] Successfully updated', updated_rows.length, 'row(s)');
        }
      } catch (dbError) {
        console.error('[hazo_chat/messages/[id]/read PATCH] Database error updating message:', dbError);
        throw dbError;
      }

      console.log('[hazo_chat/messages/[id]/read PATCH] Message marked as read successfully:', message_id);

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
      console.error('[hazo_chat/messages/[id]/read PATCH] Error:', error_message, error);
      
      return NextResponse.json(
        { success: false, error: 'Failed to mark message as read' },
        { status: 500 }
      );
    }
  }

  return { PATCH };
}
