"use strict";
/**
 * hazo_chat - Main package entry point
 *
 * This is the main entry file for the hazo_chat npm package.
 * It exports all components, hooks, utilities, and types.
 *
 * IMPORTANT: All export paths must use explicit .js extensions for ES module compatibility.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
// Components
__exportStar(require("./components/index.js"), exports);
// Hooks
__exportStar(require("./hooks/index.js"), exports);
// Library utilities
__exportStar(require("./lib/index.js"), exports);
// Types
__exportStar(require("./types/index.js"), exports);
