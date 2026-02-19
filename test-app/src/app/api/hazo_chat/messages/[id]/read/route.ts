/**
 * file_description: API route to mark a chat message as read
 * Uses the exportable handler from hazo_chat package
 * Supports PATCH for marking messages as read
 */

// section: route_config
export const dynamic = "force-dynamic";

// section: imports
import { NextRequest } from "next/server";
import { get_hazo_connect_instance } from "hazo_auth/server-lib";
import { createMarkAsReadHandler } from "hazo_chat/api";
import { createLogger, type Logger } from "hazo_logs";

// section: logger_creation
// Lazy logger creation to avoid winston bundling issues with Next.js
let logger: Logger | null = null;
function getLogger(): Logger {
  if (!logger) {
    logger = createLogger("hazo_chat");
  }
  return logger;
}

// section: handler_creation
// Create handler using the exportable factory from hazo_chat
const { PATCH: patchHandler } = createMarkAsReadHandler({
  getHazoConnect: () => get_hazo_connect_instance(),
  getLogger,
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

