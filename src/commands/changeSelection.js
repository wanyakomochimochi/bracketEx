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
exports.changeSelection = changeSelection;
const vscode = __importStar(require("vscode"));
function changeSelection() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }
    const document = editor.document;
    const position = editor.selection.active;
    // Get the text around the cursor
    const textBefore = document.getText(new vscode.Range(new vscode.Position(position.line, 0), position));
    const textAfter = document.getText(new vscode.Range(position, new vscode.Position(position.line, document.lineAt(position.line).text.length)));
    // Find the nearest opening and closing brackets or quotes
    const openingChars = ['(', '{', '[', '"', "'"];
    const closingChars = [')', '}', ']', '"', "'"];
    const openingIndex = Math.max(...openingChars.map(char => textBefore.lastIndexOf(char)).filter(index => index !== -1));
    const closingIndex = Math.min(...closingChars.map(char => textAfter.indexOf(char)).filter(index => index !== -1).map(index => index + position.character));
    if (openingIndex === -1 || closingIndex === -1 || closingIndex <= openingIndex) {
        return; // No valid selection found
    }
    const newSelection = new vscode.Selection(position.line, openingIndex + 1, position.line, closingIndex);
    editor.selection = newSelection;
}
//# sourceMappingURL=changeSelection.js.map