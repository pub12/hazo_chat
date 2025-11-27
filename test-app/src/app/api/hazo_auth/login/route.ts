/**
 * file_description: API route for user login using hazo_auth login service
 * Uses hazo_auth login service to properly validate credentials against the database
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
import { authenticate_user } from "hazo_auth/lib/services/login_service";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - webpack alias resolves this path
import { create_app_logger } from "hazo_auth/lib/app_logger";
import { createCrudService } from "hazo_connect/server";

// section: api_handler
/**
 * POST handler for /api/hazo_auth/login
 * Validates credentials against the database and sets authentication cookies.
 */
export async function POST(request: NextRequest) {
  const logger = create_app_logger();

  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Get singleton hazo_connect instance
    const hazoConnect = get_hazo_connect_instance();

    // Authenticate user using the login service
    const result = await authenticate_user(hazoConnect, {
      email,
      password,
    });

    if (!result.success || !result.user_id) {
      logger.warn("login_failed", {
        filename: "route.ts",
        line_number: 50,
        email,
        error: result.error,
        email_not_verified: result.email_not_verified,
      });

      return NextResponse.json(
        { success: false, error: result.error || "Invalid email or password" },
        { status: 401 }
      );
    }

    // Fetch user details from database
    const usersService = createCrudService(hazoConnect, "hazo_users");
    const users = await usersService.findBy({ id: result.user_id });
    const user = Array.isArray(users) && users.length > 0 ? users[0] : null;

    if (!user) {
      logger.error("login_user_not_found", {
        filename: "route.ts",
        line_number: 70,
        user_id: result.user_id,
      });

      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 500 }
      );
    }

    // Set auth cookies
    const cookieStore = cookies();
    const cookie_options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    };

    const user_email = (user.email_address as string) || email;
    const user_name = (user.name as string) || null;
    const profile_picture_url = (user.profile_picture_url as string) || null;

    cookieStore.set("hazo_auth_user_id", result.user_id, cookie_options);
    cookieStore.set("hazo_auth_user_email", user_email, cookie_options);
    if (user_name) {
      cookieStore.set("hazo_auth_user_name", user_name, cookie_options);
    }
    if (profile_picture_url) {
      cookieStore.set("hazo_auth_profile_picture_url", profile_picture_url, cookie_options);
    }

    logger.info("login_successful", {
      filename: "route.ts",
      line_number: 100,
      user_id: result.user_id,
      email,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: result.user_id,
        email: user_email,
        name: user_name,
      },
      stored_url_on_logon: result.stored_url_on_logon,
    });
  } catch (error) {
    const error_message = error instanceof Error ? error.message : "Login failed";
    console.error("Error in /api/hazo_auth/login:", error);
    
    logger.error("login_api_error", {
      filename: "route.ts",
      line_number: 120,
      error_message,
      error_stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { success: false, error: "Login failed. Please try again." },
      { status: 500 }
    );
  }
}
