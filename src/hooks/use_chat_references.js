/**
 * useChatReferences Hook
 *
 * Manages chat references with:
 * - Aggregating references from messages and props
 * - Selection state management
 * - Finding source message for a reference
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.useChatReferences = useChatReferences;
var react_1 = require("react");
// ============================================================================
// Hook Implementation
// ============================================================================
function useChatReferences(_a) {
    var messages = _a.messages, _b = _a.initial_references, initial_references = _b === void 0 ? [] : _b, on_selection_change = _a.on_selection_change;
    // -------------------------------------------------------------------------
    // State
    // -------------------------------------------------------------------------
    var _c = (0, react_1.useState)(null), selected_reference = _c[0], set_selected_reference_state = _c[1];
    // -------------------------------------------------------------------------
    // Aggregate all references
    // -------------------------------------------------------------------------
    var references = (0, react_1.useMemo)(function () {
        var reference_map = new Map();
        // Add initial references (from props)
        initial_references.forEach(function (ref) {
            var chat_ref = __assign(__assign({}, ref), { scope: ref.scope || 'field' });
            reference_map.set(ref.id, chat_ref);
        });
        // Add references from messages
        messages.forEach(function (message) {
            if (message.reference_list && Array.isArray(message.reference_list)) {
                message.reference_list.forEach(function (ref) {
                    // Update scope to 'chat' and add message_id
                    var existing = reference_map.get(ref.id);
                    if (existing) {
                        // If reference already exists, it's now in both chat and field
                        reference_map.set(ref.id, __assign(__assign({}, existing), { message_id: message.id }));
                    }
                    else {
                        reference_map.set(ref.id, __assign(__assign({}, ref), { scope: 'chat', message_id: message.id }));
                    }
                });
            }
        });
        return Array.from(reference_map.values());
    }, [messages, initial_references]);
    // -------------------------------------------------------------------------
    // Message lookup for references
    // -------------------------------------------------------------------------
    var reference_to_message_map = (0, react_1.useMemo)(function () {
        var map = new Map();
        messages.forEach(function (message) {
            if (message.reference_list && Array.isArray(message.reference_list)) {
                message.reference_list.forEach(function (ref) {
                    // Store the first message that contains this reference
                    if (!map.has(ref.id)) {
                        map.set(ref.id, message.id);
                    }
                });
            }
        });
        return map;
    }, [messages]);
    // -------------------------------------------------------------------------
    // Select reference
    // -------------------------------------------------------------------------
    var select_reference = (0, react_1.useCallback)(function (reference) {
        // If same reference, toggle off
        if ((selected_reference === null || selected_reference === void 0 ? void 0 : selected_reference.id) === reference.id) {
            set_selected_reference_state(null);
            on_selection_change === null || on_selection_change === void 0 ? void 0 : on_selection_change(null);
            return;
        }
        // Ensure message_id is set if available
        var ref_with_message = __assign(__assign({}, reference), { message_id: reference.message_id || reference_to_message_map.get(reference.id) });
        set_selected_reference_state(ref_with_message);
        on_selection_change === null || on_selection_change === void 0 ? void 0 : on_selection_change(ref_with_message);
    }, [selected_reference, reference_to_message_map, on_selection_change]);
    // -------------------------------------------------------------------------
    // Clear selection
    // -------------------------------------------------------------------------
    var clear_selection = (0, react_1.useCallback)(function () {
        set_selected_reference_state(null);
        on_selection_change === null || on_selection_change === void 0 ? void 0 : on_selection_change(null);
    }, [on_selection_change]);
    // -------------------------------------------------------------------------
    // Add new reference
    // -------------------------------------------------------------------------
    var add_reference = (0, react_1.useCallback)(function (reference) {
        // This is typically handled by the context or parent component
        // Here we just select the newly added reference
        select_reference(reference);
    }, [select_reference]);
    // -------------------------------------------------------------------------
    // Get message ID for reference
    // -------------------------------------------------------------------------
    var get_message_for_reference = (0, react_1.useCallback)(function (reference_id) {
        return reference_to_message_map.get(reference_id) || null;
    }, [reference_to_message_map]);
    // -------------------------------------------------------------------------
    // Clear selection if selected reference is removed
    // -------------------------------------------------------------------------
    (0, react_1.useEffect)(function () {
        if (selected_reference && !references.some(function (r) { return r.id === selected_reference.id; })) {
            set_selected_reference_state(null);
        }
    }, [references, selected_reference]);
    // -------------------------------------------------------------------------
    // Return
    // -------------------------------------------------------------------------
    return {
        references: references,
        selected_reference: selected_reference,
        select_reference: select_reference,
        clear_selection: clear_selection,
        add_reference: add_reference,
        get_message_for_reference: get_message_for_reference
    };
}
