// hazo_auth v5.x route - lazy import to avoid barrel side effects
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";

export async function DELETE(request: NextRequest) {
  const { removeProfilePictureDELETE } = await import("hazo_auth/server/routes");
  return removeProfilePictureDELETE(request as any);
}
