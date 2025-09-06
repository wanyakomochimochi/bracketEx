"use strict";
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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.replaceBracketsOrQuotes = replaceBracketsOrQuotes;
const vscode = __importStar(require("vscode"));
function replaceBracketsOrQuotes() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }
    const document = editor.document;
    const selection = editor.selection;
    const position = selection.active;
    const text = document.getText();
    const charBefore = position.character > 0 ? text.charAt(document.offsetAt(position) - 1) : '';
    const charAfter = position.character < text.length ? text.charAt(document.offsetAt(position)) : '';
    const bracketsAndQuotes = ['"', "'", '(', ')', '{', '}', '[', ']'];
    let start = position.character;
    let end = position.character;
    // Find the nearest bracket or quote
    while (start > 0 && bracketsAndQuotes.includes(text.charAt(start - 1))) {
        start--;
    }
    while (end < text.length && bracketsAndQuotes.includes(text.charAt(end))) {
        end++;
    }
    if (start < end) {
        const range = new vscode.Range(document.positionAt(start), document.positionAt(end));
        vscode.window.showInputBox({ prompt: 'Replace with:' }).then(value => {
            if (value !== undefined) {
                editor.edit(editBuilder => {
                    editBuilder.replace(range, value);
                });
            }
        });
    }
}
//# sourceMappingURL=replaceBracketsOrQuotes.js.map