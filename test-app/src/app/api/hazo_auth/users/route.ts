/**
 * file_description: API route to fetch all users from hazo_users table
 * Custom route - no standardized re-export available (test UI user listing)
 */

// section: route_config
export const dynamic = "force-dynamic";

// section: imports
import { NextRequest, NextResponse } from "next/server";
import { get_hazo_connect_instance } from "hazo_auth/server-lib";
import { createCrudService } from "hazo_connect/server";
import { cookies } from "next/headers";

// section: types
interface HazoUser {
  id: string;
  email_address: string;
  name: string | null;
  profile_picture_url: string | null;
  is_active: number;
}

// section: api_handler
export async function GET(request: NextRequest) {
  try {
    // Get current user ID from cookies
    const cookieStore = cookies();
    const current_user_id = cookieStore.get("hazo_auth_user_id")?.value;

    // Get hazo_connect instance
    const hazoConnect = get_hazo_connect_instance();
    const usersService = createCrudService(hazoConnect, "hazo_users");

    // Fetch all active users
    const all_users = await usersService.findBy({ is_active: 1 });

    // Filter out current user and map to response format
    const users = (all_users as unknown as HazoUser[])
      .filter((user) => user.id !== current_user_id)
      .map((user) => ({
        id: user.id,
        email: user.email_address,
        name: user.name || user.email_address.split("@")[0],
        profile_picture_url: user.profile_picture_url,
      }));

    return NextResponse.json({
      success: true,
      users,
      current_user_id,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch users", users: [] },
      { status: 500 }
    );
  }
}
