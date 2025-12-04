/**
 * file_description: API route to mark a chat message as read
 * Uses the exportable handler from hazo_chat package
 * Supports PATCH for marking messages as read
 */

// section: route_config
export const dynamic = "force-dynamic";

// section: imports
import { NextRequest } from "next/server";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - webpack alias resolves this path
import { get_hazo_connect_instance } from "hazo_auth/lib/hazo_connect_instance.server";
import { createMarkAsReadHandler } from "hazo_chat/api";

// section: handler_creation
// Create handler using the exportable factory from hazo_chat
const { PATCH: patchHandler } = createMarkAsReadHandler({
  getHazoConnect: () => get_hazo_connect_instance()
});

// section: wrapper_handler
// Wrapper to handle Next.js App Router params
async function PATCH(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  return patchHandler(request, context);
}

// section: exports
export { PATCH };

