/**
 * LoadingSkeleton Component
 *
 * Pre-built loading skeleton layouts for the chat interface.
 * Uses the shadcn-style Skeleton component.
 */
'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoadingSkeleton = LoadingSkeleton;
var React = require("react");
var utils_js_1 = require("../../lib/utils.js");
var skeleton_js_1 = require("./skeleton.js");
// ============================================================================
// Component
// ============================================================================
function LoadingSkeleton(_a) {
    var _b = _a.count, count = _b === void 0 ? 3 : _b, className = _a.className, _c = _a.variant, variant = _c === void 0 ? 'message' : _c;
    var render_skeleton = function () {
        switch (variant) {
            case 'message':
                return (<>
            {Array.from({ length: count }).map(function (_, index) { return (<div key={index} className={(0, utils_js_1.cn)('cls_skeleton_message flex gap-2 mb-4', index % 2 === 0 ? 'justify-start' : 'justify-end')}>
                {index % 2 === 0 && (<skeleton_js_1.Skeleton className="h-8 w-8 rounded-full"/>)}
                <div className="space-y-2">
                  <skeleton_js_1.Skeleton className="h-4 w-[200px]"/>
                  <skeleton_js_1.Skeleton className="h-4 w-[150px]"/>
                </div>
                {index % 2 !== 0 && (<skeleton_js_1.Skeleton className="h-8 w-8 rounded-full"/>)}
              </div>); })}
          </>);
            case 'reference':
                return (<>
            {Array.from({ length: count }).map(function (_, index) { return (<div key={index} className="cls_skeleton_reference flex items-center gap-2 p-2">
                <skeleton_js_1.Skeleton className="h-6 w-6 rounded"/>
                <skeleton_js_1.Skeleton className="h-4 w-[100px]"/>
              </div>); })}
          </>);
            case 'profile':
                return (<div className="cls_skeleton_profile flex items-center gap-3">
            <skeleton_js_1.Skeleton className="h-10 w-10 rounded-full"/>
            <div className="space-y-2">
              <skeleton_js_1.Skeleton className="h-4 w-[120px]"/>
              <skeleton_js_1.Skeleton className="h-3 w-[80px]"/>
            </div>
          </div>);
            default:
                return null;
        }
    };
    return (<div className={(0, utils_js_1.cn)('cls_loading_skeleton', className)}>
      {render_skeleton()}
    </div>);
}
LoadingSkeleton.displayName = 'LoadingSkeleton';
