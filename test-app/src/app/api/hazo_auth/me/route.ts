/**
 * file_description: API route to get current authenticated user info
 * Returns user info if authenticated, or { authenticated: false } if not
 * Uses hazo_get_auth to properly validate authentication against the database
 */

// section: route_config
export const dynamic = "force-dynamic";

// section: imports
import { NextRequest, NextResponse } from "next/server";
import { hazo_get_auth } from "hazo_auth/lib/auth/hazo_get_auth.server";

// section: api_handler
/**
 * GET handler for /api/hazo_auth/me
 * Returns user info if authenticated, or { authenticated: false } if not.
 * Uses hazo_get_auth to properly validate authentication against the database.
 */
export async function GET(request: NextRequest) {
  try {
    // Use hazo_get_auth to check authentication
    const auth_result = await hazo_get_auth(request);

    if (!auth_result.authenticated || !auth_result.user) {
      return NextResponse.json({
        authenticated: false,
        user: null,
        permissions: [],
        permission_ok: false,
      });
    }

    // Return user info from hazo_get_auth result
    return NextResponse.json({
      authenticated: true,
      user_id: auth_result.user.id,
      email: auth_result.user.email_address || null,
      name: auth_result.user.name || null,
      profile_picture_url: auth_result.user.profile_picture_url || null,
      // Include hazo_auth v1.4.0 fields
      user: {
        id: auth_result.user.id,
        email_address: auth_result.user.email_address || null,
        name: auth_result.user.name || null,
        profile_picture_url: auth_result.user.profile_picture_url || null,
        is_active: auth_result.user.is_active ?? true,
      },
      permissions: auth_result.permissions || [],
      permission_ok: auth_result.permission_ok || false,
    });
  } catch (error) {
    console.error("[hazo_auth/me] Error:", error);
    return NextResponse.json({
      authenticated: false,
      user: null,
      permissions: [],
      permission_ok: false,
    });
  }
}
