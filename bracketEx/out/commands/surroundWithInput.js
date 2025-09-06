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
exports.surroundWithInput = surroundWithInput;
const vscode = __importStar(require("vscode"));
function surroundWithInput() {
    const editor = vscode.window.activeTextEditor;
    if (!editor)
        return;
    const document = editor.document;
    vscode.window.showInputBox({ prompt: '文字列で囲む:' }).then(value => {
        var _a;
        if (!value || value.length === 0)
            return;
        const matchingClose = { '(': ')', '{': '}', '[': ']', '"': '"', "'": "'", '`': '`', '<': '>' };
        const openChar = value;
        const closeChar = (_a = matchingClose[openChar]) !== null && _a !== void 0 ? _a : openChar;
        const edits = [];
        editor.selections.forEach(selection => {
            let startPos;
            let endPos;
            if (selection.isEmpty) {
                const wordRange = document.getWordRangeAtPosition(selection.active);
                if (!wordRange)
                    return; // このカーソルはスキップ
                startPos = wordRange.start;
                endPos = wordRange.end;
            }
            else {
                startPos = selection.start;
                endPos = selection.end;
            }
            edits.push({ start: startPos, end: endPos });
        });
        if (edits.length === 0) {
            vscode.window.showInformationMessage('囲む対象が見つかりません');
            return;
        }
        editor.edit(editBuilder => {
            // 文字挿入は後ろから前に行うとオフセット崩れ防止
            edits
                .sort((a, b) => document.offsetAt(b.start) - document.offsetAt(a.start))
                .forEach(e => {
                editBuilder.insert(e.start, openChar);
                editBuilder.insert(e.end, closeChar);
            });
        });
    });
}
//# sourceMappingURL=surroundWithInput.js.map