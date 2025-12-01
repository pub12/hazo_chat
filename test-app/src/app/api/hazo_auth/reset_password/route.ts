/**
 * file_description: API route for resetting password using a reset token
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
import { reset_password } from "hazo_auth/lib/services/password_reset_service";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - webpack alias resolves this path
import { create_app_logger } from "hazo_auth/lib/app_logger";

// section: api_handler
export async function POST(request: NextRequest) {
  const logger = create_app_logger();

  try {
    const body = await request.json();
    const { token, new_password } = body;

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    if (!new_password) {
      return NextResponse.json(
        { error: "New password is required" },
        { status: 400 }
      );
    }

    const hazoConnect = get_hazo_connect_instance();
    const result = await reset_password(hazoConnect, {
      token,
      new_password,
      minimum_length: 8,
    });

    if (!result.success) {
      logger.warn("password_reset_failed", {
        filename: "route.ts",
        line_number: 50,
        error: result.error,
      });

      return NextResponse.json(
        { success: false, error: result.error || "Failed to reset password" },
        { status: 400 }
      );
    }

    logger.info("password_reset_successful", {
      filename: "route.ts",
      line_number: 60,
      user_id: result.user_id,
    });

    return NextResponse.json({
      success: true,
      message: "Password has been reset successfully",
    });
  } catch (error) {
    const error_message = error instanceof Error ? error.message : "Unknown error";
    logger.error("password_reset_error", {
      filename: "route.ts",
      line_number: 75,
      error_message,
    });

    return NextResponse.json(
      { success: false, error: "An error occurred while resetting your password" },
      { status: 500 }
    );
  }
}







