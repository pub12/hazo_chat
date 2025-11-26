/**
 * HazoChatMessages Component
 *
 * Scrollable message list with:
 * - Infinite scroll for older messages
 * - Auto-scroll to new messages
 * - Scroll to highlighted message
 * - Empty and loading states
 *
 * Uses shadcn/ui ScrollArea component.
 */
'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HazoChatMessages = HazoChatMessages;
var react_1 = require("react");
var utils_js_1 = require("../../lib/utils.js");
var chat_bubble_js_1 = require("../ui/chat_bubble.js");
var loading_skeleton_js_1 = require("../ui/loading_skeleton.js");
var scroll_area_js_1 = require("../ui/scroll-area.js");
var constants_js_1 = require("../../lib/constants.js");
// ============================================================================
// Component
// ============================================================================
function HazoChatMessages(_a) {
    var messages = _a.messages, current_user_id = _a.current_user_id, timezone = _a.timezone, is_loading = _a.is_loading, has_more = _a.has_more, on_load_more = _a.on_load_more, on_delete_message = _a.on_delete_message, on_scroll_to_message = _a.on_scroll_to_message, highlighted_message_id = _a.highlighted_message_id, className = _a.className;
    var container_ref = (0, react_1.useRef)(null);
    var load_more_trigger_ref = (0, react_1.useRef)(null);
    var is_at_bottom_ref = (0, react_1.useRef)(true);
    var previous_messages_length_ref = (0, react_1.useRef)(0);
    // -------------------------------------------------------------------------
    // Intersection observer for infinite scroll
    // -------------------------------------------------------------------------
    (0, react_1.useEffect)(function () {
        var trigger = load_more_trigger_ref.current;
        if (!trigger || !has_more)
            return;
        var observer = new IntersectionObserver(function (entries) {
            if (entries[0].isIntersecting) {
                on_load_more();
            }
        }, { threshold: 0.1 });
        observer.observe(trigger);
        return function () {
            observer.disconnect();
        };
    }, [has_more, on_load_more]);
    // -------------------------------------------------------------------------
    // Track scroll position
    // -------------------------------------------------------------------------
    var handle_scroll = (0, react_1.useCallback)(function () {
        var container = container_ref.current;
        if (!container)
            return;
        // Check if scrolled to bottom
        var threshold = 50;
        is_at_bottom_ref.current =
            container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
    }, []);
    // -------------------------------------------------------------------------
    // Auto-scroll to bottom on new messages (if already at bottom)
    // -------------------------------------------------------------------------
    (0, react_1.useEffect)(function () {
        var container = container_ref.current;
        if (!container)
            return;
        // Only auto-scroll if we were at the bottom and new messages arrived
        if (is_at_bottom_ref.current && messages.length > previous_messages_length_ref.current) {
            container.scrollTop = container.scrollHeight;
        }
        previous_messages_length_ref.current = messages.length;
    }, [messages.length]);
    // -------------------------------------------------------------------------
    // Scroll to highlighted message
    // -------------------------------------------------------------------------
    (0, react_1.useEffect)(function () {
        if (!highlighted_message_id)
            return;
        var element = document.getElementById("message-".concat(highlighted_message_id));
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [highlighted_message_id]);
    // -------------------------------------------------------------------------
    // Handle reference click in message
    // -------------------------------------------------------------------------
    var handle_reference_click = (0, react_1.useCallback)(function (reference) {
        // This would be handled by parent via context
        console.log('[HazoChatMessages] Reference clicked:', reference);
    }, []);
    // -------------------------------------------------------------------------
    // Loading state
    // -------------------------------------------------------------------------
    if (is_loading && messages.length === 0) {
        return (<div className={(0, utils_js_1.cn)('cls_messages_loading p-4', className)}>
        <loading_skeleton_js_1.LoadingSkeleton variant="message" count={5}/>
      </div>);
    }
    // -------------------------------------------------------------------------
    // Empty state
    // -------------------------------------------------------------------------
    if (!is_loading && messages.length === 0) {
        return (<div className={(0, utils_js_1.cn)('cls_messages_empty', 'flex items-center justify-center h-full', 'text-muted-foreground text-sm', className)}>
        {constants_js_1.EMPTY_CHAT_MESSAGE}
      </div>);
    }
    // -------------------------------------------------------------------------
    // Messages list
    // -------------------------------------------------------------------------
    return (<scroll_area_js_1.ScrollArea className={(0, utils_js_1.cn)('cls_hazo_chat_messages flex-1', className)}>
      <div ref={container_ref} onScroll={handle_scroll} className={(0, utils_js_1.cn)('cls_messages_container', 'p-4', 'flex flex-col-reverse' // Reverse order for bottom-up display
        )} role="log" aria-label="Chat messages" aria-live="polite">
        {/* Messages (in reverse chronological order) */}
        {messages.map(function (message) { return (<chat_bubble_js_1.ChatBubble key={message.id} message={message} is_sender={message.sender_user_id === current_user_id} sender_profile={message.sender_profile} timezone={timezone} on_delete={message.sender_user_id === current_user_id
                ? function () { return on_delete_message(message.id); }
                : undefined} on_reference_click={handle_reference_click} is_highlighted={highlighted_message_id === message.id}/>); })}

        {/* Load more trigger */}
        {has_more && (<div ref={load_more_trigger_ref} className="cls_load_more_trigger py-4">
            <loading_skeleton_js_1.LoadingSkeleton variant="message" count={2}/>
          </div>)}
      </div>
    </scroll_area_js_1.ScrollArea>);
}
HazoChatMessages.displayName = 'HazoChatMessages';
