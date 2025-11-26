/**
 * HazoChatInput Component
 *
 * Message input area with:
 * - Text input (auto-resizing textarea)
 * - File attachment buttons
 * - Drag-and-drop support
 * - Send button
 * - Attachment preview
 *
 * Uses shadcn/ui Textarea, Button, and Tooltip components.
 */
'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HazoChatInput = HazoChatInput;
var react_1 = require("react");
var io5_1 = require("react-icons/io5");
var utils_js_1 = require("../../lib/utils.js");
var hazo_chat_attachment_preview_js_1 = require("./hazo_chat_attachment_preview.js");
var button_js_1 = require("../ui/button.js");
var textarea_js_1 = require("../ui/textarea.js");
var tooltip_js_1 = require("../ui/tooltip.js");
// ============================================================================
// Component
// ============================================================================
function HazoChatInput(_a) {
    var on_send = _a.on_send, pending_attachments = _a.pending_attachments, on_add_attachment = _a.on_add_attachment, on_remove_attachment = _a.on_remove_attachment, _b = _a.is_disabled, is_disabled = _b === void 0 ? false : _b, _c = _a.placeholder, placeholder = _c === void 0 ? 'Type a message...' : _c, className = _a.className;
    var _d = (0, react_1.useState)(''), message = _d[0], set_message = _d[1];
    var _e = (0, react_1.useState)(false), is_dragging = _e[0], set_is_dragging = _e[1];
    var textarea_ref = (0, react_1.useRef)(null);
    var file_input_ref = (0, react_1.useRef)(null);
    var image_input_ref = (0, react_1.useRef)(null);
    // -------------------------------------------------------------------------
    // Auto-resize textarea
    // -------------------------------------------------------------------------
    var resize_textarea = (0, react_1.useCallback)(function () {
        var textarea = textarea_ref.current;
        if (!textarea)
            return;
        textarea.style.height = 'auto';
        textarea.style.height = "".concat(Math.min(textarea.scrollHeight, 120), "px");
    }, []);
    // -------------------------------------------------------------------------
    // Handle text change
    // -------------------------------------------------------------------------
    var handle_change = (0, react_1.useCallback)(function (e) {
        set_message(e.target.value);
        resize_textarea();
    }, [resize_textarea]);
    // -------------------------------------------------------------------------
    // Handle send
    // -------------------------------------------------------------------------
    var handle_send = (0, react_1.useCallback)(function () {
        var trimmed = message.trim();
        var has_attachments = pending_attachments.length > 0;
        if (!trimmed && !has_attachments)
            return;
        if (is_disabled)
            return;
        // Convert pending attachments to uploaded files format
        var uploaded_files = pending_attachments
            .filter(function (a) { return a.upload_status === 'uploaded' || a.upload_status === 'pending'; })
            .map(function (a) { return ({
            id: a.id,
            name: a.file.name,
            url: '', // Will be filled after upload
            mime_type: a.file.type,
            file_size: a.file.size
        }); });
        on_send(trimmed, uploaded_files);
        set_message('');
        // Reset textarea height
        if (textarea_ref.current) {
            textarea_ref.current.style.height = 'auto';
        }
    }, [message, pending_attachments, is_disabled, on_send]);
    // -------------------------------------------------------------------------
    // Handle keyboard events
    // -------------------------------------------------------------------------
    var handle_key_down = (0, react_1.useCallback)(function (e) {
        // Send on Enter without Shift
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handle_send();
        }
    }, [handle_send]);
    // -------------------------------------------------------------------------
    // Handle file selection
    // -------------------------------------------------------------------------
    var handle_file_change = (0, react_1.useCallback)(function (e) {
        var files = Array.from(e.target.files || []);
        if (files.length > 0) {
            on_add_attachment(files);
        }
        // Reset input
        e.target.value = '';
    }, [on_add_attachment]);
    // -------------------------------------------------------------------------
    // Handle drag events
    // -------------------------------------------------------------------------
    var handle_drag_over = (0, react_1.useCallback)(function (e) {
        e.preventDefault();
        e.stopPropagation();
        set_is_dragging(true);
    }, []);
    var handle_drag_leave = (0, react_1.useCallback)(function (e) {
        e.preventDefault();
        e.stopPropagation();
        set_is_dragging(false);
    }, []);
    var handle_drop = (0, react_1.useCallback)(function (e) {
        e.preventDefault();
        e.stopPropagation();
        set_is_dragging(false);
        var files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            on_add_attachment(files);
        }
    }, [on_add_attachment]);
    // -------------------------------------------------------------------------
    // Trigger file inputs
    // -------------------------------------------------------------------------
    var handle_attach_click = (0, react_1.useCallback)(function () {
        var _a;
        (_a = file_input_ref.current) === null || _a === void 0 ? void 0 : _a.click();
    }, []);
    var handle_image_click = (0, react_1.useCallback)(function () {
        var _a;
        (_a = image_input_ref.current) === null || _a === void 0 ? void 0 : _a.click();
    }, []);
    // -------------------------------------------------------------------------
    // Check if can send
    // -------------------------------------------------------------------------
    var can_send = !is_disabled && (message.trim().length > 0 || pending_attachments.length > 0);
    return (<div className={(0, utils_js_1.cn)('cls_hazo_chat_input', 'flex flex-col border-t bg-background', is_dragging && 'ring-2 ring-primary ring-inset', className)} onDragOver={handle_drag_over} onDragLeave={handle_drag_leave} onDrop={handle_drop}>
      {/* Attachment preview */}
      <hazo_chat_attachment_preview_js_1.HazoChatAttachmentPreview attachments={pending_attachments} on_remove={on_remove_attachment}/>

      {/* Input area */}
      <div className="cls_input_row flex items-end gap-2 p-3">
        {/* Attachment button */}
        <tooltip_js_1.Tooltip>
          <tooltip_js_1.TooltipTrigger asChild>
            <button_js_1.Button variant="ghost" size="icon" onClick={handle_attach_click} disabled={is_disabled} className="cls_attach_btn text-muted-foreground hover:text-foreground" aria-label="Attach file">
              <io5_1.IoAttach className="w-5 h-5"/>
            </button_js_1.Button>
          </tooltip_js_1.TooltipTrigger>
          <tooltip_js_1.TooltipContent>Attach file</tooltip_js_1.TooltipContent>
        </tooltip_js_1.Tooltip>

        {/* Image button */}
        <tooltip_js_1.Tooltip>
          <tooltip_js_1.TooltipTrigger asChild>
            <button_js_1.Button variant="ghost" size="icon" onClick={handle_image_click} disabled={is_disabled} className="cls_image_btn text-muted-foreground hover:text-foreground" aria-label="Attach image">
              <io5_1.IoImageOutline className="w-5 h-5"/>
            </button_js_1.Button>
          </tooltip_js_1.TooltipTrigger>
          <tooltip_js_1.TooltipContent>Attach image</tooltip_js_1.TooltipContent>
        </tooltip_js_1.Tooltip>

        {/* Hidden file inputs */}
        <input ref={file_input_ref} type="file" multiple onChange={handle_file_change} className="hidden" aria-hidden="true"/>
        <input ref={image_input_ref} type="file" accept="image/*" multiple onChange={handle_file_change} className="hidden" aria-hidden="true"/>

        {/* Text input */}
        <textarea_js_1.Textarea ref={textarea_ref} value={message} onChange={handle_change} onKeyDown={handle_key_down} placeholder={placeholder} disabled={is_disabled} rows={1} className={(0, utils_js_1.cn)('cls_message_textarea', 'flex-1 resize-none', 'min-h-[40px] max-h-[120px]')} aria-label="Message input"/>

        {/* Send button */}
        <tooltip_js_1.Tooltip>
          <tooltip_js_1.TooltipTrigger asChild>
            <button_js_1.Button variant="default" size="icon" onClick={handle_send} disabled={!can_send} className="cls_send_btn" aria-label="Send message">
              <io5_1.IoSend className="w-4 h-4"/>
            </button_js_1.Button>
          </tooltip_js_1.TooltipTrigger>
          <tooltip_js_1.TooltipContent>Send message (Enter)</tooltip_js_1.TooltipContent>
        </tooltip_js_1.Tooltip>
      </div>

      {/* Drag overlay */}
      {is_dragging && (<div className="absolute inset-0 bg-primary/10 flex items-center justify-center pointer-events-none">
          <p className="text-primary font-medium">Drop files here</p>
        </div>)}
    </div>);
}
HazoChatInput.displayName = 'HazoChatInput';
