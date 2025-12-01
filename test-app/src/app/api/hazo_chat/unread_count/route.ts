/**
 * Test API route for hazo_chat_get_unread_count function
 * 
 * Tests the unread count library function
 */

// section: route_config
export const dynamic = "force-dynamic";

// section: imports
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - webpack alias resolves this path
import { get_hazo_connect_instance } from "hazo_auth/lib/hazo_connect_instance.server";
import { createUnreadCountFunction } from "hazo_chat/api";
import { NextRequest, NextResponse } from "next/server";

// section: handler_creation
// Create the unread count function using the factory
const hazo_chat_get_unread_count = createUnreadCountFunction({
  getHazoConnect: () => get_hazo_connect_instance()
});

// section: handler
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const receiver_user_id = searchParams.get('receiver_user_id');

    if (!receiver_user_id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'receiver_user_id is required',
          unread_counts: []
        },
        { status: 400 }
      );
    }

    console.log('[test unread_count] Testing with receiver_user_id:', receiver_user_id);

    // Call the library function
    const unread_counts = await hazo_chat_get_unread_count(receiver_user_id);

    console.log('[test unread_count] Result:', {
      receiver_user_id,
      count: unread_counts.length,
      unread_counts
    });

    return NextResponse.json({
      success: true,
      receiver_user_id,
      unread_counts,
      total_references: unread_counts.length,
      total_unread: unread_counts.reduce((sum, item) => sum + item.count, 0)
    });
  } catch (error) {
    const error_message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[test unread_count] Error:', error_message, error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error_message,
        unread_counts: []
      },
      { status: 500 }
    );
  }
}


