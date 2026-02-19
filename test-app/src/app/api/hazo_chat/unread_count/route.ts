/**
 * Test API route for hazo_chat_get_unread_count function
 *
 * Tests the unread count library function
 */

// section: route_config
export const dynamic = 'force-dynamic';

// section: imports
import { get_hazo_connect_instance } from 'hazo_auth/server-lib';
import { createUnreadCountFunction } from 'hazo_chat/api';
import { createLogger, type Logger } from 'hazo_logs';
import { NextRequest, NextResponse } from 'next/server';

// section: logger_creation
// Lazy logger creation to avoid winston bundling issues with Next.js
let logger: Logger | null = null;
function getLogger(): Logger {
  if (!logger) {
    logger = createLogger('hazo_chat');
  }
  return logger;
}

// section: handler_creation
// Create the unread count function using the factory
const hazo_chat_get_unread_count = createUnreadCountFunction({
  getHazoConnect: () => get_hazo_connect_instance(),
  getLogger,
});

// section: handler
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const chat_group_ids = searchParams.get('chat_group_ids');

    if (!user_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'user_id is required',
          unread_counts: [],
        },
        { status: 400 }
      );
    }

    console.log('[test unread_count] Testing with user_id:', user_id);

    // Parse chat_group_ids if provided (comma-separated)
    const group_ids = chat_group_ids ? chat_group_ids.split(',').filter((id) => id.trim()) : undefined;

    // Call the library function with new params format
    const unread_counts = await hazo_chat_get_unread_count({
      user_id,
      chat_group_ids: group_ids,
    });

    console.log('[test unread_count] Result:', {
      user_id,
      count: unread_counts.length,
      unread_counts,
    });

    return NextResponse.json({
      success: true,
      user_id,
      unread_counts,
      total_groups: unread_counts.length,
      total_unread: unread_counts.reduce((sum, item) => sum + item.count, 0),
    });
  } catch (error) {
    const error_message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[test unread_count] Error:', error_message, error);

    return NextResponse.json(
      {
        success: false,
        error: error_message,
        unread_counts: [],
      },
      { status: 500 }
    );
  }
}
