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
const findAllPairs_1 = require("../utils/findAllPairs");
let cursorOffsetCache = []; // 各マルチカーソルのオフセット位置を保持 (-1 初期値)
function changeSelection() {
    const editor = vscode.window.activeTextEditor;
    if (!editor)
        return;
    const document = editor.document;
    const text = document.getText();
    const selections = editor.selections; // マルチカーソル対応
    const pairs = (0, findAllPairs_1.findAllPairs)(text);
    if (pairs.length === 0)
        return;
    // cache のサイズを selections に合わせて調整
    if (cursorOffsetCache.length < selections.length) {
        cursorOffsetCache = [
            ...cursorOffsetCache,
            ...Array(selections.length - cursorOffsetCache.length).fill(-1),
        ];
    }
    else if (cursorOffsetCache.length > selections.length) {
        cursorOffsetCache = cursorOffsetCache.slice(0, selections.length);
    }
    const newSelections = selections.map((selection, idx) => {
        const startOffset = document.offsetAt(selection.start);
        const endOffset = document.offsetAt(selection.end);
        // もし範囲選択されていなければ → cache に現在位置を記録
        if (selection.isEmpty) {
            cursorOffsetCache[idx] = startOffset;
        }
        else {
            // 範囲選択されている場合
            if (cursorOffsetCache[idx] === -1) {
                // 初回だけ範囲の先頭を記録
                cursorOffsetCache[idx] = startOffset;
            }
        }
        // 現在の選択範囲を完全に含むペアを抽出
        const containingPairs = pairs
            .filter((p) => p.open <= startOffset && p.close >= endOffset)
            .sort((a, b) => a.close - a.open - (b.close - b.open)); // 内側→外側
        if (containingPairs.length === 0) {
            // ペアが無ければキャッシュに戻る
            if (cursorOffsetCache[idx] !== -1) {
                const pos = document.positionAt(cursorOffsetCache[idx]);
                cursorOffsetCache[idx] = -1;
                return new vscode.Selection(pos, pos);
            }
            return selection;
        }
        const currentRange = { start: startOffset, end: endOffset };
        let nextRange;
        for (let i = 0; i < containingPairs.length; i++) {
            const pair = containingPairs[i];
            const inner = { start: pair.open + 1, end: pair.close };
            const outer = { start: pair.open, end: pair.close + 1 };
            if (currentRange.start === inner.start &&
                currentRange.end === inner.end) {
                nextRange = outer;
                break;
            }
            else if (currentRange.start === outer.start &&
                currentRange.end === outer.end) {
                if (i + 1 < containingPairs.length) {
                    const nextPair = containingPairs[i + 1];
                    nextRange = { start: nextPair.open + 1, end: nextPair.close };
                }
                else {
                    // 最大まで拡大済み → cache に戻る
                    if (cursorOffsetCache[idx] !== -1) {
                        const pos = document.positionAt(cursorOffsetCache[idx]);
                        cursorOffsetCache[idx] = -1;
                        return new vscode.Selection(pos, pos);
                    }
                }
                break;
            }
            else {
                nextRange = inner;
                break;
            }
        }
        if (nextRange) {
            return new vscode.Selection(document.positionAt(nextRange.start), document.positionAt(nextRange.end));
        }
        else {
            // 範囲拡大できない場合 → cache に戻る
            if (cursorOffsetCache[idx] !== -1) {
                const pos = document.positionAt(cursorOffsetCache[idx]);
                cursorOffsetCache[idx] = -1;
                return new vscode.Selection(pos, pos);
            }
            return selection;
        }
    });
    editor.selections = newSelections;
}
//# sourceMappingURL=changeSelection.js.map