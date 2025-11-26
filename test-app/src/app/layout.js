"use strict";
/**
 * Root Layout for test-app
 *
 * Provides the base HTML structure, fonts, and global providers.
 * Uses Inter font (shadcn standard alternative).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.metadata = void 0;
exports.default = RootLayout;
var google_1 = require("next/font/google");
var sonner_1 = require("sonner");
require("./globals.css");
// Inter - shadcn standard font
var inter = (0, google_1.Inter)({
    subsets: ['latin'],
    variable: '--font-sans',
    display: 'swap',
});
// JetBrains Mono - for code/monospace
var jetbrains_mono = (0, google_1.JetBrains_Mono)({
    subsets: ['latin'],
    variable: '--font-mono',
    display: 'swap',
});
exports.metadata = {
    title: 'hazo_chat Test App',
    description: 'Testing environment for the hazo_chat component library',
};
function RootLayout(_a) {
    var children = _a.children;
    return (<html lang="en" className={"".concat(inter.variable, " ").concat(jetbrains_mono.variable)}>
      <body className="font-sans antialiased">
        {children}
        <sonner_1.Toaster position="top-right" richColors/>
      </body>
    </html>);
}
