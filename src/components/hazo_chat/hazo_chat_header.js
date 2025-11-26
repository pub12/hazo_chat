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
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HazoChatHeader = HazoChatHeader;
var react_1 = require("react");
var io5_1 = require("react-icons/io5");
var utils_js_1 = require("../../lib/utils.js");
var button_js_1 = require("../ui/button.js");
var tooltip_js_1 = require("../ui/tooltip.js");
// ============================================================================
// Component
// ============================================================================
function HazoChatHeader(_a) {
    var title = _a.title, subtitle = _a.subtitle, on_close = _a.on_close, on_toggle_sidebar = _a.on_toggle_sidebar, is_sidebar_open = _a.is_sidebar_open, className = _a.className;
    return (<header className={(0, utils_js_1.cn)('cls_hazo_chat_header', 'flex items-center justify-between', 'px-4 py-3 border-b bg-background/95 backdrop-blur-sm', className)}>
      {/* Left: Sidebar toggle + Title */}
      <div className="cls_header_left flex items-center gap-3">
        {/* Sidebar toggle (mobile) */}
        {on_toggle_sidebar && (<tooltip_js_1.Tooltip>
            <tooltip_js_1.TooltipTrigger asChild>
              <button_js_1.Button variant="ghost" size="icon" onClick={on_toggle_sidebar} className="cls_sidebar_toggle md:hidden" aria-label={is_sidebar_open ? 'Close sidebar' : 'Open sidebar'} aria-expanded={is_sidebar_open}>
                <io5_1.IoMenuOutline className="w-5 h-5"/>
              </button_js_1.Button>
            </tooltip_js_1.TooltipTrigger>
            <tooltip_js_1.TooltipContent>
              {is_sidebar_open ? 'Close sidebar' : 'Open sidebar'}
            </tooltip_js_1.TooltipContent>
          </tooltip_js_1.Tooltip>)}

        {/* Title and subtitle */}
        <div className="cls_header_titles flex flex-col">
          {title && (<h2 className="cls_header_title text-base font-semibold text-foreground leading-tight">
              {title}
            </h2>)}
          {subtitle && (<p className="cls_header_subtitle text-xs text-muted-foreground leading-tight">
              {subtitle}
            </p>)}
        </div>
      </div>

      {/* Right: Close button */}
      {on_close && (<tooltip_js_1.Tooltip>
          <tooltip_js_1.TooltipTrigger asChild>
            <button_js_1.Button variant="ghost" size="icon" onClick={on_close} className="cls_header_close text-muted-foreground hover:text-foreground" aria-label="Close chat">
              <io5_1.IoClose className="w-5 h-5"/>
            </button_js_1.Button>
          </tooltip_js_1.TooltipTrigger>
          <tooltip_js_1.TooltipContent>Close chat</tooltip_js_1.TooltipContent>
        </tooltip_js_1.Tooltip>)}
    </header>);
}
HazoChatHeader.displayName = 'HazoChatHeader';
