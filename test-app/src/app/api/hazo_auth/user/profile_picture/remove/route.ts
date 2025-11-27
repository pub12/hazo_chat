/**
 * file_description: API route to remove user profile picture
 * Clears profile picture URL and source from database
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
import { remove_user_profile_picture } from "hazo_auth/lib/services/profile_picture_remove_service";

// section: api_handler
export async function POST(request: NextRequest) {
  try {
    // Get current user ID from cookies
    const cookieStore = cookies();
    const user_id = cookieStore.get("hazo_auth_user_id")?.value;

    if (!user_id) {
      console.error("[hazo_auth/user/profile_picture/remove] No user_id in cookies - user not authenticated");
      return NextResponse.json(
        { success: false, error: "User not authenticated" },
        { status: 401 }
      );
    }

    console.log("[hazo_auth/user/profile_picture/remove] Removing profile picture for user:", user_id);

    // Get hazo_connect instance
    const hazoConnect = get_hazo_connect_instance();

    // Remove profile picture
    const result = await remove_user_profile_picture(hazoConnect, user_id);

    if (!result.success) {
      console.error("[hazo_auth/user/profile_picture/remove] Remove failed:", result.error);
      return NextResponse.json(
        { success: false, error: result.error || "Failed to remove profile picture" },
        { status: 400 }
      );
    }

    // Clear profile picture cookie
    cookieStore.delete("hazo_auth_profile_picture_url");

    console.log("[hazo_auth/user/profile_picture/remove] Profile picture removed successfully");

    return NextResponse.json({
      success: true,
      message: "Profile picture removed successfully",
    });
  } catch (error) {
    const error_message = error instanceof Error ? error.message : "Unknown error";
    console.error("[hazo_auth/user/profile_picture/remove] Error:", error_message, error);
    
    return NextResponse.json(
      { success: false, error: "Failed to remove profile picture" },
      { status: 500 }
    );
  }
}

