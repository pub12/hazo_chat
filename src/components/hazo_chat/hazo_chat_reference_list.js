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
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HazoChatReferenceList = HazoChatReferenceList;
var react_1 = require("react");
var io5_1 = require("react-icons/io5");
var lu_1 = require("react-icons/lu");
var ci_1 = require("react-icons/ci");
var utils_js_1 = require("../../lib/utils.js");
var button_js_1 = require("../ui/button.js");
var badge_js_1 = require("../ui/badge.js");
var tooltip_js_1 = require("../ui/tooltip.js");
// ============================================================================
// Helper Functions
// ============================================================================
/**
 * Get icon for reference type
 */
function get_reference_icon(type) {
    switch (type) {
        case 'document':
            return io5_1.IoDocumentAttachSharp;
        case 'field':
            return lu_1.LuTextCursorInput;
        case 'url':
            return io5_1.IoLinkSharp;
        default:
            return io5_1.IoDocumentAttachSharp;
    }
}
/**
 * Get scope badge icon
 */
function get_scope_icon(scope) {
    return scope === 'chat' ? ci_1.CiChat1 : lu_1.LuTextCursorInput;
}
/**
 * Get file extension from URL or name
 */
function get_file_extension(reference) {
    var _a;
    var name = reference.name || reference.url;
    var parts = name.split('.');
    return parts.length > 1 ? ((_a = parts.pop()) === null || _a === void 0 ? void 0 : _a.toUpperCase()) || '' : '';
}
function ReferenceItem(_a) {
    var reference = _a.reference, is_selected = _a.is_selected, on_click = _a.on_click;
    var TypeIcon = get_reference_icon(reference.type);
    var ScopeIcon = get_scope_icon(reference.scope);
    var extension = get_file_extension(reference);
    return (<tooltip_js_1.Tooltip>
      <tooltip_js_1.TooltipTrigger asChild>
        <button_js_1.Button variant={is_selected ? 'outline' : 'ghost'} onClick={on_click} className={(0, utils_js_1.cn)('cls_reference_item', 'relative flex flex-col items-center justify-center', 'w-12 h-12 p-0', is_selected && 'ring-2 ring-primary bg-primary/5')} aria-label={"".concat(reference.type, ": ").concat(reference.name)} aria-pressed={is_selected}>
          {/* Main icon */}
          <TypeIcon className="w-5 h-5 text-foreground"/>

          {/* Extension label */}
          {extension && (<span className="text-[8px] font-medium text-muted-foreground mt-0.5 uppercase">
              {extension.substring(0, 4)}
            </span>)}

          {/* Scope badge */}
          <badge_js_1.Badge variant={reference.scope === 'chat' ? 'secondary' : 'success'} className={(0, utils_js_1.cn)('cls_reference_scope_badge', 'absolute -top-1 -right-1', 'w-4 h-4 p-0 rounded-full', 'flex items-center justify-center')}>
            <ScopeIcon className="w-2.5 h-2.5"/>
          </badge_js_1.Badge>
        </button_js_1.Button>
      </tooltip_js_1.TooltipTrigger>
      <tooltip_js_1.TooltipContent side="bottom">
        <p className="font-medium">{reference.name}</p>
        <p className="text-xs text-muted-foreground">
          {reference.scope === 'chat' ? 'In chat only' : 'In form fields'}
        </p>
      </tooltip_js_1.TooltipContent>
    </tooltip_js_1.Tooltip>);
}
// ============================================================================
// Main Component
// ============================================================================
function HazoChatReferenceList(_a) {
    var references = _a.references, selected_reference_id = _a.selected_reference_id, on_select = _a.on_select, className = _a.className;
    var handle_select = (0, react_1.useCallback)(function (reference) {
        on_select(reference);
    }, [on_select]);
    if (references.length === 0) {
        return (<div className={(0, utils_js_1.cn)('cls_reference_list_empty', 'flex items-center justify-center p-4', 'text-sm text-muted-foreground', className)}>
        No references yet
      </div>);
    }
    return (<div className={(0, utils_js_1.cn)('cls_hazo_chat_reference_list', 'flex flex-wrap gap-1 p-2', className)} role="listbox" aria-label="Document references">
      {references.map(function (reference) { return (<ReferenceItem key={reference.id} reference={reference} is_selected={selected_reference_id === reference.id} on_click={function () { return handle_select(reference); }}/>); })}
    </div>);
}
HazoChatReferenceList.displayName = 'HazoChatReferenceList';
