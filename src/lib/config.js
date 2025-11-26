"use strict";
/**
 * Configuration utilities for the hazo_chat package
 *
 * Browser-compatible configuration management.
 * Configuration can be set via environment variables or passed directly.
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.get_chat_config = get_chat_config;
exports.set_chat_config = set_chat_config;
exports.reset_chat_config = reset_chat_config;
// Default configuration values
var DEFAULT_CONFIG = {
    max_message_length: 1000,
    enable_timestamps: true,
    enable_avatars: true,
    date_format: 'short'
};
// Cached configuration
var cached_config = null;
/**
 * Get chat-specific configuration
 *
 * Returns the chat configuration with defaults.
 * Values can be overridden via environment variables:
 * - NEXT_PUBLIC_CHAT_MAX_MESSAGE_LENGTH
 * - NEXT_PUBLIC_CHAT_ENABLE_TIMESTAMPS
 * - NEXT_PUBLIC_CHAT_ENABLE_AVATARS
 * - NEXT_PUBLIC_CHAT_DATE_FORMAT
 *
 * @returns Chat configuration object
 */
function get_chat_config() {
    if (!cached_config) {
        cached_config = {
            max_message_length: get_env_number('NEXT_PUBLIC_CHAT_MAX_MESSAGE_LENGTH', DEFAULT_CONFIG.max_message_length),
            enable_timestamps: get_env_boolean('NEXT_PUBLIC_CHAT_ENABLE_TIMESTAMPS', DEFAULT_CONFIG.enable_timestamps),
            enable_avatars: get_env_boolean('NEXT_PUBLIC_CHAT_ENABLE_AVATARS', DEFAULT_CONFIG.enable_avatars),
            date_format: get_env_string('NEXT_PUBLIC_CHAT_DATE_FORMAT', DEFAULT_CONFIG.date_format)
        };
    }
    return cached_config;
}
/**
 * Set chat configuration programmatically
 *
 * Allows overriding configuration values directly in code.
 *
 * @param config - Partial configuration to merge with defaults
 */
function set_chat_config(config) {
    cached_config = __assign(__assign({}, get_chat_config()), config);
}
/**
 * Reset configuration to defaults
 */
function reset_chat_config() {
    cached_config = null;
}
// ============================================================================
// Helper Functions
// ============================================================================
/**
 * Get environment variable as string with fallback
 */
function get_env_string(key, fallback) {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
        return process.env[key];
    }
    return fallback;
}
/**
 * Get environment variable as number with fallback
 */
function get_env_number(key, fallback) {
    var value = get_env_string(key, '');
    if (value) {
        var parsed = parseInt(value, 10);
        if (!isNaN(parsed)) {
            return parsed;
        }
    }
    return fallback;
}
/**
 * Get environment variable as boolean with fallback
 */
function get_env_boolean(key, fallback) {
    var value = get_env_string(key, '');
    if (value) {
        return value.toLowerCase() === 'true';
    }
    return fallback;
}
