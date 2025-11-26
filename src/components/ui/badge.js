/**
 * Badge Component (shadcn/ui style)
 *
 * A badge component for status indicators and labels.
 * Uses class-variance-authority for variant management.
 */
'use client';
"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.badge_variants = void 0;
exports.Badge = Badge;
var React = require("react");
var class_variance_authority_1 = require("class-variance-authority");
var utils_js_1 = require("../../lib/utils.js");
// ============================================================================
// Badge Variants
// ============================================================================
var badge_variants = (0, class_variance_authority_1.cva)('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2', {
    variants: {
        variant: {
            default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
            secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
            destructive: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
            outline: 'text-foreground',
            success: 'border-transparent bg-green-500 text-white hover:bg-green-600',
            warning: 'border-transparent bg-yellow-500 text-white hover:bg-yellow-600',
        },
    },
    defaultVariants: {
        variant: 'default',
    },
});
exports.badge_variants = badge_variants;
// ============================================================================
// Component
// ============================================================================
function Badge(_a) {
    var className = _a.className, variant = _a.variant, props = __rest(_a, ["className", "variant"]);
    return (<div className={(0, utils_js_1.cn)(badge_variants({ variant: variant }), className)} {...props}/>);
}
