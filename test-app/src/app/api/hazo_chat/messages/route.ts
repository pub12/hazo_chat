/**
 * file_description: API route to save and fetch chat messages from hazo_chat table
 * Supports POST for saving messages and GET for fetching chat history
 */

// section: route_config
export const dynamic = "force-dynamic";

// section: imports
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - webpack alias resolves this path
import { get_hazo_connect_instance } from "hazo_auth/lib/hazo_connect_instance.server";
import { createCrudService } from "hazo_connect/server";
import { v4 as uuid_v4 } from "uuid";

// section: types
interface ChatMessageInput {
  receiver_user_id: string;
  message_text: string;
  reference_id: string;
  reference_type: string;
}

interface ChatMessageDB extends Record<string, unknown> {
  id: string;
  reference_id: string;
  reference_type: string;
  sender_user_id: string;
  receiver_user_id: string;
  message_text: string;
  reference_list: string | null;
  read_at: string | null;
  deleted_at: string | null;
  created_at: string;
  changed_at: string;
}

// section: get_handler
/**
 * GET handler - Fetch chat history
 * Query params: receiver_user_id, reference_id (optional), reference_type (optional)
 */
export async function GET(request: NextRequest) {
  try {
    // Get current user ID from cookies (sender)
    const cookieStore = cookies();
    const current_user_id = cookieStore.get("hazo_auth_user_id")?.value;

    if (!current_user_id) {
      console.error("[hazo_chat/messages GET] No current_user_id in cookies - user not authenticated");
      return NextResponse.json(
        { success: false, error: "User not authenticated", messages: [] },
        { status: 401 }
      );
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const receiver_user_id = searchParams.get("receiver_user_id");
    const reference_id = searchParams.get("reference_id") || "";
    const reference_type = searchParams.get("reference_type") || "";

    if (!receiver_user_id) {
      console.error("[hazo_chat/messages GET] Missing receiver_user_id");
      return NextResponse.json(
        { success: false, error: "receiver_user_id is required", messages: [] },
        { status: 400 }
      );
    }

    console.log("[hazo_chat/messages GET] Fetching messages:", {
      current_user_id,
      receiver_user_id,
      reference_id,
      reference_type,
    });

    // Get hazo_connect instance and create crud service
    const hazoConnect = get_hazo_connect_instance();
    const chatService = createCrudService<ChatMessageDB>(hazoConnect, "hazo_chat");

    // Fetch all messages and filter in code for complex OR condition
    // This approach is simpler than building complex SQL
    const all_messages = await chatService.list((qb) => {
      let builder = qb.select("*");
      
      // Add reference filters if provided
      if (reference_id) {
        builder = builder.where("reference_id", "eq", reference_id);
      }
      if (reference_type) {
        builder = builder.where("reference_type", "eq", reference_type);
      }
      
      return builder.order("created_at", "asc");
    });

    // Filter messages to only include those between current user and receiver
    const data = all_messages.filter((msg) => {
      const is_sent_by_me = msg.sender_user_id === current_user_id && msg.receiver_user_id === receiver_user_id;
      const is_sent_to_me = msg.sender_user_id === receiver_user_id && msg.receiver_user_id === current_user_id;
      return is_sent_by_me || is_sent_to_me;
    });

    console.log("[hazo_chat/messages GET] Found messages:", data?.length || 0);

    return NextResponse.json({
      success: true,
      messages: data || [],
      current_user_id,
    });
  } catch (error) {
    const error_message = error instanceof Error ? error.message : "Unknown error";
    console.error("[hazo_chat/messages GET] Error:", error_message, error);
    
    return NextResponse.json(
      { success: false, error: "Failed to fetch messages", messages: [] },
      { status: 500 }
    );
  }
}

// section: post_handler
/**
 * POST handler - Save a new message
 */
export async function POST(request: NextRequest) {
  try {
    // Get current user ID from cookies (sender)
    const cookieStore = cookies();
    const sender_user_id = cookieStore.get("hazo_auth_user_id")?.value;

    if (!sender_user_id) {
      console.error("[hazo_chat/messages POST] No sender_user_id in cookies - user not authenticated");
      return NextResponse.json(
        { success: false, error: "User not authenticated" },
        { status: 401 }
      );
    }

    // Parse request body
    const body: ChatMessageInput = await request.json();
    const { receiver_user_id, message_text, reference_id, reference_type } = body;

    // Validate required fields
    if (!receiver_user_id) {
      console.error("[hazo_chat/messages POST] Missing receiver_user_id");
      return NextResponse.json(
        { success: false, error: "receiver_user_id is required" },
        { status: 400 }
      );
    }

    if (!message_text || message_text.trim() === "") {
      console.error("[hazo_chat/messages POST] Missing or empty message_text");
      return NextResponse.json(
        { success: false, error: "message_text is required" },
        { status: 400 }
      );
    }

    // reference_id and reference_type are optional - use defaults if not provided
    const final_reference_id = reference_id || "";
    const final_reference_type = reference_type || "chat";

    // Get hazo_connect instance and create crud service
    const hazoConnect = get_hazo_connect_instance();
    const chatService = createCrudService<ChatMessageDB>(hazoConnect, "hazo_chat");

    // Generate message ID
    const message_id = uuid_v4();
    const now = new Date().toISOString();

    // Create message record
    const message_record: Partial<ChatMessageDB> = {
      id: message_id,
      reference_id: final_reference_id,
      reference_type: final_reference_type,
      sender_user_id,
      receiver_user_id,
      message_text: message_text.trim(),
      reference_list: null,
      read_at: null,
      deleted_at: null,
      created_at: now,
      changed_at: now,
    };

    // Log the message being saved
    console.log("[hazo_chat/messages POST] Saving message:", {
      id: message_id,
      sender_user_id,
      receiver_user_id,
      reference_id: final_reference_id,
      reference_type: final_reference_type,
      message_length: message_text.length,
      created_at: now,
    });

    // Save to database using CrudService
    await chatService.insert(message_record);

    console.log("[hazo_chat/messages POST] Message saved successfully:", message_id);

    return NextResponse.json({
      success: true,
      message: {
        id: message_id,
        sender_user_id,
        receiver_user_id,
        reference_id: final_reference_id,
        reference_type: final_reference_type,
        message_text: message_text.trim(),
        created_at: now,
      },
    });
  } catch (error) {
    const error_message = error instanceof Error ? error.message : "Unknown error";
    console.error("[hazo_chat/messages POST] Error saving message:", error_message, error);
    
    return NextResponse.json(
      { success: false, error: "Failed to save message" },
      { status: 500 }
    );
  }
}
