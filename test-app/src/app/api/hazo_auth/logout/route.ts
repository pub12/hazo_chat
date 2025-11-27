/**
 * file_description: API route for user logout
 * Clears authentication cookies to log out the user
 */

// section: imports
import { NextRequest, NextResponse } from "next/server";

// section: api_handler
export async function POST(request: NextRequest) {
  try {
    // Get user info from cookie before clearing (for logging)
    const user_email = request.cookies.get("hazo_auth_user_email")?.value;
    const user_id = request.cookies.get("hazo_auth_user_id")?.value;

    // Create success response
    const response = NextResponse.json(
      {
        success: true,
        message: "Logout successful",
      },
      { status: 200 }
    );

    // Clear cookies by setting them to expire in the past
    response.cookies.set("hazo_auth_user_email", "", {
      expires: new Date(0),
      path: "/",
    });
    response.cookies.set("hazo_auth_user_id", "", {
      expires: new Date(0),
      path: "/",
    });
    response.cookies.set("hazo_auth_user_name", "", {
      expires: new Date(0),
      path: "/",
    });
    response.cookies.set("hazo_auth_profile_picture_url", "", {
      expires: new Date(0),
      path: "/",
    });

    // Log logout (using console for simplicity in test app)
    if (user_email || user_id) {
      console.log("[hazo_auth/logout] User logged out:", {
        user_id: user_id || "unknown",
        email: user_email || "unknown",
      });
    }

    return response;
  } catch (error) {
    const error_message = error instanceof Error ? error.message : "Unknown error";
    console.error("[hazo_auth/logout] Error:", error_message);

    return NextResponse.json(
      { error: "Logout failed. Please try again." },
      { status: 500 }
    );
  }
}
