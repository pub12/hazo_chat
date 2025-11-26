/**
 * Button Component (shadcn/ui style)
 *
 * A versatile button component with multiple variants and sizes.
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
exports.button_variants = exports.Button = void 0;
var React = require("react");
var react_slot_1 = require("@radix-ui/react-slot");
var class_variance_authority_1 = require("class-variance-authority");
var utils_js_1 = require("../../lib/utils.js");
// ============================================================================
// Button Variants
// ============================================================================
var button_variants = (0, class_variance_authority_1.cva)('inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0', {
    variants: {
        variant: {
            default: 'bg-primary text-primary-foreground hover:bg-primary/90',
            destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
            outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
            secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
            ghost: 'hover:bg-accent hover:text-accent-foreground',
            link: 'text-primary underline-offset-4 hover:underline',
        },
        size: {
            default: 'h-10 px-4 py-2',
            sm: 'h-9 rounded-md px-3',
            lg: 'h-11 rounded-md px-8',
            icon: 'h-10 w-10',
        },
    },
    defaultVariants: {
        variant: 'default',
        size: 'default',
    },
});
exports.button_variants = button_variants;
// ============================================================================
// Component
// ============================================================================
var Button = React.forwardRef(function (_a, ref) {
    var className = _a.className, variant = _a.variant, size = _a.size, _b = _a.as_child, as_child = _b === void 0 ? false : _b, props = __rest(_a, ["className", "variant", "size", "as_child"]);
    var Comp = as_child ? react_slot_1.Slot : 'button';
    return (<Comp className={(0, utils_js_1.cn)(button_variants({ variant: variant, size: size, className: className }))} ref={ref} {...props}/>);
});
exports.Button = Button;
Button.displayName = 'Button';
