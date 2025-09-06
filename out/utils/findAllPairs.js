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
exports.findAllPairs = findAllPairs;
const vscode = __importStar(require("vscode"));
/**
 * 括弧・クォートペアを全文から取得（正規表現とコメント内は無視）
 */
function findAllPairs(text) {
    var _a;
    const stack = [];
    const pairs = [];
    const map = { "(": ")", "{": "}", "[": "]" };
    const quoteChars = ['"', "'"];
    const ext = ((_a = vscode.window.activeTextEditor) === null || _a === void 0 ? void 0 : _a.document.languageId) || "";
    const regexRanges = findRegexRanges(text);
    const commentRanges = findCommentRanges(text, ext);
    const ignoreRanges = [...regexRanges, ...commentRanges];
    let inQuote = null;
    let quoteStart = -1;
    for (let i = 0; i < text.length; i++) {
        if (isInRanges(i, ignoreRanges))
            continue; // 正規表現やコメント内は無視
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
            continue; // クォート内は括弧無視()
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
function isInRanges(index, ranges) {
    return ranges.some((r) => index >= r.start && index <= r.end);
}
/**
 * 正規表現リテラル範囲を検出{}
 */
function findRegexRanges(text) {
    const ranges = [];
    let inRegex = false;
    let start = -1;
    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (!inRegex && ch === "/") {
            const prev = text[i - 1];
            if (!prev || /\s|[\(\{;\n]/.test(prev)) {
                inRegex = true;
                start = i;
                continue;
            }
        }
        else if (inRegex && ch === "/" && text[i - 1] !== "\\") {
            ranges.push({ start, end: i });
            inRegex = false;
        }
    }
    return ranges;
}
function findCommentRanges(text, ext) {
    const ranges = [];
    const patterns = [];
    // --- ext を正規化（".ts", "path/to/file.ts", "TS" にも対応） ---
    let e = (ext || "").toString().trim().toLowerCase();
    // パスが渡されている場合はファイル名を取り出す
    e = e.replace(/^.*[\\/]/, "");
    // file.ts の形式なら拡張子のみ取り出す
    if (e.includes(".")) {
        e = e.split(".").pop() || e;
    }
    // 先頭ドットを削る
    if (e.startsWith("."))
        e = e.slice(1);
    switch (e) {
        case "js":
        case "ts":
        case "java":
        case "c":
        case "cpp":
        case "cs":
            patterns.push(/\/\/.*/g); // 行コメント
            patterns.push(/\/\*[\s\S]*?\*\//g); // ブロックコメント
            break;
        case "py":
        case "rb":
            patterns.push(/#.*$/gm); // 行コメント
            patterns.push(/('{3}|"{3})[\s\S]*?\1/gm); // 複数行文字列コメント
            break;
        case "html":
        case "xml":
            patterns.push(/<!--[\s\S]*?-->/g); // コメント
            break;
        default:
            return ranges; // 未対応言語は空
    }
    for (const pattern of patterns) {
        // グローバル RegExp の状態をリセット（重要）
        pattern.lastIndex = 0;
        let m;
        while ((m = pattern.exec(text)) !== null) {
            ranges.push({ start: m.index, end: m.index + m[0].length - 1 });
            // 安全策: 万が一ゼロ長マッチが発生したら infinite loop を避ける
            if (m[0].length === 0)
                pattern.lastIndex++;
        }
    }
    // ソートして重複/隣接範囲をマージして返す
    ranges.sort((a, b) => a.start - b.start);
    const merged = [];
    for (const r of ranges) {
        if (!merged.length)
            merged.push(Object.assign({}, r));
        else {
            const last = merged[merged.length - 1];
            if (r.start <= last.end + 1) {
                last.end = Math.max(last.end, r.end);
            }
            else
                merged.push(Object.assign({}, r));
        }
    }
    return merged;
}
//# sourceMappingURL=findAllPairs.js.map