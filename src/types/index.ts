/**
 * Type definitions for the hazo_chat package
 * 
 * Contains all TypeScript interfaces and types used across the package
 * for props, messages, references, user profiles, and configuration.
 */

import type { ReactNode } from 'react';

// ============================================================================
// External Service Types (Peer Dependencies)
// ============================================================================

/**
 * Interface for hazo_connect database instance
 * Provides methods for database operations via Supabase/PostgREST
 */
export interface HazoConnectInstance {
  from: (table: string) => HazoConnectQueryBuilder;
}

/**
 * Query builder interface for hazo_connect
 */
export interface HazoConnectQueryBuilder {
  select: (columns?: string) => HazoConnectQueryBuilder;
  insert: (data: Record<string, unknown> | Record<string, unknown>[]) => HazoConnectQueryBuilder;
  update: (data: Record<string, unknown>) => HazoConnectQueryBuilder;
  delete: () => HazoConnectQueryBuilder;
  eq: (column: string, value: unknown) => HazoConnectQueryBuilder;
  neq: (column: string, value: unknown) => HazoConnectQueryBuilder;
  gt: (column: string, value: unknown) => HazoConnectQueryBuilder;
  gte: (column: string, value: unknown) => HazoConnectQueryBuilder;
  lt: (column: string, value: unknown) => HazoConnectQueryBuilder;
  lte: (column: string, value: unknown) => HazoConnectQueryBuilder;
  or: (filters: string) => HazoConnectQueryBuilder;
  order: (column: string, options?: { ascending?: boolean }) => HazoConnectQueryBuilder;
  range: (from: number, to: number) => HazoConnectQueryBuilder;
  single: () => Promise<HazoConnectResponse<unknown>>;
  then: <T>(resolve: (response: HazoConnectResponse<T>) => void) => Promise<void>;
}

/**
 * Response interface for hazo_connect queries
 */
export interface HazoConnectResponse<T> {
  data: T | null;
  error: HazoConnectError | null;
  count?: number;
}

/**
 * Error interface for hazo_connect
 */
export interface HazoConnectError {
  message: string;
  code?: string;
  details?: string;
}

/**
 * Interface for hazo_auth authentication service
 */
export interface HazoAuthInstance {
  hazo_get_auth: () => Promise<HazoAuthUser | null>;
  hazo_get_user_profiles: (user_ids: string[]) => Promise<HazoUserProfile[]>;
}

/**
 * Authenticated user from hazo_auth
 */
export interface HazoAuthUser {
  id: string;
  email?: string;
}

/**
 * User profile from hazo_auth
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
  receiver_user_id: string;
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
  receiver_profile?: HazoUserProfile;
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
  receiver_user_id: string;
  message_text: string;
  reference_list?: ChatReferenceItem[];
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
 */
export interface HazoChatProps {
  /** hazo_connect database instance (required) */
  hazo_connect: HazoConnectInstance;
  /** hazo_auth authentication service (required) */
  hazo_auth: HazoAuthInstance;
  /** UUID of the chat recipient (required) */
  receiver_user_id: string;
  /** Path/bucket for uploaded documents (required) */
  document_save_location: string;
  /** Main field reference ID (optional) */
  reference_id?: string;
  /** Reference type for the main reference */
  reference_type?: string;
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
  on_toggle_sidebar?: () => void;
  is_sidebar_open?: boolean;
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
  on_scroll_to_message?: (message_id: string) => void;
  highlighted_message_id?: string;
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
export interface HazoChatContextValue extends HazoChatContextState, HazoChatContextActions {}

/**
 * Polling connection status
 */
export type PollingStatus = 'connected' | 'reconnecting' | 'error';

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
