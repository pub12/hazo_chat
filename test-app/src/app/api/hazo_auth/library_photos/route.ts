/**
 * file_description: API route to serve library photos for profile picture selection
 * This route returns categories and photos from the hazo_auth library
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
// @ts-ignore - webpack alias resolves this path
import { get_library_categories, get_library_photos } from "hazo_auth/lib/services/profile_picture_service";

/**
 * section: get_handler
 * GET handler for library photos
 * - Without category param: returns list of categories
 * - With category param: returns photos in that category
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    if (category) {
      // Return photos for specific category
      const photos = get_library_photos(category);
      return NextResponse.json({ success: true, photos });
    } else {
      // Return all categories
      const categories = get_library_categories();
      return NextResponse.json({ success: true, categories });
    }
  } catch (error) {
    console.error("[hazo_auth/library_photos] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load library photos", categories: [], photos: [] },
      { status: 500 }
    );
  }
}



