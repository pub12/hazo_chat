/**
 * ChatBubble Component
 *
 * Renders a single chat message bubble with:
 * - Profile picture (using Avatar)
 * - Message text (or deleted placeholder)
 * - Timestamp with timezone formatting
 * - Read status indicator (using Badge)
 * - Delete option for sender's messages (using Button)
 * - Reference/attachment icons
 *
 * Uses shadcn/ui Avatar, Button, Badge, and Tooltip components.
 */
'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatBubble = ChatBubble;
var react_1 = require("react");
var date_fns_1 = require("date-fns");
var date_fns_tz_1 = require("date-fns-tz");
var io5_1 = require("react-icons/io5");
var utils_js_1 = require("../../lib/utils.js");
var constants_js_1 = require("../../lib/constants.js");
var avatar_js_1 = require("./avatar.js");
var button_js_1 = require("./button.js");
var badge_js_1 = require("./badge.js");
var tooltip_js_1 = require("./tooltip.js");
// ============================================================================
// Helper Functions
// ============================================================================
/**
 * Format timestamp with timezone
 */
function format_timestamp(timestamp, timezone) {
    try {
        var date = new Date(timestamp);
        var zoned_date = (0, date_fns_tz_1.toZonedTime)(date, timezone);
        return (0, date_fns_1.format)(zoned_date, 'HH:mm');
    }
    catch (_a) {
        return (0, date_fns_1.format)(new Date(timestamp), 'HH:mm');
    }
}
/**
 * Get initials from name
 */
function get_initials(name) {
    if (!name)
        return '?';
    return name
        .split(' ')
        .map(function (part) { return part[0]; })
        .join('')
        .substring(0, 2)
        .toUpperCase();
}
// ============================================================================
// Component
// ============================================================================
function ChatBubble(_a) {
    var _b;
    var message = _a.message, is_sender = _a.is_sender, sender_profile = _a.sender_profile, timezone = _a.timezone, on_delete = _a.on_delete, on_reference_click = _a.on_reference_click, _c = _a.is_highlighted, is_highlighted = _c === void 0 ? false : _c, className = _a.className;
    var _d = (0, react_1.useState)(false), show_delete_confirm = _d[0], set_show_delete_confirm = _d[1];
    var is_deleted = message.deleted_at !== null;
    var display_text = is_deleted ? constants_js_1.DELETED_MESSAGE_PLACEHOLDER : message.message_text;
    var has_references = message.reference_list && message.reference_list.length > 0;
    // Handle delete click
    var handle_delete_click = (0, react_1.useCallback)(function () {
        if (show_delete_confirm) {
            on_delete === null || on_delete === void 0 ? void 0 : on_delete();
            set_show_delete_confirm(false);
        }
        else {
            set_show_delete_confirm(true);
            // Auto-hide after 3 seconds
            setTimeout(function () { return set_show_delete_confirm(false); }, 3000);
        }
    }, [show_delete_confirm, on_delete]);
    // Handle reference click
    var handle_reference_click = (0, react_1.useCallback)(function (reference) {
        on_reference_click === null || on_reference_click === void 0 ? void 0 : on_reference_click(reference);
    }, [on_reference_click]);
    // Render status icon
    var render_status_icon = function () {
        if (!is_sender)
            return null;
        if (message.send_status === 'sending') {
            return (<badge_js_1.Badge variant="secondary" className="cls_message_status px-1 py-0 h-4 animate-pulse">
          <io5_1.IoCheckmarkOutline className="w-3 h-3"/>
        </badge_js_1.Badge>);
        }
        if (message.send_status === 'failed') {
            return (<tooltip_js_1.Tooltip>
          <tooltip_js_1.TooltipTrigger asChild>
            <badge_js_1.Badge variant="destructive" className="cls_message_status px-1 py-0 h-4">
              !
            </badge_js_1.Badge>
          </tooltip_js_1.TooltipTrigger>
          <tooltip_js_1.TooltipContent>Failed to send</tooltip_js_1.TooltipContent>
        </tooltip_js_1.Tooltip>);
        }
        if (message.read_at) {
            return (<tooltip_js_1.Tooltip>
          <tooltip_js_1.TooltipTrigger asChild>
            <badge_js_1.Badge variant="success" className="cls_message_status px-1 py-0 h-4">
              <io5_1.IoCheckmarkDoneSharp className="w-3 h-3"/>
            </badge_js_1.Badge>
          </tooltip_js_1.TooltipTrigger>
          <tooltip_js_1.TooltipContent>Read</tooltip_js_1.TooltipContent>
        </tooltip_js_1.Tooltip>);
        }
        return (<tooltip_js_1.Tooltip>
        <tooltip_js_1.TooltipTrigger asChild>
          <badge_js_1.Badge variant="secondary" className="cls_message_status px-1 py-0 h-4">
            <io5_1.IoCheckmarkOutline className="w-3 h-3"/>
          </badge_js_1.Badge>
        </tooltip_js_1.TooltipTrigger>
        <tooltip_js_1.TooltipContent>Sent</tooltip_js_1.TooltipContent>
      </tooltip_js_1.Tooltip>);
    };
    return (<div className={(0, utils_js_1.cn)('cls_chat_bubble_wrapper', 'flex w-full mb-4 group', is_sender ? 'justify-end' : 'justify-start', is_highlighted && 'animate-pulse bg-primary/5 -mx-2 px-2 py-1 rounded-lg', className)} id={"message-".concat(message.id)}>
      {/* Avatar for received messages */}
      {!is_sender && (<avatar_js_1.Avatar className="cls_bubble_avatar h-8 w-8 mr-2 flex-shrink-0">
          <avatar_js_1.AvatarImage src={sender_profile === null || sender_profile === void 0 ? void 0 : sender_profile.avatar_url} alt={"".concat((sender_profile === null || sender_profile === void 0 ? void 0 : sender_profile.name) || 'User', " avatar")}/>
          <avatar_js_1.AvatarFallback className="text-xs">
            {get_initials(sender_profile === null || sender_profile === void 0 ? void 0 : sender_profile.name)}
          </avatar_js_1.AvatarFallback>
        </avatar_js_1.Avatar>)}

      {/* Message bubble */}
      <div className="cls_bubble_content flex flex-col max-w-[70%]">
        {/* Sender name for received messages */}
        {!is_sender && (sender_profile === null || sender_profile === void 0 ? void 0 : sender_profile.name) && (<span className="cls_bubble_sender text-xs text-muted-foreground mb-1 ml-1">
            {sender_profile.name}
          </span>)}

        {/* Bubble */}
        <div className={(0, utils_js_1.cn)('cls_bubble', 'px-4 py-2 rounded-2xl relative', is_sender
            ? 'bg-primary text-primary-foreground rounded-br-md'
            : 'bg-muted text-foreground rounded-bl-md', is_deleted && 'opacity-60 italic')}>
          {/* Message text */}
          <p className="cls_bubble_text text-sm whitespace-pre-wrap break-words">
            {display_text}
          </p>

          {/* Reference attachments */}
          {has_references && !is_deleted && (<div className="cls_bubble_references flex flex-wrap gap-1 mt-2 pt-2 border-t border-current/10">
              {(_b = message.reference_list) === null || _b === void 0 ? void 0 : _b.map(function (ref) { return (<button_js_1.Button key={ref.id} variant="ghost" size="sm" onClick={function () { return handle_reference_click(ref); }} className={(0, utils_js_1.cn)('cls_bubble_reference_btn', 'h-6 px-2 text-xs', is_sender
                    ? 'hover:bg-primary-foreground/20'
                    : 'hover:bg-background/50')}>
                  <io5_1.IoDocumentAttachSharp className="w-3 h-3 mr-1"/>
                  <span className="truncate max-w-[100px]">{ref.name}</span>
                </button_js_1.Button>); })}
            </div>)}

          {/* Delete button for sender's messages */}
          {is_sender && !is_deleted && on_delete && (<tooltip_js_1.Tooltip>
              <tooltip_js_1.TooltipTrigger asChild>
                <button_js_1.Button variant={show_delete_confirm ? 'destructive' : 'ghost'} size="icon" onClick={handle_delete_click} className={(0, utils_js_1.cn)('cls_bubble_delete_btn', 'absolute -left-8 top-1/2 -translate-y-1/2', 'w-6 h-6', 'opacity-0 group-hover:opacity-100 transition-opacity')}>
                  <io5_1.IoTrashOutline className="w-3.5 h-3.5"/>
                </button_js_1.Button>
              </tooltip_js_1.TooltipTrigger>
              <tooltip_js_1.TooltipContent>
                {show_delete_confirm ? 'Click again to confirm' : 'Delete message'}
              </tooltip_js_1.TooltipContent>
            </tooltip_js_1.Tooltip>)}
        </div>

        {/* Timestamp and status */}
        <div className={(0, utils_js_1.cn)('cls_bubble_meta', 'flex items-center gap-1.5 mt-1', is_sender ? 'justify-end mr-1' : 'ml-1')}>
          <span className="cls_bubble_time text-xs text-muted-foreground">
            {format_timestamp(message.created_at, timezone)}
          </span>
          {render_status_icon()}
        </div>
      </div>

      {/* Avatar for sent messages */}
      {is_sender && (<avatar_js_1.Avatar className="cls_bubble_avatar h-8 w-8 ml-2 flex-shrink-0">
          <avatar_js_1.AvatarImage src={sender_profile === null || sender_profile === void 0 ? void 0 : sender_profile.avatar_url} alt="Your avatar"/>
          <avatar_js_1.AvatarFallback className="text-xs bg-primary/20 text-primary">
            {get_initials(sender_profile === null || sender_profile === void 0 ? void 0 : sender_profile.name)}
          </avatar_js_1.AvatarFallback>
        </avatar_js_1.Avatar>)}
    </div>);
}
ChatBubble.displayName = 'ChatBubble';
