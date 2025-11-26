/**
 * Home Page - Test App
 *
 * Demonstrates the HazoChat component with mock services.
 */
'use client';
"use strict";
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
exports.default = HomePage;
var react_1 = require("react");
var hazo_chat_1 = require("hazo_chat");
var button_1 = require("@/components/ui/button");
// ============================================================================
// Mock Data
// ============================================================================
var MOCK_CURRENT_USER = {
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John'
};
var MOCK_OTHER_USER = {
    id: 'user-2',
    name: 'Sarah Chen',
    email: 'sarah@example.com',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah'
};
var MOCK_MESSAGES = [
    {
        id: 'msg-1',
        reference_id: 'ref-123',
        reference_type: 'chat',
        sender_user_id: 'user-2',
        receiver_user_id: 'user-1',
        message_text: 'Hey! Welcome to the hazo_chat demo. This component supports file attachments, document viewing, and real-time messaging.',
        reference_list: null,
        read_at: new Date(Date.now() - 3500000).toISOString(),
        deleted_at: null,
        created_at: new Date(Date.now() - 3600000).toISOString(),
        changed_at: new Date(Date.now() - 3600000).toISOString()
    },
    {
        id: 'msg-2',
        reference_id: 'ref-123',
        reference_type: 'chat',
        sender_user_id: 'user-1',
        receiver_user_id: 'user-2',
        message_text: 'Thanks! The interface looks really clean. I especially like the document viewer on the side.',
        reference_list: null,
        read_at: new Date(Date.now() - 3400000).toISOString(),
        deleted_at: null,
        created_at: new Date(Date.now() - 3500000).toISOString(),
        changed_at: new Date(Date.now() - 3500000).toISOString()
    },
    {
        id: 'msg-3',
        reference_id: 'ref-123',
        reference_type: 'chat',
        sender_user_id: 'user-2',
        receiver_user_id: 'user-1',
        message_text: 'Here is a sample document I wanted to share with you.',
        reference_list: [
            {
                id: 'doc-1',
                type: 'document',
                scope: 'chat',
                name: 'Sample Report.pdf',
                url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                mime_type: 'application/pdf'
            }
        ],
        read_at: null,
        deleted_at: null,
        created_at: new Date(Date.now() - 3400000).toISOString(),
        changed_at: new Date(Date.now() - 3400000).toISOString()
    }
];
var MOCK_REFERENCES = [
    {
        id: 'ref-field-1',
        type: 'field',
        scope: 'field',
        name: 'Project Name',
        url: '#field-project-name'
    },
    {
        id: 'ref-url-1',
        type: 'url',
        scope: 'field',
        name: 'Documentation',
        url: 'https://github.com/pub12/hazo_chat'
    }
];
// ============================================================================
// Mock Services
// ============================================================================
/**
 * Create mock hazo_connect instance
 */
function create_mock_hazo_connect(messages) {
    return {
        from: function (table) { return create_mock_query_builder(table, messages); }
    };
}
/**
 * Create mock query builder
 */
function create_mock_query_builder(table, messages) {
    var _this = this;
    var filtered_messages = __spreadArray([], messages, true);
    var insert_data = null;
    var builder = {
        select: function () { return builder; },
        insert: function (data) {
            insert_data = Array.isArray(data) ? data[0] : data;
            return builder;
        },
        update: function () { return builder; },
        delete: function () { return builder; },
        eq: function (column, value) {
            if (column === 'reference_id') {
                filtered_messages = filtered_messages.filter(function (m) { return m.reference_id === value; });
            }
            return builder;
        },
        neq: function () { return builder; },
        gt: function (column, value) {
            if (column === 'created_at') {
                filtered_messages = filtered_messages.filter(function (m) { return new Date(m.created_at) > new Date(value); });
            }
            return builder;
        },
        gte: function () { return builder; },
        lt: function () { return builder; },
        lte: function () { return builder; },
        or: function () { return builder; },
        order: function (column, options) {
            filtered_messages.sort(function (a, b) {
                var a_val = a[column];
                var b_val = b[column];
                return (options === null || options === void 0 ? void 0 : options.ascending)
                    ? a_val.localeCompare(b_val)
                    : b_val.localeCompare(a_val);
            });
            return builder;
        },
        range: function (from, to) {
            filtered_messages = filtered_messages.slice(from, to + 1);
            return builder;
        },
        single: function () { return __awaiter(_this, void 0, void 0, function () {
            var new_message;
            return __generator(this, function (_a) {
                if (insert_data) {
                    new_message = {
                        id: "msg-".concat(Date.now()),
                        reference_id: insert_data.reference_id,
                        reference_type: insert_data.reference_type,
                        sender_user_id: insert_data.sender_user_id,
                        receiver_user_id: insert_data.receiver_user_id,
                        message_text: insert_data.message_text,
                        reference_list: insert_data.reference_list,
                        read_at: null,
                        deleted_at: null,
                        created_at: new Date().toISOString(),
                        changed_at: new Date().toISOString()
                    };
                    messages.push(new_message);
                    return [2 /*return*/, { data: new_message, error: null }];
                }
                return [2 /*return*/, { data: filtered_messages[0] || null, error: null }];
            });
        }); },
        then: function (resolve) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                resolve({ data: filtered_messages, error: null });
                return [2 /*return*/];
            });
        }); }
    };
    return builder;
}
/**
 * Create mock hazo_auth instance
 */
function create_mock_hazo_auth() {
    var _this = this;
    return {
        hazo_get_auth: function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, ({ id: MOCK_CURRENT_USER.id, email: MOCK_CURRENT_USER.email })];
        }); }); },
        hazo_get_user_profiles: function (user_ids) { return __awaiter(_this, void 0, void 0, function () {
            var profiles;
            return __generator(this, function (_a) {
                profiles = [];
                user_ids.forEach(function (id) {
                    if (id === MOCK_CURRENT_USER.id)
                        profiles.push(MOCK_CURRENT_USER);
                    if (id === MOCK_OTHER_USER.id)
                        profiles.push(MOCK_OTHER_USER);
                });
                return [2 /*return*/, profiles];
            });
        }); }
    };
}
// ============================================================================
// Component
// ============================================================================
function HomePage() {
    var _a = (0, react_1.useState)(true), is_chat_open = _a[0], set_is_chat_open = _a[1];
    var messages = (0, react_1.useState)(MOCK_MESSAGES)[0];
    var mock_hazo_connect = create_mock_hazo_connect(messages);
    var mock_hazo_auth = create_mock_hazo_auth();
    var handle_close = (0, react_1.useCallback)(function () {
        set_is_chat_open(false);
    }, []);
    var handle_open = (0, react_1.useCallback)(function () {
        set_is_chat_open(true);
    }, []);
    return (<main className="cls_home_page min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="cls_content container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <header className="cls_header mb-8 text-center">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            hazo_chat
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            A powerful chat component with document viewing and real-time messaging
          </p>
        </header>

        {/* Chat Toggle Button */}
        {!is_chat_open && (<div className="cls_chat_toggle fixed bottom-6 right-6">
            <button_1.Button onClick={handle_open} size="lg" className="rounded-full shadow-lg">
              Open Chat
            </button_1.Button>
          </div>)}

        {/* Chat Component */}
        {is_chat_open && (<div className="cls_chat_container h-[700px] bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden">
            <hazo_chat_1.HazoChat hazo_connect={mock_hazo_connect} hazo_auth={mock_hazo_auth} receiver_user_id={MOCK_OTHER_USER.id} document_save_location="/uploads" reference_id="ref-123" reference_type="chat" additional_references={MOCK_REFERENCES} timezone="Australia/Sydney" title="Chat with Sarah" subtitle="Project Discussion" on_close={handle_close}/>
          </div>)}

        {/* Features Grid */}
        <section className="cls_features mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard title="Document Viewer" description="View PDFs, images, and text files directly in the sidebar. Supports drag-and-drop uploads."/>
          <FeatureCard title="Real-time Messaging" description="Polling-based message updates with configurable intervals. Optimistic UI for instant feedback."/>
          <FeatureCard title="Responsive Design" description="Collapsible sidebar on mobile. Grid layout on desktop. Works in sheets and dialogs."/>
        </section>
      </div>
    </main>);
}
function FeatureCard(_a) {
    var title = _a.title, description = _a.description;
    return (<div className="cls_feature_card p-6 bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-slate-600 dark:text-slate-400 text-sm">
        {description}
      </p>
    </div>);
}
