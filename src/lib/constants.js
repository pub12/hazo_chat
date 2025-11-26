"use strict";
/**
 * Default constants and configuration values for hazo_chat
 *
 * These values are used as fallbacks when config file is not available
 * or specific values are not set.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LOADING_MESSAGES_TEXT = exports.EMPTY_CHAT_MESSAGE = exports.DELETED_MESSAGE_PLACEHOLDER = exports.ANIMATION_DURATION = exports.RETRY_BASE_DELAY = exports.MAX_RETRY_ATTEMPTS = exports.MOBILE_BREAKPOINT = exports.PREVIEWABLE_TYPES = exports.MIME_TYPE_MAP = exports.DEFAULT_TIMEZONE = exports.DEFAULT_ALLOWED_TYPES = exports.DEFAULT_MAX_FILE_SIZE_MB = exports.DEFAULT_MESSAGES_PER_PAGE = exports.DEFAULT_POLLING_INTERVAL = void 0;
// ============================================================================
// Default Configuration Values
// ============================================================================
/** Default polling interval in milliseconds */
exports.DEFAULT_POLLING_INTERVAL = 5000;
/** Default number of messages to load per page */
exports.DEFAULT_MESSAGES_PER_PAGE = 20;
/** Default maximum file size in MB */
exports.DEFAULT_MAX_FILE_SIZE_MB = 10;
/** Default allowed file types for upload */
exports.DEFAULT_ALLOWED_TYPES = [
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
exports.DEFAULT_TIMEZONE = 'GMT+10';
// ============================================================================
// MIME Type Mappings
// ============================================================================
/** Map file extensions to MIME types */
exports.MIME_TYPE_MAP = {
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
exports.PREVIEWABLE_TYPES = {
    pdf: ['application/pdf'],
    image: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
    text: ['text/plain']
};
// ============================================================================
// UI Constants
// ============================================================================
/** Breakpoint for mobile/desktop layout switch */
exports.MOBILE_BREAKPOINT = 768;
/** Maximum retry attempts for failed operations */
exports.MAX_RETRY_ATTEMPTS = 3;
/** Base delay for exponential backoff (ms) */
exports.RETRY_BASE_DELAY = 1000;
/** Animation duration for UI transitions (ms) */
exports.ANIMATION_DURATION = 200;
// ============================================================================
// Message Status
// ============================================================================
/** Placeholder text for deleted messages */
exports.DELETED_MESSAGE_PLACEHOLDER = 'This message has been deleted';
/** Text shown when no messages exist */
exports.EMPTY_CHAT_MESSAGE = 'No messages yet. Start the conversation!';
/** Text shown when loading messages */
exports.LOADING_MESSAGES_TEXT = 'Loading messages...';
