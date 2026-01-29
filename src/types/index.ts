/**
 * Type definitions for the hazo_chat package
 *
 * Contains all TypeScript interfaces and types used across the package
 * for props, messages, references, user profiles, and configuration.
 *
 * This package uses an API-first architecture - all data access is done
 * via fetch() calls to API endpoints, not direct database access.
 */

import type { ReactNode } from 'react';

// Re-export Logger types from hazo_logs for consumer convenience
export type { Logger } from 'hazo_logs';
export type { ClientLogger } from 'hazo_logs/ui';
import type { ClientLogger } from 'hazo_logs/ui';

// ============================================================================
// User Profile Types
// ============================================================================

/**
 * Authenticated user information
 */
export interface HazoAuthUser {
  id: string;
  email?: string;
}

/**
 * User profile with display information
 */
export interface HazoUserProfile {
  id: string;
  name: string;
  email?: string;
  avatar_url?: string;
}

// ============================================================================
// Chat Message Types
// ============================================================================

/**
 * Database schema for hazo_chat table
 */
export interface ChatMessageDB {
  id: string;
  reference_id: string;
  reference_type: string;
  sender_user_id: string;
  chat_group_id: string;
  message_text: string | null;
  reference_list: ChatReferenceItem[] | null;
  read_at: string | null;
  deleted_at: string | null;
  created_at: string;
  changed_at: string;
}

/**
 * Chat message with user profile data attached
 */
export interface ChatMessage extends ChatMessageDB {
  sender_profile?: HazoUserProfile;
  is_sender: boolean;
  send_status?: MessageSendStatus;
}

/**
 * Status of message sending operation
 */
export type MessageSendStatus = 'sending' | 'sent' | 'failed';

/**
 * Payload for creating a new chat message
 */
export interface CreateMessagePayload {
  reference_id: string;
  reference_type: string;
  chat_group_id: string;
  message_text: string;
  reference_list?: ChatReferenceItem[];
}

// ============================================================================
// Chat Group Types
// ============================================================================

/**
 * Type of chat group
 * - 'support': Client-to-staff support conversation
 * - 'peer': Peer-to-peer direct message (1:1)
 * - 'group': Multi-user group conversation
 */
export type ChatGroupType = 'support' | 'peer' | 'group';

/**
 * Role of a user within a chat group
 * - 'client': Customer/end-user in support scenarios
 * - 'staff': Support personnel in support scenarios
 * - 'owner': Creator of peer/group chats
 * - 'admin': Delegated administrator in group chats
 * - 'member': Standard participant in peer/group chats
 */
export type ChatGroupUserRole = 'client' | 'staff' | 'owner' | 'admin' | 'member';

/**
 * Database schema for hazo_chat_group table
 */
export interface ChatGroup {
  id: string;
  /** The fixed client user (optional - only for support groups) */
  client_user_id?: string | null;
  /** Type of conversation: 'support', 'peer', or 'group' */
  group_type?: ChatGroupType;
  name?: string;
  created_at: string;
  changed_at: string | null;
}

/**
 * Database schema for hazo_chat_group_users table
 */
export interface ChatGroupUser {
  chat_group_id: string;
  user_id: string;
  role: ChatGroupUserRole;
  created_at: string;
  changed_at: string | null;
}

/**
 * Chat group with members and profiles attached
 */
export interface ChatGroupWithMembers extends ChatGroup {
  members: ChatGroupUser[];
  /** Profile of the client user (for support groups) */
  client_profile?: HazoUserProfile;
  /** Profiles of all group members */
  member_profiles?: HazoUserProfile[];
  /** Profile of the group owner (for peer/group chats) */
  owner_profile?: HazoUserProfile;
}

// ============================================================================
// Reference Types
// ============================================================================

/**
 * Type of reference item
 */
export type ReferenceType = 'document' | 'field' | 'url';

/**
 * Scope of reference (where it's visible)
 */
export type ReferenceScope = 'chat' | 'field';

/**
 * Reference item in reference list or reference_list JSON column
 */
export interface ChatReferenceItem {
  id: string;
  type: ReferenceType;
  scope: ReferenceScope;
  name: string;
  url: string;
  mime_type?: string;
  file_size?: number;
  message_id?: string;
}

/**
 * Reference item passed as prop (external references)
 */
export interface ReferenceItem {
  id: string;
  type: ReferenceType;
  scope: ReferenceScope;
  name: string;
  url: string;
  mime_type?: string;
}

// ============================================================================
// File Attachment Types
// ============================================================================

/**
 * Pending file attachment before upload
 */
export interface PendingAttachment {
  id: string;
  file: File;
  preview_url?: string;
  upload_progress?: number;
  upload_status: 'pending' | 'uploading' | 'uploaded' | 'failed';
  error_message?: string;
}

/**
 * Uploaded file result
 */
export interface UploadedFile {
  id: string;
  name: string;
  url: string;
  mime_type: string;
  file_size: number;
}

/**
 * File upload validation result
 */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

// ============================================================================
// Component Props Types
// ============================================================================

/**
 * Main HazoChat component props
 *
 * This component uses API calls internally - no database adapters needed.
 * Consumers must set up the required API routes (see SETUP_CHECKLIST.md).
 */
export interface HazoChatProps {
  /** UUID of the chat group (required) */
  chat_group_id: string;
  /**
   * Logger instance from hazo_logs/ui (required).
   * Create using: createClientLogger({ packageName: 'hazo_chat' })
   */
  logger: ClientLogger;
  /** Main field reference ID for chat context grouping */
  reference_id?: string;
  /** Reference type for the main reference (default: 'chat') */
  reference_type?: string;
  /** Base URL for API endpoints (default: '/api/hazo_chat') */
  api_base_url?: string;
  /** Additional field references (optional) */
  additional_references?: ReferenceItem[];
  /** Timezone for timestamps (default: "GMT+10") */
  timezone?: string;
  /** Chat window title */
  title?: string;
  /** Chat window subtitle */
  subtitle?: string;
  /** Close button callback */
  on_close?: () => void;
  /** Real-time update mode: 'polling' (automatic) or 'manual' (refresh only) */
  realtime_mode?: RealtimeMode;
  /** Polling interval in milliseconds (only used when realtime_mode = 'polling') */
  polling_interval?: number;
  /** Number of messages per page for pagination */
  messages_per_page?: number;
  /** Enable polling debug logs - default: false (reduces verbosity) */
  log_polling?: boolean;
  /** Show sidebar toggle button (hamburger menu) - default: false */
  show_sidebar_toggle?: boolean;
  /** Show delete button on chat bubbles - default: true */
  show_delete_button?: boolean;
  /** Bubble border radius style - default: 'default' */
  bubble_radius?: 'default' | 'full';
  /** Read-only mode - hides chat input when true (default: false) */
  read_only?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Props for HazoChatHeader component
 */
export interface HazoChatHeaderProps {
  title?: string;
  subtitle?: string;
  on_close?: () => void;
  on_refresh?: () => void;
  is_refreshing?: boolean;
  on_toggle_sidebar?: () => void;
  is_sidebar_open?: boolean;
  /** Show sidebar toggle button (hamburger menu) - default: false */
  show_sidebar_toggle?: boolean;
  className?: string;
}

/**
 * Props for HazoChatSidebar component
 */
export interface HazoChatSidebarProps {
  is_open: boolean;
  on_close: () => void;
  className?: string;
  children?: ReactNode;
}

/**
 * Props for HazoChatReferenceList component
 */
export interface HazoChatReferenceListProps {
  references: ChatReferenceItem[];
  selected_reference_id?: string;
  on_select: (reference: ChatReferenceItem) => void;
  className?: string;
}

/**
 * Props for HazoChatDocumentViewer component
 */
export interface HazoChatDocumentViewerProps {
  reference?: ChatReferenceItem;
  className?: string;
}

/**
 * Props for HazoChatMessages component
 */
export interface HazoChatMessagesProps {
  messages: ChatMessage[];
  current_user_id: string;
  timezone: string;
  is_loading: boolean;
  has_more: boolean;
  on_load_more: () => void;
  on_delete_message: (message_id: string) => void;
  on_mark_as_read?: (message_id: string) => void;
  on_scroll_to_message?: (message_id: string) => void;
  highlighted_message_id?: string;
  /** Show delete button on chat bubbles - default: true */
  show_delete_button?: boolean;
  /** Bubble border radius style - default: 'default' */
  bubble_radius?: 'default' | 'full';
  className?: string;
}

/**
 * Props for HazoChatInput component
 */
export interface HazoChatInputProps {
  on_send: (message: string, attachments: UploadedFile[]) => void;
  pending_attachments: PendingAttachment[];
  on_add_attachment: (files: File[]) => void;
  on_remove_attachment: (attachment_id: string) => void;
  is_disabled?: boolean;
  placeholder?: string;
  className?: string;
}

/**
 * Props for HazoChatAttachmentPreview component
 */
export interface HazoChatAttachmentPreviewProps {
  attachments: PendingAttachment[];
  on_remove: (attachment_id: string) => void;
  className?: string;
}

/**
 * Props for ChatBubble component
 */
export interface ChatBubbleProps {
  message: ChatMessage;
  is_sender: boolean;
  sender_profile?: HazoUserProfile;
  timezone: string;
  on_delete?: () => void;
  on_reference_click?: (reference: ChatReferenceItem) => void;
  is_highlighted?: boolean;
  /** Show delete button on chat bubbles - default: true */
  show_delete_button?: boolean;
  /** Bubble border radius style - default: 'default' */
  bubble_radius?: 'default' | 'full';
  className?: string;
}

/**
 * Props for LoadingSkeleton component
 */
export interface LoadingSkeletonProps {
  type: 'message' | 'reference' | 'viewer';
  count?: number;
  className?: string;
}

// ============================================================================
// Context Types
// ============================================================================

/**
 * State for HazoChatContext
 */
export interface HazoChatContextState {
  /** Current authenticated user */
  current_user: HazoUserProfile | null;
  /** Selected reference to display in viewer */
  selected_reference: ChatReferenceItem | null;
  /** ID of message to scroll to and highlight */
  highlighted_message_id: string | null;
  /** Pending file attachments */
  pending_attachments: PendingAttachment[];
  /** Whether sidebar is open (mobile) */
  is_sidebar_open: boolean;
  /** Polling connection status */
  polling_status: PollingStatus;
  /** All references from messages and props */
  all_references: ChatReferenceItem[];
  /** Error message if any */
  error_message: string | null;
}

/**
 * Actions for HazoChatContext
 */
export interface HazoChatContextActions {
  set_selected_reference: (reference: ChatReferenceItem | null) => void;
  set_highlighted_message_id: (message_id: string | null) => void;
  add_pending_attachment: (file: File) => void;
  remove_pending_attachment: (attachment_id: string) => void;
  update_pending_attachment: (attachment_id: string, updates: Partial<PendingAttachment>) => void;
  clear_pending_attachments: () => void;
  toggle_sidebar: () => void;
  set_sidebar_open: (is_open: boolean) => void;
  set_error_message: (message: string | null) => void;
  add_reference: (reference: ChatReferenceItem) => void;
}

/**
 * Full HazoChatContext value
 */
export interface HazoChatContextValue extends HazoChatContextState, HazoChatContextActions {
  /** Logger instance from hazo_logs/ui */
  logger: ClientLogger;
}

/**
 * Real-time update mode
 * - 'polling': Automatic polling at configured interval
 * - 'manual': Only update when user triggers refresh
 * - 'websocket': (Future) WebSocket-based real-time updates
 * - 'sse': (Future) Server-Sent Events-based updates
 */
export type RealtimeMode = 'polling' | 'manual' | 'websocket' | 'sse';

/**
 * Connection status for real-time updates
 */
export type PollingStatus = 'connected' | 'reconnecting' | 'error';

// ============================================================================
// Transport Abstraction Types (for future WebSocket/SSE support)
// ============================================================================

/**
 * Event types that can be received from real-time transport
 */
export type TransportEventType =
  | 'message_created'
  | 'message_updated'
  | 'message_deleted'
  | 'message_read'
  | 'typing_started'
  | 'typing_stopped';

/**
 * Event payload from real-time transport
 */
export interface TransportEvent {
  type: TransportEventType;
  payload: ChatMessageDB | { message_id: string; user_id: string };
  timestamp: string;
}

/**
 * Callback for handling transport events
 */
export type TransportEventHandler = (event: TransportEvent) => void;

/**
 * Abstract transport interface for real-time communication
 *
 * Implement this interface to add new transport types (WebSocket, SSE, etc.)
 *
 * @example
 * ```typescript
 * class WebSocketTransport implements RealtimeTransport {
 *   private ws: WebSocket | null = null;
 *
 *   async connect(url: string, options: TransportOptions): Promise<void> {
 *     this.ws = new WebSocket(url);
 *     // ... setup handlers
 *   }
 *
 *   async disconnect(): Promise<void> {
 *     this.ws?.close();
 *   }
 *
 *   // ... other methods
 * }
 * ```
 */
export interface RealtimeTransport {
  /** Connect to the real-time service */
  connect(url: string, options: TransportOptions): Promise<void>;

  /** Disconnect from the real-time service */
  disconnect(): Promise<void>;

  /** Check if currently connected */
  isConnected(): boolean;

  /** Get current connection status */
  getStatus(): PollingStatus;

  /** Subscribe to events for a specific chat group */
  subscribe(
    chat_group_id: string,
    reference_id?: string,
    handler?: TransportEventHandler
  ): void;

  /** Unsubscribe from events */
  unsubscribe(): void;

  /** Register a handler for status changes */
  onStatusChange(handler: (status: PollingStatus) => void): void;

  /** Register a handler for new messages */
  onMessage(handler: (messages: ChatMessageDB[]) => void): void;
}

/**
 * Options for configuring a transport
 */
export interface TransportOptions {
  /** Authentication token or credentials */
  auth_token?: string;

  /** Reconnection settings */
  reconnect?: {
    enabled: boolean;
    max_attempts: number;
    base_delay: number;
  };

  /** Heartbeat/ping interval in ms */
  heartbeat_interval?: number;
}

// ============================================================================
// Hook Return Types
// ============================================================================

/**
 * Return type for useChatMessages hook
 */
export interface UseChatMessagesReturn {
  messages: ChatMessage[];
  is_loading: boolean;
  is_loading_more: boolean;
  has_more: boolean;
  error: string | null;
  polling_status: PollingStatus;
  load_more: () => void;
  send_message: (payload: CreateMessagePayload) => Promise<boolean>;
  delete_message: (message_id: string) => Promise<boolean>;
  mark_as_read: (message_id: string) => Promise<void>;
  refresh: () => void;
}

/**
 * Return type for useChatReferences hook
 */
export interface UseChatReferencesReturn {
  references: ChatReferenceItem[];
  selected_reference: ChatReferenceItem | null;
  select_reference: (reference: ChatReferenceItem) => void;
  clear_selection: () => void;
  add_reference: (reference: ChatReferenceItem) => void;
  get_message_for_reference: (reference_id: string) => string | null;
}

/**
 * Return type for useFileUpload hook
 */
export interface UseFileUploadReturn {
  pending_attachments: PendingAttachment[];
  add_files: (files: File[]) => void;
  remove_file: (attachment_id: string) => void;
  upload_all: () => Promise<UploadedFile[]>;
  clear_all: () => void;
  is_uploading: boolean;
  validation_errors: string[];
}

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Chat configuration from hazo_chat_config.ini
 */
export interface ChatConfig {
  polling_interval: number;
  messages_per_page: number;
}

/**
 * Upload configuration from hazo_chat_config.ini
 */
export interface UploadConfig {
  max_file_size_mb: number;
  allowed_types: string[];
}

/**
 * Full configuration object
 */
export interface HazoChatConfig {
  chat: ChatConfig;
  uploads: UploadConfig;
}

// ============================================================================
// API Response Types (for consumers building API routes)
// ============================================================================

/**
 * Pagination metadata returned in list responses
 */
export interface PaginationInfo {
  limit: number;
  has_more: boolean;
  next_cursor: string | null;
  prev_cursor: string | null;
}

/**
 * Response from GET /api/hazo_chat/messages
 */
export interface MessagesApiResponse {
  success: boolean;
  messages?: ChatMessageDB[];
  current_user_id?: string;
  error?: string;
  pagination?: PaginationInfo;
}

/**
 * Response from POST /api/hazo_chat/messages
 */
export interface SendMessageApiResponse {
  success: boolean;
  message?: ChatMessageDB;
  error?: string;
}

/**
 * Response from DELETE /api/hazo_chat/messages/[id]
 */
export interface DeleteMessageApiResponse {
  success: boolean;
  message?: ChatMessageDB;
  error?: string;
}

/**
 * Response from PATCH /api/hazo_chat/messages/[id]/read
 */
export interface MarkAsReadApiResponse {
  success: boolean;
  message?: ChatMessageDB;
  error?: string;
}

/**
 * Response from /api/hazo_auth/profiles
 */
export interface ProfilesApiResponse {
  success: boolean;
  profiles?: HazoUserProfile[];
  error?: string;
}
