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
const voidElements = new Set([
    "area", "base", "br", "col", "embed", "hr", "img", "input", "link",
    "meta", "param", "source", "track", "wbr"
]);
/**
 * HTMLをツリー構造にパース
 */
function parseHtmlToTree(text) {
    const root = { tag: 'root', start: 0, end: text.length - 1, children: [] };
    const stack = [root];
    const tagRegex = /<\/?([a-zA-Z0-9-]+)(\s[^<>]*?)?(\/?)>/g;
    let match;
    while ((match = tagRegex.exec(text)) !== null) {
        const [full, tagName, _attrs, selfClose] = match;
        const start = match.index;
        const end = match.index + full.length - 1;
        const parent = stack[stack.length - 1];
        if (full.startsWith("</")) {
            // 閉じタグ
            for (let i = stack.length - 1; i >= 0; i--) {
                if (stack[i].tag === tagName) {
                    const node = stack[i];
                    node.end = end;
                    stack.splice(i);
                    break;
                }
            }
        }
        else {
            // 開始タグ or 自己完結
            const node = { tag: tagName, start, end, children: [], parent };
            parent.children.push(node);
            if (selfClose === "/" || voidElements.has(tagName.toLowerCase())) {
                // 自己完結タグ（閉じなくてもOK）
                node.end = end;
            }
            else {
                stack.push(node);
            }
        }
    }
    return root.children;
}
/**
 * 再帰的に範囲を含むペアを収集
 */
function collectPairs(node, pairs) {
    if (node.tag !== "root") {
        pairs.push({ open: node.start, close: node.end, type: node.tag });
    }
    for (const child of node.children) {
        collectPairs(child, pairs);
    }
}
/**
 * 選択範囲を変更するコマンド
 */
function changeSelection() {
    const editor = vscode.window.activeTextEditor;
    if (!editor)
        return;
    const document = editor.document;
    const text = document.getText();
    const selections = editor.selections;
    const isHtml = document.languageId === "html";
    let pairs = [];
    if (isHtml) {
        const roots = parseHtmlToTree(text);
        for (const root of roots) {
            collectPairs(root, pairs);
        }
    }
    else {
        pairs = findAllPairs(text);
    }
    if (pairs.length === 0)
        return;
    const newSelections = selections.map((selection) => {
        const startOffset = document.offsetAt(selection.start);
        const endOffset = document.offsetAt(selection.end);
        // 内側から外側にソート
        const containingPairs = pairs
            .filter((p) => p.open <= startOffset && p.close >= endOffset)
            .sort((a, b) => (a.close - a.open) - (b.close - b.open));
        if (containingPairs.length === 0)
            return selection;
        const currentRange = { start: startOffset, end: endOffset };
        let nextRange;
        for (let i = 0; i < containingPairs.length; i++) {
            const pair = containingPairs[i];
            if (isHtml && pair.type !== "selfclose") {
                // タグ内テキスト範囲
                const openTagMatch = text.slice(pair.open, pair.close + 1).match(/^<[^>]+>/);
                const closeTagMatch = text.slice(pair.open, pair.close + 1).match(/<\/[^>]+>$/);
                const textContentStart = pair.open + (openTagMatch ? openTagMatch[0].length : 0);
                const textContentEnd = pair.close - (closeTagMatch ? closeTagMatch[0].length : 0);
                const innerText = { start: textContentStart, end: textContentEnd };
                const outerTag = { start: pair.open, end: pair.close + 1 };
                if (currentRange.start === innerText.start && currentRange.end === innerText.end) {
                    nextRange = outerTag;
                    break;
                }
                else if (currentRange.start === outerTag.start && currentRange.end === outerTag.end) {
                    if (i + 1 < containingPairs.length) {
                        const nextPair = containingPairs[i + 1];
                        nextRange = { start: nextPair.open, end: nextPair.close + 1 };
                    }
                    break;
                }
                else {
                    nextRange = innerText;
                    break;
                }
            }
            else {
                // 通常の括弧・クォート
                const inner = { start: pair.open + 1, end: pair.close };
                const outer = { start: pair.open, end: pair.close + 1 };
                if (currentRange.start === inner.start && currentRange.end === inner.end) {
                    nextRange = outer;
                    break;
                }
                else if (currentRange.start === outer.start && currentRange.end === outer.end) {
                    if (i + 1 < containingPairs.length) {
                        const nextPair = containingPairs[i + 1];
                        nextRange = { start: nextPair.open + 1, end: nextPair.close };
                    }
                    break;
                }
                else {
                    nextRange = inner;
                    break;
                }
            }
        }
        if (nextRange) {
            return new vscode.Selection(document.positionAt(nextRange.start), document.positionAt(nextRange.end));
        }
        else {
            return selection;
        }
    });
    editor.selections = newSelections;
}
/**
 * 通常の括弧・クォートペアを全文から取得
 */
function findAllPairs(text) {
    const stack = [];
    const pairs = [];
    const map = { "(": ")", "{": "}", "[": "]" };
    const quoteChars = ['"', "'", "`"];
    let inQuote = null;
    let quoteStart = -1;
    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (quoteChars.includes(ch)) {
            if (inQuote === null) {
                inQuote = ch;
                quoteStart = i;
            }
            else if (inQuote === ch) {
                pairs.push({ open: quoteStart, close: i, type: ch });
                inQuote = null;
            }
            continue;
        }
        if (inQuote)
            continue;
        if (map[ch]) {
            stack.push({ char: ch, pos: i });
        }
        else if (Object.values(map).includes(ch)) {
            for (let j = stack.length - 1; j >= 0; j--) {
                if (map[stack[j].char] === ch) {
                    const open = stack[j];
                    pairs.push({ open: open.pos, close: i, type: open.char });
                    stack.splice(j, 1);
                    break;
                }
            }
        }
    }
    return pairs;
}
//# sourceMappingURL=changeSelection.js.map