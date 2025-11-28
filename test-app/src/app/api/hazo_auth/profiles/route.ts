/**
 * file_description: API route to fetch user profiles by user IDs
 * Uses hazo_connect to query hazo_users table for profile data
 */

// section: route_config
export const dynamic = "force-dynamic";

// section: imports
import { NextRequest, NextResponse } from "next/server";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - webpack alias resolves this path
import { get_hazo_connect_instance } from "hazo_auth/lib/hazo_connect_instance.server";
import { createCrudService } from "hazo_connect/server";

// section: types
interface HazoUser extends Record<string, unknown> {
  id: string;
  email_address: string;
  name: string | null;
  profile_picture_url: string | null;
  is_active: number;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
}

// section: api_handler
/**
 * POST handler - Fetch user profiles by IDs
 * Body: { user_ids: string[] }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_ids } = body as { user_ids: string[] };

    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: "user_ids array is required", profiles: [] },
        { status: 400 }
      );
    }

    console.log("[hazo_auth/profiles] Fetching profiles for:", user_ids);

    // Get hazo_connect instance and create crud service
    const hazoConnect = get_hazo_connect_instance();
    const usersService = createCrudService<HazoUser>(hazoConnect, "hazo_users");

    // Fetch profiles for each user ID
    const profiles: UserProfile[] = [];
    
    for (const user_id of user_ids) {
      const user = await usersService.findById(user_id);
      if (user) {
        profiles.push({
          id: user.id,
          name: user.name || user.email_address.split("@")[0],
          email: user.email_address,
          avatar_url: user.profile_picture_url,
        });
      }
    }

    console.log("[hazo_auth/profiles] Found profiles:", profiles.length);

    return NextResponse.json({
      success: true,
      profiles,
    });
  } catch (error) {
    const error_message = error instanceof Error ? error.message : "Unknown error";
    console.error("[hazo_auth/profiles] Error:", error_message, error);
    
    return NextResponse.json(
      { success: false, error: "Failed to fetch profiles", profiles: [] },
      { status: 500 }
    );
  }
}



