/**
 * file_description: API route to save and fetch chat messages from hazo_chat table
 * Uses the exportable handler from hazo_chat package
 * Supports POST for saving messages and GET for fetching chat history
 */

// section: route_config
export const dynamic = "force-dynamic";

// section: imports
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - webpack alias resolves this path
import { get_hazo_connect_instance } from "hazo_auth/lib/hazo_connect_instance.server";
import { createMessagesHandler } from "hazo_chat/api";

// section: handler_creation
// Create handlers using the exportable factory from hazo_chat
const { GET, POST } = createMessagesHandler({
  getHazoConnect: () => get_hazo_connect_instance()
});

// section: exports
export { GET, POST };
