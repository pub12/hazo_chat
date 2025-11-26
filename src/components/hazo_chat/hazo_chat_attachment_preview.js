/**
 * HazoChatAttachmentPreview Component
 *
 * Shows thumbnails of pending file attachments before sending with:
 * - Image previews for image files
 * - File icon for non-image files
 * - Upload status indicator
 * - Remove button
 *
 * Uses shadcn/ui Button and Badge components.
 */
'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HazoChatAttachmentPreview = HazoChatAttachmentPreview;
var react_1 = require("react");
var io5_1 = require("react-icons/io5");
var utils_js_1 = require("../../lib/utils.js");
var button_js_1 = require("../ui/button.js");
var badge_js_1 = require("../ui/badge.js");
var tooltip_js_1 = require("../ui/tooltip.js");
// ============================================================================
// Helper Functions
// ============================================================================
/**
 * Get file extension from filename
 */
function get_file_extension(filename) {
    var _a;
    var parts = filename.split('.');
    return parts.length > 1 ? ((_a = parts.pop()) === null || _a === void 0 ? void 0 : _a.toUpperCase()) || '' : '';
}
/**
 * Format file size
 */
function format_file_size(bytes) {
    if (bytes < 1024)
        return "".concat(bytes, " B");
    if (bytes < 1024 * 1024)
        return "".concat((bytes / 1024).toFixed(1), " KB");
    return "".concat((bytes / (1024 * 1024)).toFixed(1), " MB");
}
function AttachmentItem(_a) {
    var attachment = _a.attachment, on_remove = _a.on_remove;
    var extension = get_file_extension(attachment.file.name);
    var is_image = attachment.file.type.startsWith('image/');
    var is_uploading = attachment.upload_status === 'uploading';
    var has_error = attachment.upload_status === 'failed';
    return (<tooltip_js_1.Tooltip>
      <tooltip_js_1.TooltipTrigger asChild>
        <div className={(0, utils_js_1.cn)('cls_attachment_item', 'relative group', 'w-16 h-16 rounded-lg overflow-hidden', 'bg-muted border', has_error && 'border-destructive')}>
          {/* Preview */}
          {is_image && attachment.preview_url ? (<img src={attachment.preview_url} alt={attachment.file.name} className="w-full h-full object-cover"/>) : (<div className="w-full h-full flex flex-col items-center justify-center">
              <io5_1.IoDocumentOutline className="w-6 h-6 text-muted-foreground"/>
              <span className="text-[8px] font-medium text-muted-foreground mt-1">
                {extension}
              </span>
            </div>)}

          {/* Upload progress overlay */}
          {is_uploading && (<div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"/>
            </div>)}

          {/* Error indicator */}
          {has_error && (<div className="absolute inset-0 bg-destructive/20 flex items-center justify-center">
              <io5_1.IoAlertCircle className="w-6 h-6 text-destructive"/>
            </div>)}

          {/* Remove button */}
          <button_js_1.Button variant="ghost" size="icon" onClick={on_remove} className={(0, utils_js_1.cn)('cls_attachment_remove', 'absolute top-0.5 right-0.5', 'w-5 h-5 p-0', 'bg-black/60 text-white hover:bg-black/80', 'opacity-0 group-hover:opacity-100 transition-opacity')} aria-label={"Remove ".concat(attachment.file.name)}>
            <io5_1.IoClose className="w-3 h-3"/>
          </button_js_1.Button>

          {/* File size badge */}
          <badge_js_1.Badge variant="secondary" className="absolute bottom-0.5 left-0.5 right-0.5 text-[8px] px-1 py-0 justify-center bg-black/60 text-white border-0">
            {format_file_size(attachment.file.size)}
          </badge_js_1.Badge>
        </div>
      </tooltip_js_1.TooltipTrigger>
      <tooltip_js_1.TooltipContent>
        <p className="font-medium">{attachment.file.name}</p>
        <p className="text-xs text-muted-foreground">
          {format_file_size(attachment.file.size)}
        </p>
      </tooltip_js_1.TooltipContent>
    </tooltip_js_1.Tooltip>);
}
// ============================================================================
// Main Component
// ============================================================================
function HazoChatAttachmentPreview(_a) {
    var attachments = _a.attachments, on_remove = _a.on_remove, className = _a.className;
    var handle_remove = (0, react_1.useCallback)(function (attachment_id) {
        on_remove(attachment_id);
    }, [on_remove]);
    if (attachments.length === 0) {
        return null;
    }
    return (<div className={(0, utils_js_1.cn)('cls_hazo_chat_attachment_preview', 'flex flex-wrap gap-2 p-2 border-t bg-muted/30', className)} role="list" aria-label="Pending attachments">
      {attachments.map(function (attachment) { return (<AttachmentItem key={attachment.id} attachment={attachment} on_remove={function () { return handle_remove(attachment.id); }}/>); })}
    </div>);
}
HazoChatAttachmentPreview.displayName = 'HazoChatAttachmentPreview';
