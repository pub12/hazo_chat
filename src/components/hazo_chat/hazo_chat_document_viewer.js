/**
 * HazoChatDocumentViewer Component
 *
 * Document preview area supporting:
 * - PDF viewing via hazo_pdf
 * - Image preview (png, jpg, gif, webp)
 * - Text file preview
 * - Download link for unsupported types
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.HazoChatDocumentViewer = HazoChatDocumentViewer;
var react_1 = require("react");
var io5_1 = require("react-icons/io5");
var utils_js_1 = require("../../lib/utils.js");
var constants_js_1 = require("../../lib/constants.js");
var loading_skeleton_js_1 = require("../ui/loading_skeleton.js");
// ============================================================================
// Helper Functions
// ============================================================================
/**
 * Check if file is previewable as image
 */
function is_image(mime_type) {
    if (!mime_type)
        return false;
    return constants_js_1.PREVIEWABLE_TYPES.image.includes(mime_type);
}
/**
 * Check if file is previewable as PDF
 */
function is_pdf(mime_type) {
    if (!mime_type)
        return false;
    return constants_js_1.PREVIEWABLE_TYPES.pdf.includes(mime_type);
}
/**
 * Check if file is previewable as text
 */
function is_text(mime_type) {
    if (!mime_type)
        return false;
    return constants_js_1.PREVIEWABLE_TYPES.text.includes(mime_type);
}
function PdfViewer(_a) {
    var url = _a.url, name = _a.name;
    // Note: In production, this would use hazo_pdf component
    // For now, we use an iframe fallback
    return (<div className="cls_pdf_viewer w-full h-full flex flex-col">
      <iframe src={"".concat(url, "#view=FitH")} title={name} className="w-full flex-1 border-0 rounded-lg" aria-label={"PDF document: ".concat(name)}/>
    </div>);
}
function ImageViewer(_a) {
    var url = _a.url, name = _a.name;
    return (<div className="cls_image_viewer w-full h-full flex items-center justify-center p-4 overflow-auto">
      <img src={url} alt={name} className="max-w-full max-h-full object-contain rounded-lg shadow-sm"/>
    </div>);
}
function TextViewer(_a) {
    var url = _a.url, name = _a.name;
    var _b = react_1.default.useState(null), content = _b[0], set_content = _b[1];
    var _c = react_1.default.useState(true), is_loading = _c[0], set_is_loading = _c[1];
    var _d = react_1.default.useState(null), error = _d[0], set_error = _d[1];
    react_1.default.useEffect(function () {
        function fetch_content() {
            return __awaiter(this, void 0, void 0, function () {
                var response, text, err_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 3, 4, 5]);
                            set_is_loading(true);
                            return [4 /*yield*/, fetch(url)];
                        case 1:
                            response = _a.sent();
                            if (!response.ok)
                                throw new Error('Failed to fetch');
                            return [4 /*yield*/, response.text()];
                        case 2:
                            text = _a.sent();
                            set_content(text);
                            return [3 /*break*/, 5];
                        case 3:
                            err_1 = _a.sent();
                            set_error('Failed to load text content');
                            return [3 /*break*/, 5];
                        case 4:
                            set_is_loading(false);
                            return [7 /*endfinally*/];
                        case 5: return [2 /*return*/];
                    }
                });
            });
        }
        fetch_content();
    }, [url]);
    if (is_loading) {
        return <loading_skeleton_js_1.LoadingSkeleton variant="reference" count={5}/>;
    }
    if (error) {
        return (<div className="cls_text_viewer_error flex items-center justify-center h-full text-muted-foreground">
        {error}
      </div>);
    }
    return (<div className="cls_text_viewer w-full h-full overflow-auto p-4">
      <pre className="text-sm font-mono bg-muted p-4 rounded-lg whitespace-pre-wrap break-words" aria-label={"Text file: ".concat(name)}>
        {content}
      </pre>
    </div>);
}
function DownloadFallback(_a) {
    var url = _a.url, name = _a.name, mime_type = _a.mime_type;
    return (<div className="cls_download_fallback flex flex-col items-center justify-center h-full gap-4 p-4">
      <io5_1.IoDocumentOutline className="w-16 h-16 text-muted-foreground"/>
      <div className="text-center">
        <p className="font-medium text-foreground">{name}</p>
        {mime_type && (<p className="text-sm text-muted-foreground mt-1">{mime_type}</p>)}
      </div>
      <a href={url} download={name} className={(0, utils_js_1.cn)('cls_download_btn', 'flex items-center gap-2 px-4 py-2 rounded-lg', 'bg-primary text-primary-foreground', 'hover:bg-primary/90 transition-colors')}>
        <io5_1.IoDownloadOutline className="w-4 h-4"/>
        Download
      </a>
    </div>);
}
// ============================================================================
// Empty State Component
// ============================================================================
function EmptyState() {
    return (<div className="cls_viewer_empty flex flex-col items-center justify-center h-full gap-2 p-4 text-muted-foreground">
      <io5_1.IoImageOutline className="w-12 h-12 opacity-50"/>
      <p className="text-sm">Select a document to preview</p>
    </div>);
}
// ============================================================================
// Main Component
// ============================================================================
function HazoChatDocumentViewer(_a) {
    var reference = _a.reference, className = _a.className;
    // Determine viewer type based on mime_type
    var viewer_type = (0, react_1.useMemo)(function () {
        if (!reference)
            return 'empty';
        if (is_pdf(reference.mime_type))
            return 'pdf';
        if (is_image(reference.mime_type))
            return 'image';
        if (is_text(reference.mime_type))
            return 'text';
        return 'download';
    }, [reference]);
    return (<div className={(0, utils_js_1.cn)('cls_hazo_chat_document_viewer', 'flex-1 bg-muted/30 rounded-lg overflow-hidden', className)} role="region" aria-label="Document viewer">
      {viewer_type === 'empty' && <EmptyState />}

      {viewer_type === 'pdf' && reference && (<PdfViewer url={reference.url} name={reference.name}/>)}

      {viewer_type === 'image' && reference && (<ImageViewer url={reference.url} name={reference.name}/>)}

      {viewer_type === 'text' && reference && (<TextViewer url={reference.url} name={reference.name}/>)}

      {viewer_type === 'download' && reference && (<DownloadFallback url={reference.url} name={reference.name} mime_type={reference.mime_type}/>)}
    </div>);
}
HazoChatDocumentViewer.displayName = 'HazoChatDocumentViewer';
