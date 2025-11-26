"use strict";
/**
 * Utility functions for test-app
 *
 * Contains helper functions used across the application.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.cn = cn;
var clsx_1 = require("clsx");
var tailwind_merge_1 = require("tailwind-merge");
/**
 * Merges class names using clsx and tailwind-merge
 *
 * This utility combines the power of clsx for conditional classes
 * with tailwind-merge to properly handle Tailwind CSS class conflicts.
 *
 * @param inputs - Class values to merge
 * @returns Merged class string
 */
function cn() {
    var inputs = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        inputs[_i] = arguments[_i];
    }
    return (0, tailwind_merge_1.twMerge)((0, clsx_1.clsx)(inputs));
}
