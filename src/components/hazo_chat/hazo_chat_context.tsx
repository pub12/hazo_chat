/**
 * HazoChatContext - React context for shared state management
 * 
 * Provides centralized state management for:
 * - Selected reference/document
 * - Current user profile (fetched via API)
 * - Pending file attachments
 * - Sidebar collapsed state (mobile)
 * - Polling connection status
 * - Error handling
 * 
 * Uses API calls to fetch user data - no server-side dependencies.
 */

'use client';

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode
} from 'react';
import type { ClientLogger } from 'hazo_logs/ui';
import type {
  HazoChatContextValue,
  HazoChatContextState,
  ChatReferenceItem,
  PendingAttachment,
  HazoUserProfile,
  PollingStatus
} from '../../types/index.js';

// ============================================================================
// Action Types
// ============================================================================

type HazoChatAction =
  | { type: 'SET_CURRENT_USER'; payload: HazoUserProfile | null }
  | { type: 'SET_SELECTED_REFERENCE'; payload: ChatReferenceItem | null }
  | { type: 'SET_HIGHLIGHTED_MESSAGE_ID'; payload: string | null }
  | { type: 'ADD_PENDING_ATTACHMENT'; payload: PendingAttachment }
  | { type: 'REMOVE_PENDING_ATTACHMENT'; payload: string }
  | { type: 'UPDATE_PENDING_ATTACHMENT'; payload: { id: string; updates: Partial<PendingAttachment> } }
  | { type: 'CLEAR_PENDING_ATTACHMENTS' }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_SIDEBAR_OPEN'; payload: boolean }
  | { type: 'SET_POLLING_STATUS'; payload: PollingStatus }
  | { type: 'ADD_REFERENCE'; payload: ChatReferenceItem }
  | { type: 'SET_ALL_REFERENCES'; payload: ChatReferenceItem[] }
  | { type: 'SET_ERROR_MESSAGE'; payload: string | null };

// ============================================================================
// Initial State
// ============================================================================

const initial_state: HazoChatContextState = {
  current_user: null,
  selected_reference: null,
  highlighted_message_id: null,
  pending_attachments: [],
  is_sidebar_open: false,
  polling_status: 'connected',
  all_references: [],
  error_message: null
};

// ============================================================================
// Reducer
// ============================================================================

function hazo_chat_reducer(
  state: HazoChatContextState,
  action: HazoChatAction
): HazoChatContextState {
  switch (action.type) {
    case 'SET_CURRENT_USER':
      return { ...state, current_user: action.payload };

    case 'SET_SELECTED_REFERENCE':
      return { ...state, selected_reference: action.payload };

    case 'SET_HIGHLIGHTED_MESSAGE_ID':
      return { ...state, highlighted_message_id: action.payload };

    case 'ADD_PENDING_ATTACHMENT':
      return {
        ...state,
        pending_attachments: [...state.pending_attachments, action.payload]
      };

    case 'REMOVE_PENDING_ATTACHMENT':
      return {
        ...state,
        pending_attachments: state.pending_attachments.filter(
          (attachment) => attachment.id !== action.payload
        )
      };

    case 'UPDATE_PENDING_ATTACHMENT':
      return {
        ...state,
        pending_attachments: state.pending_attachments.map((attachment) =>
          attachment.id === action.payload.id
            ? { ...attachment, ...action.payload.updates }
            : attachment
        )
      };

    case 'CLEAR_PENDING_ATTACHMENTS':
      // Revoke any object URLs to prevent memory leaks
      state.pending_attachments.forEach((attachment) => {
        if (attachment.preview_url) {
          URL.revokeObjectURL(attachment.preview_url);
        }
      });
      return { ...state, pending_attachments: [] };

    case 'TOGGLE_SIDEBAR':
      return { ...state, is_sidebar_open: !state.is_sidebar_open };

    case 'SET_SIDEBAR_OPEN':
      return { ...state, is_sidebar_open: action.payload };

    case 'SET_POLLING_STATUS':
      return { ...state, polling_status: action.payload };

    case 'ADD_REFERENCE':
      // Check if reference already exists
      if (state.all_references.some((ref) => ref.id === action.payload.id)) {
        return state;
      }
      return {
        ...state,
        all_references: [...state.all_references, action.payload]
      };

    case 'SET_ALL_REFERENCES':
      return { ...state, all_references: action.payload };

    case 'SET_ERROR_MESSAGE':
      return { ...state, error_message: action.payload };

    default:
      return state;
  }
}

// ============================================================================
// Context
// ============================================================================

const HazoChatContext = createContext<HazoChatContextValue | null>(null);

// ============================================================================
// Provider Props
// ============================================================================

interface HazoChatProviderProps {
  children: ReactNode;
  /** Logger instance for client-side logging */
  logger: ClientLogger;
  /** Base URL for API endpoints (default: '/api/hazo_chat') */
  api_base_url?: string;
  /** Initial references from props */
  initial_references?: ChatReferenceItem[];
}

// ============================================================================
// Provider Component
// ============================================================================

/**
 * HazoChatProvider - Context provider for HazoChat component tree
 *
 * Fetches current user via API on mount.
 *
 * @param children - Child components
 * @param logger - Logger instance for client-side logging
 * @param api_base_url - Base URL for API endpoints
 * @param initial_references - Initial references from props
 */
export function HazoChatProvider({
  children,
  logger,
  api_base_url = '/api/hazo_chat',
  initial_references = []
}: HazoChatProviderProps) {
  const [state, dispatch] = useReducer(hazo_chat_reducer, {
    ...initial_state,
    all_references: initial_references
  });

  // -------------------------------------------------------------------------
  // Load current user on mount via API
  // -------------------------------------------------------------------------
  useEffect(() => {
    async function load_current_user() {
      try {
        // Try to get current user from hazo_auth me endpoint
        const response = await fetch('/api/hazo_auth/me', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.authenticated) {
            // Handle two different response structures:
            // Structure 1 (with nested user object): { authenticated: true, user: { id, email_address, ... } }
            // Structure 2 (flat): { authenticated: true, user_id, email, name, ... }
            const user_data = data.user || data;
            const user_id = user_data.id || data.user_id || '';
            // Support both email_address (hazo_auth standard) and email (legacy)
            const email = user_data.email_address || user_data.email || data.email || '';
            const name = user_data.name || data.name || '';
            const profile_picture_url = user_data.profile_picture_url || data.profile_picture_url;
            
            if (user_id) {
              const user_profile: HazoUserProfile = {
                id: user_id,
                name: name || (email ? email.split('@')[0] : 'User'),
                email: email,
                avatar_url: profile_picture_url
              };
              
              dispatch({ type: 'SET_CURRENT_USER', payload: user_profile });
            }
          }
        }
      } catch (error) {
        logger.error('[HazoChatContext] Failed to load current user:', { error });
        dispatch({
          type: 'SET_ERROR_MESSAGE',
          payload: 'Failed to authenticate user'
        });
      }
    }

    load_current_user();
  }, [api_base_url, logger]);

  // -------------------------------------------------------------------------
  // Action creators
  // -------------------------------------------------------------------------

  const set_selected_reference = useCallback(
    (reference: ChatReferenceItem | null) => {
      dispatch({ type: 'SET_SELECTED_REFERENCE', payload: reference });
      // Also set highlighted message if reference has a message_id
      if (reference?.message_id) {
        dispatch({
          type: 'SET_HIGHLIGHTED_MESSAGE_ID',
          payload: reference.message_id
        });
      }
    },
    []
  );

  const set_highlighted_message_id = useCallback((message_id: string | null) => {
    dispatch({ type: 'SET_HIGHLIGHTED_MESSAGE_ID', payload: message_id });
  }, []);

  const add_pending_attachment = useCallback((file: File) => {
    const id = `attachment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create preview URL for images
    let preview_url: string | undefined;
    if (file.type.startsWith('image/')) {
      preview_url = URL.createObjectURL(file);
    }

    const attachment: PendingAttachment = {
      id,
      file,
      preview_url,
      upload_status: 'pending'
    };

    dispatch({ type: 'ADD_PENDING_ATTACHMENT', payload: attachment });
  }, []);

  const remove_pending_attachment = useCallback((attachment_id: string) => {
    // Find and revoke object URL before removing
    const attachment = state.pending_attachments.find(
      (a) => a.id === attachment_id
    );
    if (attachment?.preview_url) {
      URL.revokeObjectURL(attachment.preview_url);
    }
    dispatch({ type: 'REMOVE_PENDING_ATTACHMENT', payload: attachment_id });
  }, [state.pending_attachments]);

  const update_pending_attachment = useCallback(
    (attachment_id: string, updates: Partial<PendingAttachment>) => {
      dispatch({
        type: 'UPDATE_PENDING_ATTACHMENT',
        payload: { id: attachment_id, updates }
      });
    },
    []
  );

  const clear_pending_attachments = useCallback(() => {
    dispatch({ type: 'CLEAR_PENDING_ATTACHMENTS' });
  }, []);

  const toggle_sidebar = useCallback(() => {
    dispatch({ type: 'TOGGLE_SIDEBAR' });
  }, []);

  const set_sidebar_open = useCallback((is_open: boolean) => {
    dispatch({ type: 'SET_SIDEBAR_OPEN', payload: is_open });
  }, []);

  const set_error_message = useCallback((message: string | null) => {
    dispatch({ type: 'SET_ERROR_MESSAGE', payload: message });
  }, []);

  const add_reference = useCallback((reference: ChatReferenceItem) => {
    dispatch({ type: 'ADD_REFERENCE', payload: reference });
  }, []);

  // -------------------------------------------------------------------------
  // Memoized context value
  // -------------------------------------------------------------------------

  const context_value = useMemo<HazoChatContextValue>(
    () => ({
      // State
      current_user: state.current_user,
      selected_reference: state.selected_reference,
      highlighted_message_id: state.highlighted_message_id,
      pending_attachments: state.pending_attachments,
      is_sidebar_open: state.is_sidebar_open,
      polling_status: state.polling_status,
      all_references: state.all_references,
      error_message: state.error_message,
      // Logger
      logger,
      // Actions
      set_selected_reference,
      set_highlighted_message_id,
      add_pending_attachment,
      remove_pending_attachment,
      update_pending_attachment,
      clear_pending_attachments,
      toggle_sidebar,
      set_sidebar_open,
      set_error_message,
      add_reference
    }),
    [
      state,
      logger,
      set_selected_reference,
      set_highlighted_message_id,
      add_pending_attachment,
      remove_pending_attachment,
      update_pending_attachment,
      clear_pending_attachments,
      toggle_sidebar,
      set_sidebar_open,
      set_error_message,
      add_reference
    ]
  );

  return (
    <HazoChatContext.Provider value={context_value}>
      {children}
    </HazoChatContext.Provider>
  );
}

// ============================================================================
// Custom Hook
// ============================================================================

/**
 * useHazoChatContext - Hook to access HazoChat context
 * 
 * @throws Error if used outside of HazoChatProvider
 * @returns HazoChatContextValue
 */
export function useHazoChatContext(): HazoChatContextValue {
  const context = useContext(HazoChatContext);
  
  if (!context) {
    throw new Error(
      'useHazoChatContext must be used within a HazoChatProvider'
    );
  }
  
  return context;
}

// ============================================================================
// Export Context for testing
// ============================================================================

export { HazoChatContext };
