/**
 * useFileUpload Hook
 *
 * Manages file uploads with:
 * - File validation (size, type)
 * - Preview generation for images
 * - Upload progress tracking
 * - Batch upload support
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
exports.useFileUpload = useFileUpload;
var react_1 = require("react");
var constants_js_1 = require("../lib/constants.js");
// ============================================================================
// Helper Functions
// ============================================================================
/**
 * Get file extension from filename
 */
function get_file_extension(filename) {
    var _a;
    var parts = filename.split('.');
    return parts.length > 1 ? ((_a = parts.pop()) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || '' : '';
}
/**
 * Generate unique ID for attachment
 */
function generate_attachment_id() {
    return "attachment-".concat(Date.now(), "-").concat(Math.random().toString(36).substr(2, 9));
}
/**
 * Create preview URL for image files
 */
function create_preview_url(file) {
    if (file.type.startsWith('image/')) {
        return URL.createObjectURL(file);
    }
    return undefined;
}
/**
 * Default upload function (placeholder - should be overridden)
 */
function default_upload_function(file, location) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // This is a placeholder implementation
                    // In real usage, this would upload to cloud storage (e.g., Supabase Storage)
                    console.warn('[useFileUpload] Using default upload function. Override with upload_function prop.');
                    // Simulate upload delay
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                case 1:
                    // Simulate upload delay
                    _a.sent();
                    return [2 /*return*/, {
                            id: generate_attachment_id(),
                            name: file.name,
                            url: "".concat(location, "/").concat(file.name),
                            mime_type: file.type,
                            file_size: file.size
                        }];
            }
        });
    });
}
// ============================================================================
// Hook Implementation
// ============================================================================
function useFileUpload(_a) {
    var _this = this;
    var upload_location = _a.upload_location, _b = _a.max_file_size_mb, max_file_size_mb = _b === void 0 ? constants_js_1.DEFAULT_MAX_FILE_SIZE_MB : _b, _c = _a.allowed_types, allowed_types = _c === void 0 ? constants_js_1.DEFAULT_ALLOWED_TYPES : _c, _d = _a.upload_function, upload_function = _d === void 0 ? default_upload_function : _d;
    // -------------------------------------------------------------------------
    // State
    // -------------------------------------------------------------------------
    var _e = (0, react_1.useState)([]), pending_attachments = _e[0], set_pending_attachments = _e[1];
    var _f = (0, react_1.useState)(false), is_uploading = _f[0], set_is_uploading = _f[1];
    var _g = (0, react_1.useState)([]), validation_errors = _g[0], set_validation_errors = _g[1];
    // -------------------------------------------------------------------------
    // Refs
    // -------------------------------------------------------------------------
    var is_mounted_ref = (0, react_1.useRef)(true);
    // -------------------------------------------------------------------------
    // Validation
    // -------------------------------------------------------------------------
    var validate_file = (0, react_1.useCallback)(function (file) {
        // Check file size
        var max_size_bytes = max_file_size_mb * 1024 * 1024;
        if (file.size > max_size_bytes) {
            return {
                valid: false,
                error: "File \"".concat(file.name, "\" exceeds maximum size of ").concat(max_file_size_mb, "MB")
            };
        }
        // Check file type
        var extension = get_file_extension(file.name);
        if (!allowed_types.includes(extension)) {
            return {
                valid: false,
                error: "File type \"".concat(extension, "\" is not allowed. Allowed types: ").concat(allowed_types.join(', '))
            };
        }
        return { valid: true };
    }, [max_file_size_mb, allowed_types]);
    // -------------------------------------------------------------------------
    // Add files
    // -------------------------------------------------------------------------
    var add_files = (0, react_1.useCallback)(function (files) {
        var new_errors = [];
        var valid_attachments = [];
        files.forEach(function (file) {
            var validation = validate_file(file);
            if (!validation.valid && validation.error) {
                new_errors.push(validation.error);
                return;
            }
            var attachment = {
                id: generate_attachment_id(),
                file: file,
                preview_url: create_preview_url(file),
                upload_status: 'pending'
            };
            valid_attachments.push(attachment);
        });
        if (new_errors.length > 0) {
            set_validation_errors(function (prev) { return __spreadArray(__spreadArray([], prev, true), new_errors, true); });
        }
        if (valid_attachments.length > 0) {
            set_pending_attachments(function (prev) { return __spreadArray(__spreadArray([], prev, true), valid_attachments, true); });
        }
    }, [validate_file]);
    // -------------------------------------------------------------------------
    // Remove file
    // -------------------------------------------------------------------------
    var remove_file = (0, react_1.useCallback)(function (attachment_id) {
        set_pending_attachments(function (prev) {
            var attachment = prev.find(function (a) { return a.id === attachment_id; });
            // Revoke object URL to prevent memory leaks
            if (attachment === null || attachment === void 0 ? void 0 : attachment.preview_url) {
                URL.revokeObjectURL(attachment.preview_url);
            }
            return prev.filter(function (a) { return a.id !== attachment_id; });
        });
    }, []);
    // -------------------------------------------------------------------------
    // Upload single file
    // -------------------------------------------------------------------------
    var upload_single_file = (0, react_1.useCallback)(function (attachment) { return __awaiter(_this, void 0, void 0, function () {
        var result, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // Update status to uploading
                    set_pending_attachments(function (prev) {
                        return prev.map(function (a) {
                            return a.id === attachment.id
                                ? __assign(__assign({}, a), { upload_status: 'uploading' }) : a;
                        });
                    });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, upload_function(attachment.file, upload_location)];
                case 2:
                    result = _a.sent();
                    // Update status to uploaded
                    if (is_mounted_ref.current) {
                        set_pending_attachments(function (prev) {
                            return prev.map(function (a) {
                                return a.id === attachment.id
                                    ? __assign(__assign({}, a), { upload_status: 'uploaded' }) : a;
                            });
                        });
                    }
                    return [2 /*return*/, result];
                case 3:
                    error_1 = _a.sent();
                    console.error('[useFileUpload] Upload error:', error_1);
                    // Update status to failed
                    if (is_mounted_ref.current) {
                        set_pending_attachments(function (prev) {
                            return prev.map(function (a) {
                                return a.id === attachment.id
                                    ? __assign(__assign({}, a), { upload_status: 'failed', error_message: error_1 instanceof Error ? error_1.message : 'Upload failed' }) : a;
                            });
                        });
                    }
                    return [2 /*return*/, null];
                case 4: return [2 /*return*/];
            }
        });
    }); }, [upload_function, upload_location]);
    // -------------------------------------------------------------------------
    // Upload all pending files
    // -------------------------------------------------------------------------
    var upload_all = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        var pending, results, successful;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    pending = pending_attachments.filter(function (a) { return a.upload_status === 'pending' || a.upload_status === 'failed'; });
                    if (pending.length === 0) {
                        return [2 /*return*/, []];
                    }
                    set_is_uploading(true);
                    set_validation_errors([]);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, , 3, 4]);
                    return [4 /*yield*/, Promise.all(pending.map(function (attachment) { return upload_single_file(attachment); }))];
                case 2:
                    results = _a.sent();
                    successful = results.filter(function (result) { return result !== null; });
                    return [2 /*return*/, successful];
                case 3:
                    if (is_mounted_ref.current) {
                        set_is_uploading(false);
                    }
                    return [7 /*endfinally*/];
                case 4: return [2 /*return*/];
            }
        });
    }); }, [pending_attachments, upload_single_file]);
    // -------------------------------------------------------------------------
    // Clear all
    // -------------------------------------------------------------------------
    var clear_all = (0, react_1.useCallback)(function () {
        // Revoke all object URLs
        pending_attachments.forEach(function (attachment) {
            if (attachment.preview_url) {
                URL.revokeObjectURL(attachment.preview_url);
            }
        });
        set_pending_attachments([]);
        set_validation_errors([]);
    }, [pending_attachments]);
    // -------------------------------------------------------------------------
    // Return
    // -------------------------------------------------------------------------
    return {
        pending_attachments: pending_attachments,
        add_files: add_files,
        remove_file: remove_file,
        upload_all: upload_all,
        clear_all: clear_all,
        is_uploading: is_uploading,
        validation_errors: validation_errors
    };
}
