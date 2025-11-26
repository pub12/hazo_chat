/**
 * useChatMessages Hook
 *
 * Manages chat messages with:
 * - Cursor-based pagination (infinite scroll)
 * - Polling for new messages with configurable interval
 * - Optimistic updates for sent messages
 * - Soft delete functionality
 * - Exponential backoff on errors
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
exports.useChatMessages = useChatMessages;
var react_1 = require("react");
var constants_js_1 = require("../lib/constants.js");
// ============================================================================
// Hook Implementation
// ============================================================================
function useChatMessages(_a) {
    var _this = this;
    var hazo_connect = _a.hazo_connect, hazo_auth = _a.hazo_auth, reference_id = _a.reference_id, receiver_user_id = _a.receiver_user_id, _b = _a.polling_interval, polling_interval = _b === void 0 ? constants_js_1.DEFAULT_POLLING_INTERVAL : _b, _c = _a.messages_per_page, messages_per_page = _c === void 0 ? constants_js_1.DEFAULT_MESSAGES_PER_PAGE : _c;
    // -------------------------------------------------------------------------
    // State
    // -------------------------------------------------------------------------
    var _d = (0, react_1.useState)([]), messages = _d[0], set_messages = _d[1];
    var _e = (0, react_1.useState)(true), is_loading = _e[0], set_is_loading = _e[1];
    var _f = (0, react_1.useState)(false), is_loading_more = _f[0], set_is_loading_more = _f[1];
    var _g = (0, react_1.useState)(true), has_more = _g[0], set_has_more = _g[1];
    var _h = (0, react_1.useState)(null), error = _h[0], set_error = _h[1];
    var _j = (0, react_1.useState)('connected'), polling_status = _j[0], set_polling_status = _j[1];
    var _k = (0, react_1.useState)(null), current_user_id = _k[0], set_current_user_id = _k[1];
    // -------------------------------------------------------------------------
    // Refs
    // -------------------------------------------------------------------------
    var cursor_ref = (0, react_1.useRef)(0);
    var retry_count_ref = (0, react_1.useRef)(0);
    var user_profiles_cache_ref = (0, react_1.useRef)(new Map());
    var polling_timer_ref = (0, react_1.useRef)(null);
    var is_mounted_ref = (0, react_1.useRef)(true);
    // -------------------------------------------------------------------------
    // Get current user on mount
    // -------------------------------------------------------------------------
    (0, react_1.useEffect)(function () {
        function get_current_user() {
            return __awaiter(this, void 0, void 0, function () {
                var auth_user, err_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, hazo_auth.hazo_get_auth()];
                        case 1:
                            auth_user = _a.sent();
                            if (auth_user && is_mounted_ref.current) {
                                set_current_user_id(auth_user.id);
                            }
                            return [3 /*break*/, 3];
                        case 2:
                            err_1 = _a.sent();
                            console.error('[useChatMessages] Failed to get current user:', err_1);
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            });
        }
        get_current_user();
        return function () {
            is_mounted_ref.current = false;
        };
    }, [hazo_auth]);
    // -------------------------------------------------------------------------
    // Fetch user profiles
    // -------------------------------------------------------------------------
    var fetch_user_profiles = (0, react_1.useCallback)(function (user_ids) { return __awaiter(_this, void 0, void 0, function () {
        var uncached_ids, profiles, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    uncached_ids = user_ids.filter(function (id) { return !user_profiles_cache_ref.current.has(id); });
                    if (!(uncached_ids.length > 0)) return [3 /*break*/, 4];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, hazo_auth.hazo_get_user_profiles(uncached_ids)];
                case 2:
                    profiles = _a.sent();
                    profiles.forEach(function (profile) {
                        user_profiles_cache_ref.current.set(profile.id, profile);
                    });
                    return [3 /*break*/, 4];
                case 3:
                    err_2 = _a.sent();
                    console.error('[useChatMessages] Failed to fetch user profiles:', err_2);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/, user_profiles_cache_ref.current];
            }
        });
    }); }, [hazo_auth]);
    // -------------------------------------------------------------------------
    // Transform DB messages to ChatMessage
    // -------------------------------------------------------------------------
    var transform_messages = (0, react_1.useCallback)(function (db_messages, user_id) { return __awaiter(_this, void 0, void 0, function () {
        var user_ids, profiles;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    user_ids = new Set();
                    db_messages.forEach(function (msg) {
                        user_ids.add(msg.sender_user_id);
                        user_ids.add(msg.receiver_user_id);
                    });
                    return [4 /*yield*/, fetch_user_profiles(Array.from(user_ids))];
                case 1:
                    profiles = _a.sent();
                    // Transform messages
                    return [2 /*return*/, db_messages.map(function (msg) { return (__assign(__assign({}, msg), { sender_profile: profiles.get(msg.sender_user_id), receiver_profile: profiles.get(msg.receiver_user_id), is_sender: msg.sender_user_id === user_id, send_status: 'sent' })); })];
            }
        });
    }); }, [fetch_user_profiles]);
    // -------------------------------------------------------------------------
    // Fetch messages
    // -------------------------------------------------------------------------
    var fetch_messages = (0, react_1.useCallback)(function (cursor, limit) { return __awaiter(_this, void 0, void 0, function () {
        var query_1, response, err_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!reference_id || !current_user_id) {
                        return [2 /*return*/, []];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    query_1 = hazo_connect
                        .from('hazo_chat')
                        .select('*')
                        .eq('reference_id', reference_id)
                        .or("sender_user_id.eq.".concat(current_user_id, ",receiver_user_id.eq.").concat(current_user_id))
                        .order('created_at', { ascending: false })
                        .range(cursor, cursor + limit - 1);
                    return [4 /*yield*/, new Promise(function (resolve) {
                            query_1.then(function (res) { return resolve(res); });
                        })];
                case 2:
                    response = _a.sent();
                    if (response.error) {
                        throw response.error;
                    }
                    return [2 /*return*/, response.data || []];
                case 3:
                    err_3 = _a.sent();
                    console.error('[useChatMessages] Fetch error:', err_3);
                    throw err_3;
                case 4: return [2 /*return*/];
            }
        });
    }); }, [hazo_connect, reference_id, current_user_id]);
    // -------------------------------------------------------------------------
    // Initial load
    // -------------------------------------------------------------------------
    var load_initial = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        var db_messages, transformed, err_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!current_user_id || !reference_id) {
                        set_is_loading(false);
                        return [2 /*return*/];
                    }
                    set_is_loading(true);
                    set_error(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    return [4 /*yield*/, fetch_messages(0, messages_per_page)];
                case 2:
                    db_messages = _a.sent();
                    return [4 /*yield*/, transform_messages(db_messages, current_user_id)];
                case 3:
                    transformed = _a.sent();
                    if (is_mounted_ref.current) {
                        set_messages(transformed);
                        set_has_more(db_messages.length === messages_per_page);
                        cursor_ref.current = db_messages.length;
                        retry_count_ref.current = 0;
                        set_polling_status('connected');
                    }
                    return [3 /*break*/, 6];
                case 4:
                    err_4 = _a.sent();
                    if (is_mounted_ref.current) {
                        set_error('Failed to load messages');
                        set_polling_status('error');
                    }
                    return [3 /*break*/, 6];
                case 5:
                    if (is_mounted_ref.current) {
                        set_is_loading(false);
                    }
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); }, [current_user_id, reference_id, fetch_messages, transform_messages, messages_per_page]);
    // -------------------------------------------------------------------------
    // Load more (pagination)
    // -------------------------------------------------------------------------
    var load_more = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        var db_messages, transformed_1, err_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!current_user_id || !has_more || is_loading_more) {
                        return [2 /*return*/];
                    }
                    set_is_loading_more(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    return [4 /*yield*/, fetch_messages(cursor_ref.current, messages_per_page)];
                case 2:
                    db_messages = _a.sent();
                    return [4 /*yield*/, transform_messages(db_messages, current_user_id)];
                case 3:
                    transformed_1 = _a.sent();
                    if (is_mounted_ref.current) {
                        set_messages(function (prev) { return __spreadArray(__spreadArray([], prev, true), transformed_1, true); });
                        set_has_more(db_messages.length === messages_per_page);
                        cursor_ref.current += db_messages.length;
                    }
                    return [3 /*break*/, 6];
                case 4:
                    err_5 = _a.sent();
                    console.error('[useChatMessages] Load more error:', err_5);
                    return [3 /*break*/, 6];
                case 5:
                    if (is_mounted_ref.current) {
                        set_is_loading_more(false);
                    }
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); }, [current_user_id, has_more, is_loading_more, fetch_messages, transform_messages, messages_per_page]);
    // -------------------------------------------------------------------------
    // Poll for new messages
    // -------------------------------------------------------------------------
    var poll_for_new_messages = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        var newest_timestamp, query_2, response, new_messages_1, transformed_2, err_6;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!current_user_id || !reference_id) {
                        return [2 /*return*/];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, , 6]);
                    newest_timestamp = messages.length > 0 ? messages[0].created_at : null;
                    query_2 = hazo_connect
                        .from('hazo_chat')
                        .select('*')
                        .eq('reference_id', reference_id)
                        .or("sender_user_id.eq.".concat(current_user_id, ",receiver_user_id.eq.").concat(current_user_id))
                        .order('created_at', { ascending: false });
                    // If we have messages, only fetch newer ones
                    if (newest_timestamp) {
                        query_2 = query_2.gt('created_at', newest_timestamp);
                    }
                    return [4 /*yield*/, new Promise(function (resolve) {
                            query_2.range(0, 50).then(function (res) { return resolve(res); });
                        })];
                case 2:
                    response = _a.sent();
                    if (response.error) {
                        throw response.error;
                    }
                    new_messages_1 = response.data || [];
                    if (!(new_messages_1.length > 0 && is_mounted_ref.current)) return [3 /*break*/, 4];
                    return [4 /*yield*/, transform_messages(new_messages_1, current_user_id)];
                case 3:
                    transformed_2 = _a.sent();
                    set_messages(function (prev) {
                        // Filter out any optimistic messages that now have real versions
                        var filtered = prev.filter(function (msg) { return !new_messages_1.some(function (nm) { return nm.id === msg.id; }); });
                        return __spreadArray(__spreadArray([], transformed_2, true), filtered, true);
                    });
                    cursor_ref.current += new_messages_1.length;
                    _a.label = 4;
                case 4:
                    retry_count_ref.current = 0;
                    if (is_mounted_ref.current) {
                        set_polling_status('connected');
                    }
                    return [3 /*break*/, 6];
                case 5:
                    err_6 = _a.sent();
                    console.error('[useChatMessages] Polling error:', err_6);
                    retry_count_ref.current += 1;
                    if (is_mounted_ref.current) {
                        if (retry_count_ref.current >= constants_js_1.MAX_RETRY_ATTEMPTS) {
                            set_polling_status('error');
                        }
                        else {
                            set_polling_status('reconnecting');
                        }
                    }
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    }); }, [current_user_id, reference_id, messages, hazo_connect, transform_messages]);
    // -------------------------------------------------------------------------
    // Start polling
    // -------------------------------------------------------------------------
    (0, react_1.useEffect)(function () {
        if (!current_user_id || !reference_id) {
            return;
        }
        // Clear any existing timer
        if (polling_timer_ref.current) {
            clearInterval(polling_timer_ref.current);
        }
        // Calculate delay with exponential backoff
        var get_poll_delay = function () {
            if (retry_count_ref.current === 0) {
                return polling_interval;
            }
            return Math.min(polling_interval * Math.pow(2, retry_count_ref.current), constants_js_1.RETRY_BASE_DELAY * 30 // Cap at 30 seconds
            );
        };
        var start_polling = function () {
            polling_timer_ref.current = setInterval(function () {
                poll_for_new_messages();
            }, get_poll_delay());
        };
        start_polling();
        return function () {
            if (polling_timer_ref.current) {
                clearInterval(polling_timer_ref.current);
            }
        };
    }, [current_user_id, reference_id, polling_interval, poll_for_new_messages]);
    // -------------------------------------------------------------------------
    // Initial load effect
    // -------------------------------------------------------------------------
    (0, react_1.useEffect)(function () {
        load_initial();
    }, [load_initial]);
    // -------------------------------------------------------------------------
    // Send message
    // -------------------------------------------------------------------------
    var send_message = (0, react_1.useCallback)(function (payload) { return __awaiter(_this, void 0, void 0, function () {
        var optimistic_id, optimistic_message, insert_data, query, response, real_message_1, err_7;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!current_user_id) {
                        set_error('Not authenticated');
                        return [2 /*return*/, false];
                    }
                    optimistic_id = "optimistic-".concat(Date.now());
                    optimistic_message = {
                        id: optimistic_id,
                        reference_id: payload.reference_id,
                        reference_type: payload.reference_type,
                        sender_user_id: current_user_id,
                        receiver_user_id: payload.receiver_user_id,
                        message_text: payload.message_text,
                        reference_list: payload.reference_list || null,
                        read_at: null,
                        deleted_at: null,
                        created_at: new Date().toISOString(),
                        changed_at: new Date().toISOString(),
                        sender_profile: user_profiles_cache_ref.current.get(current_user_id),
                        receiver_profile: user_profiles_cache_ref.current.get(payload.receiver_user_id),
                        is_sender: true,
                        send_status: 'sending'
                    };
                    // Add optimistic message to state
                    set_messages(function (prev) { return __spreadArray([optimistic_message], prev, true); });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    insert_data = {
                        reference_id: payload.reference_id,
                        reference_type: payload.reference_type,
                        sender_user_id: current_user_id,
                        receiver_user_id: payload.receiver_user_id,
                        message_text: payload.message_text,
                        reference_list: payload.reference_list || null
                    };
                    query = hazo_connect.from('hazo_chat').insert(insert_data);
                    return [4 /*yield*/, query.single()];
                case 2:
                    response = _a.sent();
                    if (response.error) {
                        throw response.error;
                    }
                    // Replace optimistic message with real one
                    if (response.data && is_mounted_ref.current) {
                        real_message_1 = __assign(__assign({}, response.data), { sender_profile: user_profiles_cache_ref.current.get(current_user_id), receiver_profile: user_profiles_cache_ref.current.get(payload.receiver_user_id), is_sender: true, send_status: 'sent' });
                        set_messages(function (prev) {
                            return prev.map(function (msg) {
                                return msg.id === optimistic_id ? real_message_1 : msg;
                            });
                        });
                    }
                    return [2 /*return*/, true];
                case 3:
                    err_7 = _a.sent();
                    console.error('[useChatMessages] Send error:', err_7);
                    // Mark optimistic message as failed
                    if (is_mounted_ref.current) {
                        set_messages(function (prev) {
                            return prev.map(function (msg) {
                                return msg.id === optimistic_id
                                    ? __assign(__assign({}, msg), { send_status: 'failed' }) : msg;
                            });
                        });
                    }
                    return [2 /*return*/, false];
                case 4: return [2 /*return*/];
            }
        });
    }); }, [current_user_id, hazo_connect]);
    // -------------------------------------------------------------------------
    // Delete message (soft delete)
    // -------------------------------------------------------------------------
    var delete_message = (0, react_1.useCallback)(function (message_id) { return __awaiter(_this, void 0, void 0, function () {
        var message, query_3, response, err_8;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!current_user_id) {
                        return [2 /*return*/, false];
                    }
                    message = messages.find(function (m) { return m.id === message_id; });
                    if (!message || message.sender_user_id !== current_user_id) {
                        set_error('Cannot delete this message');
                        return [2 /*return*/, false];
                    }
                    // Optimistic update
                    set_messages(function (prev) {
                        return prev.map(function (msg) {
                            return msg.id === message_id
                                ? __assign(__assign({}, msg), { deleted_at: new Date().toISOString(), message_text: null }) : msg;
                        });
                    });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    query_3 = hazo_connect
                        .from('hazo_chat')
                        .update({ deleted_at: new Date().toISOString() })
                        .eq('id', message_id)
                        .eq('sender_user_id', current_user_id);
                    return [4 /*yield*/, new Promise(function (resolve) {
                            query_3.then(function (res) { return resolve(res); });
                        })];
                case 2:
                    response = _a.sent();
                    if (response.error) {
                        throw response.error;
                    }
                    return [2 /*return*/, true];
                case 3:
                    err_8 = _a.sent();
                    console.error('[useChatMessages] Delete error:', err_8);
                    // Rollback on error
                    if (is_mounted_ref.current) {
                        set_messages(function (prev) {
                            return prev.map(function (msg) {
                                return msg.id === message_id
                                    ? __assign(__assign({}, msg), { deleted_at: message.deleted_at, message_text: message.message_text }) : msg;
                            });
                        });
                    }
                    return [2 /*return*/, false];
                case 4: return [2 /*return*/];
            }
        });
    }); }, [current_user_id, messages, hazo_connect]);
    // -------------------------------------------------------------------------
    // Mark as read
    // -------------------------------------------------------------------------
    var mark_as_read = (0, react_1.useCallback)(function (message_id) { return __awaiter(_this, void 0, void 0, function () {
        var message, query_4, err_9;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!current_user_id) {
                        return [2 /*return*/];
                    }
                    message = messages.find(function (m) { return m.id === message_id; });
                    if (!message || message.read_at || message.sender_user_id === current_user_id) {
                        return [2 /*return*/];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    query_4 = hazo_connect
                        .from('hazo_chat')
                        .update({ read_at: new Date().toISOString() })
                        .eq('id', message_id)
                        .eq('receiver_user_id', current_user_id);
                    return [4 /*yield*/, new Promise(function (resolve) {
                            query_4.then(function () { return resolve(); });
                        })];
                case 2:
                    _a.sent();
                    // Update local state
                    if (is_mounted_ref.current) {
                        set_messages(function (prev) {
                            return prev.map(function (msg) {
                                return msg.id === message_id
                                    ? __assign(__assign({}, msg), { read_at: new Date().toISOString() }) : msg;
                            });
                        });
                    }
                    return [3 /*break*/, 4];
                case 3:
                    err_9 = _a.sent();
                    console.error('[useChatMessages] Mark as read error:', err_9);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); }, [current_user_id, messages, hazo_connect]);
    // -------------------------------------------------------------------------
    // Refresh
    // -------------------------------------------------------------------------
    var refresh = (0, react_1.useCallback)(function () {
        cursor_ref.current = 0;
        set_messages([]);
        load_initial();
    }, [load_initial]);
    // -------------------------------------------------------------------------
    // Return
    // -------------------------------------------------------------------------
    return {
        messages: messages,
        is_loading: is_loading,
        is_loading_more: is_loading_more,
        has_more: has_more,
        error: error,
        polling_status: polling_status,
        load_more: load_more,
        send_message: send_message,
        delete_message: delete_message,
        mark_as_read: mark_as_read,
        refresh: refresh
    };
}
