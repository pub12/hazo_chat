/**
 * file_description: API route to update user profile picture
 * Supports updating profile picture URL and source (gravatar, library, upload)
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
import { update_user_profile_picture } from "hazo_auth/lib/services/profile_picture_service";

// section: api_handler
export async function POST(request: NextRequest) {
  try {
    // Get current user ID from cookies
    const cookieStore = cookies();
    const user_id = cookieStore.get("hazo_auth_user_id")?.value;

    if (!user_id) {
      console.error("[hazo_auth/user/profile_picture] No user_id in cookies - user not authenticated");
      return NextResponse.json(
        { success: false, error: "User not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { profile_picture_url, profile_source } = body;

    if (!profile_picture_url) {
      return NextResponse.json(
        { success: false, error: "profile_picture_url is required" },
        { status: 400 }
      );
    }

    if (!profile_source) {
      return NextResponse.json(
        { success: false, error: "profile_source is required" },
        { status: 400 }
      );
    }

    console.log("[hazo_auth/user/profile_picture] Updating profile picture:", {
      user_id,
      profile_source,
      has_url: !!profile_picture_url,
    });

    // Get hazo_connect instance
    const hazoConnect = get_hazo_connect_instance();

    // Update profile picture
    const result = await update_user_profile_picture(
      hazoConnect,
      user_id,
      profile_picture_url,
      profile_source
    );

    if (!result.success) {
      console.error("[hazo_auth/user/profile_picture] Update failed:", result.error);
      return NextResponse.json(
        { success: false, error: result.error || "Failed to update profile picture" },
        { status: 400 }
      );
    }

    // Update profile picture cookie
    cookieStore.set("hazo_auth_profile_picture_url", profile_picture_url, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    console.log("[hazo_auth/user/profile_picture] Profile picture updated successfully");

    return NextResponse.json({
      success: true,
      profile_picture_url,
      profile_source,
    });
  } catch (error) {
    const error_message = error instanceof Error ? error.message : "Unknown error";
    console.error("[hazo_auth/user/profile_picture] Error:", error_message, error);
    
    return NextResponse.json(
      { success: false, error: "Failed to update profile picture" },
      { status: 500 }
    );
  }
}



