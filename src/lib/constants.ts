/**
 * Default constants and configuration values for hazo_chat
 * 
 * These values are used as fallbacks when config file is not available
 * or specific values are not set.
 */

// ============================================================================
// Default Configuration Values
// ============================================================================

/** Default polling interval in milliseconds */
export const DEFAULT_POLLING_INTERVAL = 5000;

/** Default number of messages to load per page */
export const DEFAULT_MESSAGES_PER_PAGE = 20;

/** Default maximum file size in MB */
export const DEFAULT_MAX_FILE_SIZE_MB = 10;

/** Default allowed file types for upload */
export const DEFAULT_ALLOWED_TYPES = [
  'pdf',
  'png',
  'jpg',
  'jpeg',
  'gif',
  'txt',
  'doc',
  'docx'
];

/** Default timezone */
export const DEFAULT_TIMEZONE = 'GMT+10';

// ============================================================================
// MIME Type Mappings
// ============================================================================

/** Map file extensions to MIME types */
export const MIME_TYPE_MAP: Record<string, string> = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  txt: 'text/plain',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
};

/** File types that can be previewed in the document viewer */
export const PREVIEWABLE_TYPES = {
  pdf: ['application/pdf'],
  image: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
  text: ['text/plain']
};

// ============================================================================
// UI Constants
// ============================================================================

/** Breakpoint for mobile/desktop layout switch */
export const MOBILE_BREAKPOINT = 768;

/** Maximum retry attempts for failed operations */
export const MAX_RETRY_ATTEMPTS = 3;

/** Base delay for exponential backoff (ms) */
export const RETRY_BASE_DELAY = 1000;

/** Animation duration for UI transitions (ms) */
export const ANIMATION_DURATION = 200;

// ============================================================================
// Message Status
// ============================================================================

/** Placeholder text for deleted messages */
export const DELETED_MESSAGE_PLACEHOLDER = 'This message has been deleted';

/** Text shown when no messages exist */
export const EMPTY_CHAT_MESSAGE = 'No messages yet. Start the conversation!';

/** Text shown when loading messages */
export const LOADING_MESSAGES_TEXT = 'Loading messages...';

