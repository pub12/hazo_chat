/**
 * HazoChatHeader Component
 * 
 * Header row for the chat window containing:
 * - Sidebar toggle button (hamburger menu)
 * - Title and subtitle
 * - Close button
 * 
 * Uses shadcn/ui Button and Tooltip components.
 */

'use client';

import React, { useCallback } from 'react';
import { IoClose, IoMenuOutline, IoRefresh } from 'react-icons/io5';
import { cn } from '../../lib/utils.js';
import type { HazoChatHeaderProps } from '../../types/index.js';
import { Button } from '../ui/button.js';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '../ui/tooltip.js';

// ============================================================================
// Component
// ============================================================================

export function HazoChatHeader({
  title,
  subtitle,
  on_close,
  on_refresh,
  is_refreshing,
  on_toggle_sidebar,
  is_sidebar_open,
  show_sidebar_toggle = false,
  className
}: HazoChatHeaderProps) {
  // Handle close button click - ensure event is properly handled
  const handle_close_click = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      // Prevent any default behavior and stop propagation
      e.preventDefault();
      e.stopPropagation();

      // Call the close handler if provided
      if (typeof on_close === 'function') {
        on_close();
      }
    },
    [on_close]
  );
  return (
    <header
      className={cn(
        'cls_hazo_chat_header',
        'flex items-center justify-between',
        'h-14 px-4',
        'border-b border-border/40',
        'bg-card/80 backdrop-blur-md',
        'shadow-sm',
        className
      )}
    >
      {/* Left: Sidebar toggle + Title */}
      <div className="cls_header_left flex items-center gap-3">
        {/* Sidebar toggle (mobile) */}
        {show_sidebar_toggle && on_toggle_sidebar && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={on_toggle_sidebar}
                className={cn(
                  'cls_sidebar_toggle md:hidden',
                  'h-8 w-8 rounded-md',
                  'hover:bg-accent hover:text-accent-foreground',
                  'transition-colors'
                )}
                aria-label={is_sidebar_open ? 'Close sidebar' : 'Open sidebar'}
                aria-expanded={is_sidebar_open}
              >
                <IoMenuOutline className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {is_sidebar_open ? 'Close sidebar' : 'Open sidebar'}
            </TooltipContent>
          </Tooltip>
        )}

        {/* Title and subtitle */}
        <div className="cls_header_titles flex flex-col gap-0.5">
          {title && (
            <h2 className="cls_header_title text-sm font-semibold tracking-tight text-foreground">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="cls_header_subtitle text-xs font-medium text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right: Refresh + Close buttons */}
      <div className="cls_header_right flex items-center gap-1">
        {/* Refresh button */}
        {on_refresh && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={on_refresh}
                disabled={is_refreshing}
                className={cn(
                  'cls_header_refresh',
                  'h-8 w-8 rounded-md',
                  'text-muted-foreground',
                  'hover:bg-accent hover:text-accent-foreground',
                  'transition-colors'
                )}
                aria-label="Refresh chat history"
              >
                <IoRefresh className={cn('h-4 w-4', is_refreshing && 'animate-spin')} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Refresh chat
            </TooltipContent>
          </Tooltip>
        )}

        {/* Close button - without Tooltip wrapper to ensure onClick works reliably */}
        {on_close && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handle_close_click}
            onMouseDown={(e) => {
              // Ensure the click is captured even if tooltip interferes
              e.stopPropagation();
            }}
            type="button"
            className={cn(
              'cls_header_close',
              'h-8 w-8 rounded-md',
              'text-muted-foreground',
              'hover:bg-destructive/10 hover:text-destructive',
              'transition-colors'
            )}
            aria-label="Close chat"
            title="Close chat"
          >
            <IoClose className="h-4 w-4" />
          </Button>
        )}
      </div>
    </header>
  );
}

HazoChatHeader.displayName = 'HazoChatHeader';
