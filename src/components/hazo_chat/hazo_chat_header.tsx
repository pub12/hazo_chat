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

import React from 'react';
import { IoClose, IoMenuOutline } from 'react-icons/io5';
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
  on_toggle_sidebar,
  is_sidebar_open,
  className
}: HazoChatHeaderProps) {
  return (
    <header
      className={cn(
        'cls_hazo_chat_header',
        'flex items-center justify-between',
        'px-4 py-3 border-b bg-background/95 backdrop-blur-sm',
        className
      )}
    >
      {/* Left: Sidebar toggle + Title */}
      <div className="cls_header_left flex items-center gap-3">
        {/* Sidebar toggle (mobile) */}
        {on_toggle_sidebar && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={on_toggle_sidebar}
                className="cls_sidebar_toggle md:hidden"
                aria-label={is_sidebar_open ? 'Close sidebar' : 'Open sidebar'}
                aria-expanded={is_sidebar_open}
              >
                <IoMenuOutline className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {is_sidebar_open ? 'Close sidebar' : 'Open sidebar'}
            </TooltipContent>
          </Tooltip>
        )}

        {/* Title and subtitle */}
        <div className="cls_header_titles flex flex-col">
          {title && (
            <h2 className="cls_header_title text-base font-semibold text-foreground leading-tight">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="cls_header_subtitle text-xs text-muted-foreground leading-tight">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right: Close button */}
      {on_close && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={on_close}
              className="cls_header_close text-muted-foreground hover:text-foreground"
              aria-label="Close chat"
            >
              <IoClose className="w-5 h-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Close chat</TooltipContent>
        </Tooltip>
      )}
    </header>
  );
}

HazoChatHeader.displayName = 'HazoChatHeader';
