/**
 * file_description: API route to change user password
 * Verifies current password and updates to new password
 */

// section: route_config
export const dynamic = "force-dynamic";

// section: imports
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - webpack alias resolves this path
import { get_hazo_connect_instance } from "hazo_auth/lib/hazo_connect_instance.server";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - webpack alias resolves this path
import { change_password } from "hazo_auth/lib/services/password_change_service";

// section: api_handler
export async function POST(request: NextRequest) {
  try {
    // Get current user ID from cookies
    const cookieStore = cookies();
    const user_id = cookieStore.get("hazo_auth_user_id")?.value;

    if (!user_id) {
      console.error("[hazo_auth/user/password] No user_id in cookies - user not authenticated");
      return NextResponse.json(
        { success: false, error: "User not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { current_password, new_password } = body;

    if (!current_password) {
      return NextResponse.json(
        { success: false, error: "Current password is required" },
        { status: 400 }
      );
    }

    if (!new_password) {
      return NextResponse.json(
        { success: false, error: "New password is required" },
        { status: 400 }
      );
    }

    console.log("[hazo_auth/user/password] Changing password for user:", user_id);

    // Get hazo_connect instance
    const hazoConnect = get_hazo_connect_instance();

    // Change password
    const result = await change_password(hazoConnect, user_id, {
      current_password,
      new_password,
    });

    if (!result.success) {
      console.error("[hazo_auth/user/password] Password change failed:", result.error);
      return NextResponse.json(
        { success: false, error: result.error || "Failed to change password" },
        { status: 400 }
      );
    }

    console.log("[hazo_auth/user/password] Password changed successfully");

    return NextResponse.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    const error_message = error instanceof Error ? error.message : "Unknown error";
    console.error("[hazo_auth/user/password] Error:", error_message, error);
    
    return NextResponse.json(
      { success: false, error: "Failed to change password" },
      { status: 500 }
    );
  }
}

