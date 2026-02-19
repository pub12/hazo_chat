// hazo_auth v5.x route - lazy import to avoid barrel side effects
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { libraryPhotosGET } = await import("hazo_auth/server/routes");
  return libraryPhotosGET(request as any);
}
