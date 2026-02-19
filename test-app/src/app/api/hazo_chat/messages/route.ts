/**
 * file_description: API route to save and fetch chat messages from hazo_chat table
 * Uses the exportable handler from hazo_chat package
 * Supports POST for saving messages and GET for fetching chat history
 */

// section: route_config
export const dynamic = "force-dynamic";

// section: imports
import { get_hazo_connect_instance } from "hazo_auth/server-lib";
import { createMessagesHandler } from "hazo_chat/api";
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
// Create handlers using the exportable factory from hazo_chat
const { GET, POST } = createMessagesHandler({
  getHazoConnect: () => get_hazo_connect_instance(),
  getLogger,
});

// section: exports
export { GET, POST };
