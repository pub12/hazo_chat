/**
 * hazo_chat API Module
 *
 * Provides exportable API route handlers for Next.js applications.
 * These handlers can be imported and re-exported in your API routes.
 *
 * @example
 * ```typescript
 * // app/api/hazo_chat/messages/route.ts
 * import { createMessagesHandler } from 'hazo_chat/api';
 * import { getHazoConnectSingleton } from 'hazo_connect/nextjs/setup';
 *
 * export const dynamic = 'force-dynamic';
 *
 * const { GET, POST } = createMessagesHandler({
 *   getHazoConnect: () => getHazoConnectSingleton()
 * });
 *
 * export { GET, POST };
 * ```
 *
 * @example
 * ```typescript
 * // app/api/hazo_chat/messages/[id]/route.ts
 * import { createDeleteHandler } from 'hazo_chat/api';
 * import { getHazoConnectSingleton } from 'hazo_connect/nextjs/setup';
 *
 * export const dynamic = 'force-dynamic';
 *
 * const { DELETE } = createDeleteHandler({
 *   getHazoConnect: () => getHazoConnectSingleton()
 * });
 *
 * export { DELETE };
 * ```
 */

// Export handler factories
export {
  createMessagesHandler,
  createMarkAsReadHandler,
  createDeleteHandler,
} from './messages.js';
export { createUnreadCountFunction } from './unread_count.js';

// Export validation utilities
export { is_valid_uuid, validate_uuid_array } from './validation.js';

// Export types
export type {
  MessagesHandlerOptions,
  ChatMessageInput,
  ChatMessageRecord,
  ApiErrorResponse,
  ApiSuccessResponse,
  PaginationMeta,
} from './types.js';
export type { UnreadCountFunctionOptions, UnreadCountResult } from './unread_count.js';
export type { UuidArrayValidationResult } from './validation.js';





