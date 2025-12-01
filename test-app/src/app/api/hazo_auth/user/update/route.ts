/**
 * file_description: API route to update user profile information
 * Updates name, email, profile picture URL
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
import { update_user_profile } from "hazo_auth/lib/services/user_update_service";

// section: api_handler
export async function POST(request: NextRequest) {
  try {
    // Get current user ID from cookies
    const cookieStore = cookies();
    const user_id = cookieStore.get("hazo_auth_user_id")?.value;

    if (!user_id) {
      console.error("[hazo_auth/user/update] No user_id in cookies - user not authenticated");
      return NextResponse.json(
        { success: false, error: "User not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, email, profile_picture_url, profile_source } = body;

    console.log("[hazo_auth/user/update] Updating user profile:", {
      user_id,
      has_name: !!name,
      has_email: !!email,
      has_profile_picture_url: !!profile_picture_url,
      has_profile_source: !!profile_source,
    });

    // Get hazo_connect instance
    const hazoConnect = get_hazo_connect_instance();

    // Update user profile
    const result = await update_user_profile(hazoConnect, user_id, {
      name,
      email,
      profile_picture_url,
      profile_source,
    });

    if (!result.success) {
      console.error("[hazo_auth/user/update] Update failed:", result.error);
      return NextResponse.json(
        { success: false, error: result.error || "Failed to update profile" },
        { status: 400 }
      );
    }

    // Update cookies if email changed
    if (email && result.email_changed) {
      cookieStore.set("hazo_auth_user_email", email, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });
    }

    // Update name cookie if provided
    if (name) {
      cookieStore.set("hazo_auth_user_name", name, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });
    }

    // Update profile picture cookie if provided
    if (profile_picture_url) {
      cookieStore.set("hazo_auth_profile_picture_url", profile_picture_url, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });
    }

    console.log("[hazo_auth/user/update] Profile updated successfully");

    return NextResponse.json({
      success: true,
      email_changed: result.email_changed,
    });
  } catch (error) {
    const error_message = error instanceof Error ? error.message : "Unknown error";
    console.error("[hazo_auth/user/update] Error:", error_message, error);
    
    return NextResponse.json(
      { success: false, error: "Failed to update profile" },
      { status: 500 }
    );
  }
}







