// hazo_auth v5.x route - lazy import to avoid barrel side effects
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const { loginPOST } = await import("hazo_auth/server/routes");
  return loginPOST(request as any);
}
