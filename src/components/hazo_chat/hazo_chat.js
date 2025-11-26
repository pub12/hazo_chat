/**
 * HazoChat Component
 *
 * Main chat UI component with:
 * - Responsive grid layout (sidebar + chat area)
 * - Context provider for shared state
 * - Integration with hazo_connect, hazo_auth
 * - Document viewer and reference list
 * - Message polling and pagination
 */
'use client';
"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HazoChat = HazoChat;
var react_1 = require("react");
var utils_js_1 = require("../../lib/utils.js");
var constants_js_1 = require("../../lib/constants.js");
// Sub-components
var hazo_chat_context_js_1 = require("./hazo_chat_context.js");
var hazo_chat_header_js_1 = require("./hazo_chat_header.js");
var hazo_chat_sidebar_js_1 = require("./hazo_chat_sidebar.js");
var hazo_chat_reference_list_js_1 = require("./hazo_chat_reference_list.js");
var hazo_chat_document_viewer_js_1 = require("./hazo_chat_document_viewer.js");
var hazo_chat_messages_js_1 = require("./hazo_chat_messages.js");
var hazo_chat_input_js_1 = require("./hazo_chat_input.js");
var tooltip_js_1 = require("../ui/tooltip.js");
// Hooks
var use_chat_messages_js_1 = require("../../hooks/use_chat_messages.js");
var use_chat_references_js_1 = require("../../hooks/use_chat_references.js");
var use_file_upload_js_1 = require("../../hooks/use_file_upload.js");
function HazoChatInner(_a) {
    var _this = this;
    var hazo_connect = _a.hazo_connect, receiver_user_id = _a.receiver_user_id, document_save_location = _a.document_save_location, reference_id = _a.reference_id, _b = _a.reference_type, reference_type = _b === void 0 ? 'chat' : _b, _c = _a.additional_references, additional_references = _c === void 0 ? [] : _c, _d = _a.timezone, timezone = _d === void 0 ? constants_js_1.DEFAULT_TIMEZONE : _d, title = _a.title, subtitle = _a.subtitle, on_close = _a.on_close, className = _a.className, _e = _a.polling_interval, polling_interval = _e === void 0 ? constants_js_1.DEFAULT_POLLING_INTERVAL : _e, _f = _a.messages_per_page, messages_per_page = _f === void 0 ? constants_js_1.DEFAULT_MESSAGES_PER_PAGE : _f;
    // Get context
    var _g = (0, hazo_chat_context_js_1.useHazoChatContext)(), current_user = _g.current_user, selected_reference = _g.selected_reference, highlighted_message_id = _g.highlighted_message_id, pending_attachments = _g.pending_attachments, is_sidebar_open = _g.is_sidebar_open, set_selected_reference = _g.set_selected_reference, set_highlighted_message_id = _g.set_highlighted_message_id, add_pending_attachment = _g.add_pending_attachment, remove_pending_attachment = _g.remove_pending_attachment, clear_pending_attachments = _g.clear_pending_attachments, toggle_sidebar = _g.toggle_sidebar, set_sidebar_open = _g.set_sidebar_open, add_reference = _g.add_reference;
    // -------------------------------------------------------------------------
    // Messages hook
    // -------------------------------------------------------------------------
    var _h = (0, use_chat_messages_js_1.useChatMessages)({
        hazo_connect: hazo_connect,
        hazo_auth: { hazo_get_auth: function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                return [2 /*return*/, current_user ? { id: current_user.id } : null];
            }); }); }, hazo_get_user_profiles: function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                return [2 /*return*/, []];
            }); }); } },
        reference_id: reference_id,
        receiver_user_id: receiver_user_id,
        polling_interval: polling_interval,
        messages_per_page: messages_per_page
    }), messages = _h.messages, is_loading_messages = _h.is_loading, has_more = _h.has_more, load_more = _h.load_more, send_message = _h.send_message, delete_message = _h.delete_message, polling_status = _h.polling_status;
    // -------------------------------------------------------------------------
    // References hook
    // -------------------------------------------------------------------------
    var _j = (0, use_chat_references_js_1.useChatReferences)({
        messages: messages,
        initial_references: additional_references.map(function (ref) { return (__assign(__assign({}, ref), { scope: ref.scope || 'field' })); }),
        on_selection_change: function (ref) {
            set_selected_reference(ref);
            // If ref has message_id, highlight it
            if (ref === null || ref === void 0 ? void 0 : ref.message_id) {
                set_highlighted_message_id(ref.message_id);
                // Close sidebar on mobile after selection
                set_sidebar_open(false);
            }
        }
    }), references = _j.references, select_reference = _j.select_reference, get_message_for_reference = _j.get_message_for_reference;
    // -------------------------------------------------------------------------
    // File upload hook
    // -------------------------------------------------------------------------
    var _k = (0, use_file_upload_js_1.useFileUpload)({
        upload_location: document_save_location
    }), add_files = _k.add_files, remove_file = _k.remove_file, upload_all = _k.upload_all, is_uploading = _k.is_uploading;
    // -------------------------------------------------------------------------
    // Handle send message
    // -------------------------------------------------------------------------
    var handle_send = (0, react_1.useCallback)(function (text, attachments) { return __awaiter(_this, void 0, void 0, function () {
        var uploaded, attachment_refs, payload, success;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!current_user || !reference_id)
                        return [2 /*return*/];
                    return [4 /*yield*/, upload_all()];
                case 1:
                    uploaded = _a.sent();
                    attachment_refs = __spreadArray(__spreadArray([], attachments, true), uploaded, true).map(function (file) { return ({
                        id: file.id,
                        type: 'document',
                        scope: 'chat',
                        name: file.name,
                        url: file.url,
                        mime_type: file.mime_type,
                        file_size: file.file_size
                    }); });
                    payload = {
                        reference_id: reference_id,
                        reference_type: reference_type,
                        receiver_user_id: receiver_user_id,
                        message_text: text,
                        reference_list: attachment_refs.length > 0 ? attachment_refs : undefined
                    };
                    return [4 /*yield*/, send_message(payload)];
                case 2:
                    success = _a.sent();
                    if (success) {
                        clear_pending_attachments();
                        // Add new references to the list
                        attachment_refs.forEach(function (ref) { return add_reference(ref); });
                    }
                    return [2 /*return*/];
            }
        });
    }); }, [
        current_user,
        reference_id,
        reference_type,
        receiver_user_id,
        upload_all,
        send_message,
        clear_pending_attachments,
        add_reference
    ]);
    // -------------------------------------------------------------------------
    // Handle add attachment
    // -------------------------------------------------------------------------
    var handle_add_attachment = (0, react_1.useCallback)(function (files) {
        files.forEach(function (file) {
            add_pending_attachment(file);
        });
        add_files(files);
    }, [add_pending_attachment, add_files]);
    // -------------------------------------------------------------------------
    // Handle remove attachment
    // -------------------------------------------------------------------------
    var handle_remove_attachment = (0, react_1.useCallback)(function (attachment_id) {
        remove_pending_attachment(attachment_id);
        remove_file(attachment_id);
    }, [remove_pending_attachment, remove_file]);
    // -------------------------------------------------------------------------
    // Handle reference selection
    // -------------------------------------------------------------------------
    var handle_reference_select = (0, react_1.useCallback)(function (reference) {
        select_reference(reference);
    }, [select_reference]);
    // -------------------------------------------------------------------------
    // Render
    // -------------------------------------------------------------------------
    return (<div className={(0, utils_js_1.cn)('cls_hazo_chat', 'flex flex-col h-full w-full', 'bg-background rounded-lg border overflow-hidden', className)}>
      {/* Header */}
      <hazo_chat_header_js_1.HazoChatHeader title={title} subtitle={subtitle} on_close={on_close} on_toggle_sidebar={toggle_sidebar} is_sidebar_open={is_sidebar_open}/>

      {/* Main content area */}
      <div className="cls_chat_main flex flex-1 overflow-hidden relative">
        {/* Sidebar (references + viewer) */}
        <hazo_chat_sidebar_js_1.HazoChatSidebar is_open={is_sidebar_open} on_close={function () { return set_sidebar_open(false); }} className="md:w-[280px] md:flex-shrink-0">
          {/* Reference list */}
          <div className="cls_sidebar_references border-b p-2">
            <h3 className="text-xs font-medium text-muted-foreground px-2 mb-2">
              References
            </h3>
            <hazo_chat_reference_list_js_1.HazoChatReferenceList references={references} selected_reference_id={selected_reference === null || selected_reference === void 0 ? void 0 : selected_reference.id} on_select={handle_reference_select}/>
          </div>

          {/* Document viewer */}
          <div className="cls_sidebar_viewer flex-1 min-h-0">
            <hazo_chat_document_viewer_js_1.HazoChatDocumentViewer reference={selected_reference || undefined}/>
          </div>
        </hazo_chat_sidebar_js_1.HazoChatSidebar>

        {/* Chat area */}
        <div className="cls_chat_area flex flex-col flex-1 min-w-0">
          {/* Messages */}
          <hazo_chat_messages_js_1.HazoChatMessages messages={messages} current_user_id={(current_user === null || current_user === void 0 ? void 0 : current_user.id) || ''} timezone={timezone} is_loading={is_loading_messages} has_more={has_more} on_load_more={load_more} on_delete_message={delete_message} highlighted_message_id={highlighted_message_id || undefined}/>

          {/* Input */}
          <hazo_chat_input_js_1.HazoChatInput on_send={handle_send} pending_attachments={pending_attachments} on_add_attachment={handle_add_attachment} on_remove_attachment={handle_remove_attachment} is_disabled={!current_user || is_uploading}/>
        </div>
      </div>

      {/* Connection status indicator */}
      {polling_status !== 'connected' && (<div className={(0, utils_js_1.cn)('cls_connection_status', 'absolute bottom-20 left-1/2 -translate-x-1/2', 'px-3 py-1.5 rounded-full text-xs font-medium', polling_status === 'reconnecting'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800')}>
          {polling_status === 'reconnecting' ? 'Reconnecting...' : 'Connection error'}
        </div>)}
    </div>);
}
// ============================================================================
// Main Component (with Provider)
// ============================================================================
function HazoChat(props) {
    var hazo_auth = props.hazo_auth, _a = props.additional_references, additional_references = _a === void 0 ? [] : _a, inner_props = __rest(props, ["hazo_auth", "additional_references"]);
    // Convert ReferenceItem[] to ChatReferenceItem[]
    var initial_refs = (0, react_1.useMemo)(function () {
        return additional_references.map(function (ref) { return (__assign(__assign({}, ref), { scope: ref.scope || 'field' })); });
    }, [additional_references]);
    return (<tooltip_js_1.TooltipProvider>
      <hazo_chat_context_js_1.HazoChatProvider hazo_auth={hazo_auth} initial_references={initial_refs}>
        <HazoChatInner {...inner_props} additional_references={additional_references}/>
      </hazo_chat_context_js_1.HazoChatProvider>
    </tooltip_js_1.TooltipProvider>);
}
HazoChat.displayName = 'HazoChat';
