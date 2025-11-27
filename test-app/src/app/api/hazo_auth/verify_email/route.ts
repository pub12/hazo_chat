/**
 * file_description: API route for email verification using hazo_auth service
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
import { verify_email_token } from "hazo_auth/lib/services/email_verification_service";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - webpack alias resolves this path
import { create_app_logger } from "hazo_auth/lib/app_logger";

// section: api_handler
export async function GET(request: NextRequest) {
  const logger = create_app_logger();

  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      logger.warn("email_verification_validation_failed", {
        filename: "route.ts",
        line_number: 25,
        has_token: false,
      });

      return NextResponse.json(
        { error: "Verification token is required" },
        { status: 400 }
      );
    }

    const hazoConnect = get_hazo_connect_instance();
    const result = await verify_email_token(hazoConnect, { token });

    if (!result.success) {
      logger.warn("email_verification_failed", {
        filename: "route.ts",
        line_number: 40,
        error: result.error,
      });

      return NextResponse.json(
        { error: result.error || "Email verification failed" },
        { status: 400 }
      );
    }

    logger.info("email_verification_successful", {
      filename: "route.ts",
      line_number: 50,
      user_id: result.user_id,
      email: result.email,
    });

    return NextResponse.json({
      success: true,
      message: "Email verified successfully",
      user_id: result.user_id,
      email: result.email,
    });
  } catch (error) {
    const error_message = error instanceof Error ? error.message : "Unknown error";
    logger.error("email_verification_error", {
      filename: "route.ts",
      line_number: 65,
      error_message,
    });

    return NextResponse.json(
      { error: "Email verification failed. Please try again." },
      { status: 500 }
    );
  }
}


