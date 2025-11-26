/**
 * HazoChatContext - React context for shared state management
 *
 * Provides centralized state management for:
 * - Selected reference/document
 * - Current user profile (cached)
 * - Pending file attachments
 * - Sidebar collapsed state (mobile)
 * - Polling connection status
 * - Error handling
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
exports.HazoChatContext = void 0;
exports.HazoChatProvider = HazoChatProvider;
exports.useHazoChatContext = useHazoChatContext;
var react_1 = require("react");
// ============================================================================
// Initial State
// ============================================================================
var initial_state = {
    current_user: null,
    selected_reference: null,
    highlighted_message_id: null,
    pending_attachments: [],
    is_sidebar_open: false,
    polling_status: 'connected',
    all_references: [],
    error_message: null
};
// ============================================================================
// Reducer
// ============================================================================
function hazo_chat_reducer(state, action) {
    switch (action.type) {
        case 'SET_CURRENT_USER':
            return __assign(__assign({}, state), { current_user: action.payload });
        case 'SET_SELECTED_REFERENCE':
            return __assign(__assign({}, state), { selected_reference: action.payload });
        case 'SET_HIGHLIGHTED_MESSAGE_ID':
            return __assign(__assign({}, state), { highlighted_message_id: action.payload });
        case 'ADD_PENDING_ATTACHMENT':
            return __assign(__assign({}, state), { pending_attachments: __spreadArray(__spreadArray([], state.pending_attachments, true), [action.payload], false) });
        case 'REMOVE_PENDING_ATTACHMENT':
            return __assign(__assign({}, state), { pending_attachments: state.pending_attachments.filter(function (attachment) { return attachment.id !== action.payload; }) });
        case 'UPDATE_PENDING_ATTACHMENT':
            return __assign(__assign({}, state), { pending_attachments: state.pending_attachments.map(function (attachment) {
                    return attachment.id === action.payload.id
                        ? __assign(__assign({}, attachment), action.payload.updates) : attachment;
                }) });
        case 'CLEAR_PENDING_ATTACHMENTS':
            // Revoke any object URLs to prevent memory leaks
            state.pending_attachments.forEach(function (attachment) {
                if (attachment.preview_url) {
                    URL.revokeObjectURL(attachment.preview_url);
                }
            });
            return __assign(__assign({}, state), { pending_attachments: [] });
        case 'TOGGLE_SIDEBAR':
            return __assign(__assign({}, state), { is_sidebar_open: !state.is_sidebar_open });
        case 'SET_SIDEBAR_OPEN':
            return __assign(__assign({}, state), { is_sidebar_open: action.payload });
        case 'SET_POLLING_STATUS':
            return __assign(__assign({}, state), { polling_status: action.payload });
        case 'ADD_REFERENCE':
            // Check if reference already exists
            if (state.all_references.some(function (ref) { return ref.id === action.payload.id; })) {
                return state;
            }
            return __assign(__assign({}, state), { all_references: __spreadArray(__spreadArray([], state.all_references, true), [action.payload], false) });
        case 'SET_ALL_REFERENCES':
            return __assign(__assign({}, state), { all_references: action.payload });
        case 'SET_ERROR_MESSAGE':
            return __assign(__assign({}, state), { error_message: action.payload });
        default:
            return state;
    }
}
// ============================================================================
// Context
// ============================================================================
var HazoChatContext = (0, react_1.createContext)(null);
exports.HazoChatContext = HazoChatContext;
// ============================================================================
// Provider Component
// ============================================================================
/**
 * HazoChatProvider - Context provider for HazoChat component tree
 *
 * @param children - Child components
 * @param hazo_auth - Authentication service instance
 * @param initial_references - Initial references from props
 */
function HazoChatProvider(_a) {
    var children = _a.children, hazo_auth = _a.hazo_auth, _b = _a.initial_references, initial_references = _b === void 0 ? [] : _b;
    var _c = (0, react_1.useReducer)(hazo_chat_reducer, __assign(__assign({}, initial_state), { all_references: initial_references })), state = _c[0], dispatch = _c[1];
    // -------------------------------------------------------------------------
    // Load current user on mount
    // -------------------------------------------------------------------------
    (0, react_1.useEffect)(function () {
        function load_current_user() {
            return __awaiter(this, void 0, void 0, function () {
                var auth_user, profiles, error_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 4, , 5]);
                            return [4 /*yield*/, hazo_auth.hazo_get_auth()];
                        case 1:
                            auth_user = _a.sent();
                            if (!auth_user) return [3 /*break*/, 3];
                            return [4 /*yield*/, hazo_auth.hazo_get_user_profiles([auth_user.id])];
                        case 2:
                            profiles = _a.sent();
                            if (profiles.length > 0) {
                                dispatch({ type: 'SET_CURRENT_USER', payload: profiles[0] });
                            }
                            _a.label = 3;
                        case 3: return [3 /*break*/, 5];
                        case 4:
                            error_1 = _a.sent();
                            console.error('[HazoChatContext] Failed to load current user:', error_1);
                            dispatch({
                                type: 'SET_ERROR_MESSAGE',
                                payload: 'Failed to authenticate user'
                            });
                            return [3 /*break*/, 5];
                        case 5: return [2 /*return*/];
                    }
                });
            });
        }
        load_current_user();
    }, [hazo_auth]);
    // -------------------------------------------------------------------------
    // Action creators
    // -------------------------------------------------------------------------
    var set_selected_reference = (0, react_1.useCallback)(function (reference) {
        dispatch({ type: 'SET_SELECTED_REFERENCE', payload: reference });
        // Also set highlighted message if reference has a message_id
        if (reference === null || reference === void 0 ? void 0 : reference.message_id) {
            dispatch({
                type: 'SET_HIGHLIGHTED_MESSAGE_ID',
                payload: reference.message_id
            });
        }
    }, []);
    var set_highlighted_message_id = (0, react_1.useCallback)(function (message_id) {
        dispatch({ type: 'SET_HIGHLIGHTED_MESSAGE_ID', payload: message_id });
    }, []);
    var add_pending_attachment = (0, react_1.useCallback)(function (file) {
        var id = "attachment-".concat(Date.now(), "-").concat(Math.random().toString(36).substr(2, 9));
        // Create preview URL for images
        var preview_url;
        if (file.type.startsWith('image/')) {
            preview_url = URL.createObjectURL(file);
        }
        var attachment = {
            id: id,
            file: file,
            preview_url: preview_url,
            upload_status: 'pending'
        };
        dispatch({ type: 'ADD_PENDING_ATTACHMENT', payload: attachment });
    }, []);
    var remove_pending_attachment = (0, react_1.useCallback)(function (attachment_id) {
        // Find and revoke object URL before removing
        var attachment = state.pending_attachments.find(function (a) { return a.id === attachment_id; });
        if (attachment === null || attachment === void 0 ? void 0 : attachment.preview_url) {
            URL.revokeObjectURL(attachment.preview_url);
        }
        dispatch({ type: 'REMOVE_PENDING_ATTACHMENT', payload: attachment_id });
    }, [state.pending_attachments]);
    var update_pending_attachment = (0, react_1.useCallback)(function (attachment_id, updates) {
        dispatch({
            type: 'UPDATE_PENDING_ATTACHMENT',
            payload: { id: attachment_id, updates: updates }
        });
    }, []);
    var clear_pending_attachments = (0, react_1.useCallback)(function () {
        dispatch({ type: 'CLEAR_PENDING_ATTACHMENTS' });
    }, []);
    var toggle_sidebar = (0, react_1.useCallback)(function () {
        dispatch({ type: 'TOGGLE_SIDEBAR' });
    }, []);
    var set_sidebar_open = (0, react_1.useCallback)(function (is_open) {
        dispatch({ type: 'SET_SIDEBAR_OPEN', payload: is_open });
    }, []);
    var set_error_message = (0, react_1.useCallback)(function (message) {
        dispatch({ type: 'SET_ERROR_MESSAGE', payload: message });
    }, []);
    var add_reference = (0, react_1.useCallback)(function (reference) {
        dispatch({ type: 'ADD_REFERENCE', payload: reference });
    }, []);
    // -------------------------------------------------------------------------
    // Memoized context value
    // -------------------------------------------------------------------------
    var context_value = (0, react_1.useMemo)(function () { return ({
        // State
        current_user: state.current_user,
        selected_reference: state.selected_reference,
        highlighted_message_id: state.highlighted_message_id,
        pending_attachments: state.pending_attachments,
        is_sidebar_open: state.is_sidebar_open,
        polling_status: state.polling_status,
        all_references: state.all_references,
        error_message: state.error_message,
        // Actions
        set_selected_reference: set_selected_reference,
        set_highlighted_message_id: set_highlighted_message_id,
        add_pending_attachment: add_pending_attachment,
        remove_pending_attachment: remove_pending_attachment,
        update_pending_attachment: update_pending_attachment,
        clear_pending_attachments: clear_pending_attachments,
        toggle_sidebar: toggle_sidebar,
        set_sidebar_open: set_sidebar_open,
        set_error_message: set_error_message,
        add_reference: add_reference
    }); }, [
        state,
        set_selected_reference,
        set_highlighted_message_id,
        add_pending_attachment,
        remove_pending_attachment,
        update_pending_attachment,
        clear_pending_attachments,
        toggle_sidebar,
        set_sidebar_open,
        set_error_message,
        add_reference
    ]);
    return (<HazoChatContext.Provider value={context_value}>
      {children}
    </HazoChatContext.Provider>);
}
// ============================================================================
// Custom Hook
// ============================================================================
/**
 * useHazoChatContext - Hook to access HazoChat context
 *
 * @throws Error if used outside of HazoChatProvider
 * @returns HazoChatContextValue
 */
function useHazoChatContext() {
    var context = (0, react_1.useContext)(HazoChatContext);
    if (!context) {
        throw new Error('useHazoChatContext must be used within a HazoChatProvider');
    }
    return context;
}
