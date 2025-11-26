/**
 * HazoChatReferenceList Component
 * 
 * Displays a list of document/field/URL references as text chips with:
 * - File name display
 * - Selection state (highlighted background)
 * - Click to open in viewer + scroll to message
 * 
 * Uses shadcn/ui Button and Tooltip components.
 */

'use client';

import React, { useCallback } from 'react';
import { cn } from '../../lib/utils.js';
import type { HazoChatReferenceListProps, ChatReferenceItem } from '../../types/index.js';
import { Button } from '../ui/button.js';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '../ui/tooltip.js';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get file extension from URL or name
 */
function get_file_extension(reference: ChatReferenceItem): string {
  const name = reference.name || reference.url;
  const parts = name.split('.');
  return parts.length > 1 ? parts.pop()?.toUpperCase() || '' : '';
}

/**
 * Get display name (truncated if needed)
 */
function get_display_name(reference: ChatReferenceItem, max_length: number = 20): string {
  const name = reference.name || 'Untitled';
  if (name.length <= max_length) return name;
  
  const ext = get_file_extension(reference);
  const name_without_ext = ext ? name.slice(0, -(ext.length + 1)) : name;
  const truncated = name_without_ext.slice(0, max_length - 3 - (ext ? ext.length + 1 : 0));
  
  return ext ? `${truncated}...${ext.toLowerCase()}` : `${truncated}...`;
}

// ============================================================================
// Reference Item Component
// ============================================================================

interface ReferenceItemProps {
  reference: ChatReferenceItem;
  is_selected: boolean;
  on_click: () => void;
}

function ReferenceItem({ reference, is_selected, on_click }: ReferenceItemProps) {
  const display_name = get_display_name(reference);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={is_selected ? 'default' : 'outline'}
          size="sm"
          onClick={on_click}
          className={cn(
            'cls_reference_item',
            'h-7 px-2.5 text-xs font-medium',
            'rounded-full',
            is_selected 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-background hover:bg-accent'
          )}
          aria-label={`${reference.type}: ${reference.name}`}
          aria-pressed={is_selected}
        >
          {display_name}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        <p className="font-medium">{reference.name}</p>
        <p className="text-muted-foreground">
          {reference.type === 'document' ? 'Document' : reference.type === 'field' ? 'Field' : 'Link'}
          {' • '}
          {reference.scope === 'chat' ? 'Chat attachment' : 'Form reference'}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function HazoChatReferenceList({
  references,
  selected_reference_id,
  on_select,
  className
}: HazoChatReferenceListProps) {
  const handle_select = useCallback(
    (reference: ChatReferenceItem) => {
      on_select(reference);
    },
    [on_select]
  );

  if (references.length === 0) {
    return (
      <div
        className={cn(
          'cls_reference_list_empty',
          'flex items-center justify-center py-1 px-2',
          'text-xs text-muted-foreground italic',
          className
        )}
      >
        No references
      </div>
    );
  }

  return (
    <div
      className={cn(
        'cls_hazo_chat_reference_list',
        'flex flex-wrap items-center gap-1.5',
        className
      )}
      role="listbox"
      aria-label="Document references"
    >
      {references.map((reference) => (
        <ReferenceItem
          key={reference.id}
          reference={reference}
          is_selected={selected_reference_id === reference.id}
          on_click={() => handle_select(reference)}
        />
      ))}
    </div>
  );
}

HazoChatReferenceList.displayName = 'HazoChatReferenceList';
