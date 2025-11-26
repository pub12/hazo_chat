/**
 * Configuration utilities for the hazo_chat package
 * 
 * Browser-compatible configuration management.
 * Configuration can be set via environment variables or passed directly.
 */

// Default configuration values
const DEFAULT_CONFIG: ChatConfig = {
  max_message_length: 1000,
  enable_timestamps: true,
  enable_avatars: true,
  date_format: 'short'
};

// Cached configuration
let cached_config: ChatConfig | null = null;

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
export function get_chat_config(): ChatConfig {
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
export function set_chat_config(config: Partial<ChatConfig>): void {
  cached_config = {
    ...get_chat_config(),
    ...config
  };
}

/**
 * Reset configuration to defaults
 */
export function reset_chat_config(): void {
  cached_config = null;
}

/**
 * Chat configuration interface
 */
export interface ChatConfig {
  max_message_length: number;
  enable_timestamps: boolean;
  enable_avatars: boolean;
  date_format: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get environment variable as string with fallback
 */
function get_env_string(key: string, fallback: string): string {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  return fallback;
}

/**
 * Get environment variable as number with fallback
 */
function get_env_number(key: string, fallback: number): number {
  const value = get_env_string(key, '');
  if (value) {
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed)) {
      return parsed;
    }
  }
  return fallback;
}

/**
 * Get environment variable as boolean with fallback
 */
function get_env_boolean(key: string, fallback: boolean): boolean {
  const value = get_env_string(key, '');
  if (value) {
    return value.toLowerCase() === 'true';
  }
  return fallback;
}
