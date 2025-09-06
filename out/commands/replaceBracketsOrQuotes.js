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
const nls = __importStar(require("vscode-nls"));
const findAllPairs_1 = require("../utils/findAllPairs");
nls.config({ messageFormat: nls.MessageFormat.file })();
const localize = nls.loadMessageBundle();
function replaceBracketsOrQuotes() {
    const editor = vscode.window.activeTextEditor;
    if (!editor)
        return;
    //debug
    // デバッグ用：正しいキーで文字列を取得できるか確認
    console.log(localize("prompt.replaceBracketQuote", "Replace bracket/quote:"));
    const document = editor.document;
    const text = document.getText();
    const pairs = (0, findAllPairs_1.findAllPairs)(text);
    if (pairs.length === 0) {
        vscode.window.showInformationMessage(localize("message.noBrackets", "No brackets or quotes found"));
        return;
    }
    vscode.window
        .showInputBox({
        prompt: localize("prompt.replaceBracketQuote", "Replace bracket/quote:"),
    })
        .then((value) => {
        if (value === undefined)
            return;
        const matchingClose = {
            "(": ")",
            "{": "}",
            "[": "]",
        };
        const edits = [];
        // 各カーソルに対して処理
        editor.selections.forEach((selection) => {
            var _a;
            const cursorOffset = document.offsetAt(selection.active);
            // カーソルの外側で最も近いペアを探す
            const outerPair = pairs
                .filter((p) => p.open <= cursorOffset && p.close >= cursorOffset)
                .sort((a, b) => a.close - a.open - (b.close - b.open))[0];
            if (!outerPair)
                return; // このカーソルはスキップ
            const openChar = value;
            const closeChar = (_a = matchingClose[openChar]) !== null && _a !== void 0 ? _a : value;
            const openPos = document.positionAt(outerPair.open);
            const closePos = document.positionAt(outerPair.close);
            edits.push({
                range: new vscode.Range(openPos, openPos.translate(0, 1)),
                text: openChar,
            });
            edits.push({
                range: new vscode.Range(closePos, closePos.translate(0, 1)),
                text: closeChar,
            });
        });
        if (edits.length === 0) {
            vscode.window.showInformationMessage(localize("message.noOuterBrackets", "No brackets or quotes found outside the cursor"));
            return;
        }
        editor
            .edit((editBuilder) => {
            edits.forEach((e) => editBuilder.replace(e.range, e.text));
        })
            .then(() => {
            // メインカーソル基準でスクロール
            const mainSelection = editor.selection;
            editor.revealRange(new vscode.Range(mainSelection.active, mainSelection.active), vscode.TextEditorRevealType.InCenter);
        });
    });
}
//# sourceMappingURL=replaceBracketsOrQuotes.js.map