/**
 * HazoChatReferenceList Component
 * 
 * Displays icons for document/field/URL references with:
 * - Type-specific icons
 * - Scope badges (chat-only vs field)
 * - Selection state (blue outline)
 * - Click to open in viewer + scroll to message
 * 
 * Uses shadcn/ui Button, Badge, and Tooltip components.
 */

'use client';

import React, { useCallback } from 'react';
import {
  IoDocumentAttachSharp,
  IoLinkSharp
} from 'react-icons/io5';
import { LuTextCursorInput } from 'react-icons/lu';
import { CiChat1 } from 'react-icons/ci';
import { cn } from '../../lib/utils.js';
import type { HazoChatReferenceListProps, ChatReferenceItem, ReferenceType } from '../../types/index.js';
import { Button } from '../ui/button.js';
import { Badge } from '../ui/badge.js';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '../ui/tooltip.js';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get icon for reference type
 */
function get_reference_icon(type: ReferenceType) {
  switch (type) {
    case 'document':
      return IoDocumentAttachSharp;
    case 'field':
      return LuTextCursorInput;
    case 'url':
      return IoLinkSharp;
    default:
      return IoDocumentAttachSharp;
  }
}

/**
 * Get scope badge icon
 */
function get_scope_icon(scope: 'chat' | 'field') {
  return scope === 'chat' ? CiChat1 : LuTextCursorInput;
}

/**
 * Get file extension from URL or name
 */
function get_file_extension(reference: ChatReferenceItem): string {
  const name = reference.name || reference.url;
  const parts = name.split('.');
  return parts.length > 1 ? parts.pop()?.toUpperCase() || '' : '';
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
  const TypeIcon = get_reference_icon(reference.type);
  const ScopeIcon = get_scope_icon(reference.scope);
  const extension = get_file_extension(reference);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={is_selected ? 'outline' : 'ghost'}
          onClick={on_click}
          className={cn(
            'cls_reference_item',
            'relative flex flex-col items-center justify-center',
            'w-12 h-12 p-0',
            is_selected && 'ring-2 ring-primary bg-primary/5'
          )}
          aria-label={`${reference.type}: ${reference.name}`}
          aria-pressed={is_selected}
        >
          {/* Main icon */}
          <TypeIcon className="w-5 h-5 text-foreground" />

          {/* Extension label */}
          {extension && (
            <span className="text-[8px] font-medium text-muted-foreground mt-0.5 uppercase">
              {extension.substring(0, 4)}
            </span>
          )}

          {/* Scope badge */}
          <Badge
            variant={reference.scope === 'chat' ? 'secondary' : 'success'}
            className={cn(
              'cls_reference_scope_badge',
              'absolute -top-1 -right-1',
              'w-4 h-4 p-0 rounded-full',
              'flex items-center justify-center'
            )}
          >
            <ScopeIcon className="w-2.5 h-2.5" />
          </Badge>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p className="font-medium">{reference.name}</p>
        <p className="text-xs text-muted-foreground">
          {reference.scope === 'chat' ? 'In chat only' : 'In form fields'}
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
          'flex items-center justify-center p-4',
          'text-sm text-muted-foreground',
          className
        )}
      >
        No references yet
      </div>
    );
  }

  return (
    <div
      className={cn(
        'cls_hazo_chat_reference_list',
        'flex flex-wrap gap-1 p-2',
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
