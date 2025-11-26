/**
 * useChatReferences Hook
 * 
 * Manages chat references with:
 * - Aggregating references from messages and props
 * - Selection state management
 * - Finding source message for a reference
 */

'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import type {
  ChatReferenceItem,
  ChatMessage,
  ReferenceItem,
  UseChatReferencesReturn
} from '../types/index.js';

// ============================================================================
// Hook Parameters
// ============================================================================

interface UseChatReferencesParams {
  messages: ChatMessage[];
  initial_references?: ReferenceItem[];
  on_selection_change?: (reference: ChatReferenceItem | null) => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useChatReferences({
  messages,
  initial_references = [],
  on_selection_change
}: UseChatReferencesParams): UseChatReferencesReturn {
  // -------------------------------------------------------------------------
  // State
  // -------------------------------------------------------------------------
  const [selected_reference, set_selected_reference_state] = useState<ChatReferenceItem | null>(null);

  // -------------------------------------------------------------------------
  // Aggregate all references
  // -------------------------------------------------------------------------
  const references = useMemo<ChatReferenceItem[]>(() => {
    const reference_map = new Map<string, ChatReferenceItem>();

    // Add initial references (from props)
    initial_references.forEach((ref) => {
      const chat_ref: ChatReferenceItem = {
        ...ref,
        scope: ref.scope || 'field'
      };
      reference_map.set(ref.id, chat_ref);
    });

    // Add references from messages
    messages.forEach((message) => {
      if (message.reference_list && Array.isArray(message.reference_list)) {
        message.reference_list.forEach((ref) => {
          // Update scope to 'chat' and add message_id
          const existing = reference_map.get(ref.id);
          if (existing) {
            // If reference already exists, it's now in both chat and field
            reference_map.set(ref.id, {
              ...existing,
              message_id: message.id
            });
          } else {
            reference_map.set(ref.id, {
              ...ref,
              scope: 'chat',
              message_id: message.id
            });
          }
        });
      }
    });

    return Array.from(reference_map.values());
  }, [messages, initial_references]);

  // -------------------------------------------------------------------------
  // Message lookup for references
  // -------------------------------------------------------------------------
  const reference_to_message_map = useMemo<Map<string, string>>(() => {
    const map = new Map<string, string>();

    messages.forEach((message) => {
      if (message.reference_list && Array.isArray(message.reference_list)) {
        message.reference_list.forEach((ref) => {
          // Store the first message that contains this reference
          if (!map.has(ref.id)) {
            map.set(ref.id, message.id);
          }
        });
      }
    });

    return map;
  }, [messages]);

  // -------------------------------------------------------------------------
  // Select reference
  // -------------------------------------------------------------------------
  const select_reference = useCallback(
    (reference: ChatReferenceItem) => {
      // If same reference, toggle off
      if (selected_reference?.id === reference.id) {
        set_selected_reference_state(null);
        on_selection_change?.(null);
        return;
      }

      // Ensure message_id is set if available
      const ref_with_message = {
        ...reference,
        message_id: reference.message_id || reference_to_message_map.get(reference.id)
      };

      set_selected_reference_state(ref_with_message);
      on_selection_change?.(ref_with_message);
    },
    [selected_reference, reference_to_message_map, on_selection_change]
  );

  // -------------------------------------------------------------------------
  // Clear selection
  // -------------------------------------------------------------------------
  const clear_selection = useCallback(() => {
    set_selected_reference_state(null);
    on_selection_change?.(null);
  }, [on_selection_change]);

  // -------------------------------------------------------------------------
  // Add new reference
  // -------------------------------------------------------------------------
  const add_reference = useCallback(
    (reference: ChatReferenceItem) => {
      // This is typically handled by the context or parent component
      // Here we just select the newly added reference
      select_reference(reference);
    },
    [select_reference]
  );

  // -------------------------------------------------------------------------
  // Get message ID for reference
  // -------------------------------------------------------------------------
  const get_message_for_reference = useCallback(
    (reference_id: string): string | null => {
      return reference_to_message_map.get(reference_id) || null;
    },
    [reference_to_message_map]
  );

  // -------------------------------------------------------------------------
  // Clear selection if selected reference is removed
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (selected_reference && !references.some((r) => r.id === selected_reference.id)) {
      set_selected_reference_state(null);
    }
  }, [references, selected_reference]);

  // -------------------------------------------------------------------------
  // Return
  // -------------------------------------------------------------------------
  return {
    references,
    selected_reference,
    select_reference,
    clear_selection,
    add_reference,
    get_message_for_reference
  };
}

