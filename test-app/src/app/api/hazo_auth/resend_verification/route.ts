/**
 * file_description: API route for resending email verification
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
import { resend_verification_email } from "hazo_auth/lib/services/email_verification_service";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - webpack alias resolves this path
import { create_app_logger } from "hazo_auth/lib/app_logger";

// section: api_handler
export async function POST(request: NextRequest) {
  const logger = create_app_logger();

  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const email_pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email_pattern.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address format" },
        { status: 400 }
      );
    }

    const hazoConnect = get_hazo_connect_instance();
    const result = await resend_verification_email(hazoConnect, { email });

    if (!result.success) {
      logger.error("resend_verification_failed", {
        filename: "route.ts",
        line_number: 45,
        email,
        error: result.error,
      });

      return NextResponse.json(
        { success: false, error: result.error || "Failed to resend verification email" },
        { status: 500 }
      );
    }

    logger.info("resend_verification_requested", {
      filename: "route.ts",
      line_number: 55,
      email,
    });

    return NextResponse.json({
      success: true,
      message: "If an account with that email exists and is not verified, a verification link has been sent.",
    });
  } catch (error) {
    const error_message = error instanceof Error ? error.message : "Unknown error";
    logger.error("resend_verification_error", {
      filename: "route.ts",
      line_number: 70,
      error_message,
    });

    return NextResponse.json({
      success: true,
      message: "If an account with that email exists and is not verified, a verification link has been sent.",
    });
  }
}







