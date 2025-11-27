/**
 * file_description: API route for user registration using hazo_auth registration service
 * Uses hazo_auth registration service to properly register users in the database
 */

// section: route_config
export const dynamic = "force-dynamic";

// section: imports
import { NextRequest, NextResponse } from "next/server";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - webpack alias resolves this path
import { get_hazo_connect_instance } from "hazo_auth/lib/hazo_connect_instance.server";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - webpack alias resolves this path
import { register_user } from "hazo_auth/lib/services/registration_service";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - webpack alias resolves this path
import { create_app_logger } from "hazo_auth/lib/app_logger";

// section: api_handler
/**
 * POST handler for /api/hazo_auth/register
 * Registers a new user using hazo_auth registration service.
 */
export async function POST(request: NextRequest) {
  const logger = create_app_logger();

  try {
    const body = await request.json();
    const { name, email, password, url_on_logon } = body;

    // Validate input
    if (!email || !password) {
      logger.warn("registration_validation_failed", {
        filename: "route.ts",
        line_number: 25,
        email: email || "missing",
        has_password: !!password,
      });

      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const email_pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email_pattern.test(email)) {
      logger.warn("registration_invalid_email", {
        filename: "route.ts",
        line_number: 35,
        email,
      });

      return NextResponse.json(
        { error: "Invalid email address format" },
        { status: 400 }
      );
    }

    // Get singleton hazo_connect instance
    const hazoConnect = get_hazo_connect_instance();

    // Register user using the registration service
    const result = await register_user(hazoConnect, {
      email,
      password,
      name,
      url_on_logon,
    });

    if (!result.success) {
      const status_code = result.error === "Email address already registered" ? 409 : 500;

      logger.warn("registration_failed", {
        filename: "route.ts",
        line_number: 60,
        email,
        error: result.error,
      });

      return NextResponse.json(
        { error: result.error || "Registration failed" },
        { status: status_code }
      );
    }

    logger.info("registration_successful", {
      filename: "route.ts",
      line_number: 75,
      user_id: result.user_id,
      email,
      has_name: !!name,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Registration successful",
        user_id: result.user_id,
      },
      { status: 201 }
    );
  } catch (error) {
    const error_message = error instanceof Error ? error.message : "Registration failed";
    
    logger.error("registration_api_error", {
      filename: "route.ts",
      line_number: 95,
      error_message,
      error_stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}


