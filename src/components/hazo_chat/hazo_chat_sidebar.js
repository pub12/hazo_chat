/**
 * HazoChatSidebar Component
 *
 * Collapsible sidebar containing:
 * - Reference list
 * - Document viewer
 *
 * On mobile: slides in from left as overlay
 * On desktop: always visible as left column
 *
 * Uses shadcn/ui Button, ScrollArea, and Separator components.
 */
'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HazoChatSidebar = HazoChatSidebar;
var react_1 = require("react");
var io5_1 = require("react-icons/io5");
var utils_js_1 = require("../../lib/utils.js");
var constants_js_1 = require("../../lib/constants.js");
var button_js_1 = require("../ui/button.js");
var scroll_area_js_1 = require("../ui/scroll-area.js");
var separator_js_1 = require("../ui/separator.js");
// ============================================================================
// Component
// ============================================================================
function HazoChatSidebar(_a) {
    var is_open = _a.is_open, on_close = _a.on_close, className = _a.className, children = _a.children;
    // Handle escape key to close sidebar
    var handle_escape = (0, react_1.useCallback)(function (event) {
        if (event.key === 'Escape' && is_open) {
            on_close();
        }
    }, [is_open, on_close]);
    // Handle click outside to close (mobile)
    var handle_backdrop_click = (0, react_1.useCallback)(function () {
        on_close();
    }, [on_close]);
    // Add escape key listener
    (0, react_1.useEffect)(function () {
        document.addEventListener('keydown', handle_escape);
        return function () {
            document.removeEventListener('keydown', handle_escape);
        };
    }, [handle_escape]);
    // Prevent body scroll when sidebar is open on mobile
    (0, react_1.useEffect)(function () {
        if (typeof window === 'undefined')
            return;
        var is_mobile = window.innerWidth < constants_js_1.MOBILE_BREAKPOINT;
        if (is_open && is_mobile) {
            document.body.style.overflow = 'hidden';
        }
        else {
            document.body.style.overflow = '';
        }
        return function () {
            document.body.style.overflow = '';
        };
    }, [is_open]);
    return (<>
      {/* Backdrop (mobile only) */}
      <div className={(0, utils_js_1.cn)('cls_sidebar_backdrop', 'fixed inset-0 bg-black/50 z-40', 'md:hidden', // Only on mobile
        'transition-opacity duration-200', is_open ? 'opacity-100' : 'opacity-0 pointer-events-none')} onClick={handle_backdrop_click} aria-hidden="true"/>

      {/* Sidebar panel */}
      <aside className={(0, utils_js_1.cn)('cls_hazo_chat_sidebar', 
        // Mobile: fixed overlay
        'fixed md:relative', 'top-0 left-0 h-full z-50', 
        // Sizing
        'w-[280px] md:w-full', 
        // Background
        'bg-background border-r', 
        // Transition
        'transition-transform duration-200 ease-in-out', 
        // Mobile: slide in/out
        is_open ? 'translate-x-0' : '-translate-x-full md:translate-x-0', className)} aria-label="Chat sidebar" aria-hidden={!is_open}>
        {/* Mobile close button */}
        <div className="cls_sidebar_header flex items-center justify-between p-3 md:hidden">
          <span className="text-sm font-medium">Documents & References</span>
          <button_js_1.Button variant="ghost" size="icon" onClick={on_close} className="h-8 w-8" aria-label="Close sidebar">
            <io5_1.IoClose className="w-4 h-4"/>
          </button_js_1.Button>
        </div>

        <separator_js_1.Separator className="md:hidden"/>

        {/* Sidebar content */}
        <scroll_area_js_1.ScrollArea className="cls_sidebar_content h-full flex flex-col">
          {children}
        </scroll_area_js_1.ScrollArea>
      </aside>
    </>);
}
HazoChatSidebar.displayName = 'HazoChatSidebar';
