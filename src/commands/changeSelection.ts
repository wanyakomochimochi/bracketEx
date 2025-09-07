import * as vscode from "vscode";

import { findAllPairs } from "../utils/findAllPairs";

interface HtmlNode {
  tag: string;
  start: number;
  end: number;
  children: HtmlNode[];
  parent?: HtmlNode;
}

interface Pair {
  open: number;
  close: number;
  type: string;
}

const voidElements = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

// --- グローバルキャッシュ ---
const parsedCache = new Map<string, { version: number; root: HtmlNode }>();

/**
 * HTMLをツリー構造にパース
 */
function parseHtmlToTree(text: string): HtmlNode {
  const root: HtmlNode = {
    tag: "root",
    start: 0,
    end: text.length - 1,
    children: [],
  };
  const stack: HtmlNode[] = [root];
  const tagRegex = /<\/?([a-zA-Z0-9-]+)(\s[^<>]*?)?(\/?)>/g;
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(text)) !== null) {
    const [full, tagName, attrText, selfClose] = match;
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
    } else {
      // 開始タグ or 自己完結タグ
      const node: HtmlNode = { tag: tagName, start, end, children: [], parent };
      parent.children.push(node);

      if (selfClose === "/" || voidElements.has(tagName.toLowerCase())) {
        node.end = end;
      } else {
        stack.push(node);
      }
    }
  }

  return root;
}

/**
 * キャッシュを利用してパース結果を取得
 */
function getParsedTree(document: vscode.TextDocument): HtmlNode[] {
  const key = document.uri.toString();
  const cached = parsedCache.get(key);

  if (cached && cached.version === document.version) {
    return cached.root.children; // 変更なし → キャッシュ利用
  }

  // 変更あり → 再パース
  const text = document.getText();
  const root = parseHtmlToTree(text);
  parsedCache.set(key, { version: document.version, root });
  return root.children; // 常に children を返す
}

/**
 * 再帰的に範囲を含むペアを収集
 * - タグ本体
 * - 属性値（値部分と属性全体）
 */
function collectPairs(node: HtmlNode, pairs: Pair[], text: string) {
  if (node.tag !== "root") {
    pairs.push({ open: node.start, close: node.end, type: node.tag });

    // 属性処理
    const tagText = text.slice(node.start, node.end + 1);
    const openTagMatch = tagText.match(/^<[^>]+>/);
    if (openTagMatch) {
      const openTagText = openTagMatch[0];
      const attrRegex = /([^\s=]+)\s*=\s*("([^"]*)"|'([^']*)')/g;
      let m: RegExpExecArray | null;
      let pushedOpenTag = false; // 1回だけ push するフラグ

      while ((m = attrRegex.exec(openTagText)) !== null) {
        const attrName = m[1];
        const fullMatch = m[0];
        const quoteChar = m[2][0];
        const attrValue = m[3] ?? m[4];

        const fullStart = node.start + m.index;
        const fullEnd = fullStart + fullMatch.length;

        const valueStart = fullStart + fullMatch.indexOf(quoteChar) + 1;
        const valueEnd = valueStart + attrValue.length;

        // 値部分
        pairs.push({ open: valueStart, close: valueEnd, type: "attrValue" });
        // 属性全体
        pairs.push({ open: fullStart, close: fullEnd, type: "attr" });

        // 開始タグ全体は1回だけ
        if (!pushedOpenTag) {
          pairs.push({
            open: node.start,
            close: node.start + openTagText.length,
            type: "openTag",
          });
          pushedOpenTag = true;
        }
      }
    }
  }

  for (const child of node.children) {
    collectPairs(child, pairs, text);
  }
}

/**
 * 選択範囲を変更するコマンド
 */
export function changeSelection() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  const document = editor.document;
  const isHtml =
    document.languageId === "html" ||
    document.languageId === "htm" ||
    document.languageId === "xml";

  if (isHtml) {
    changeSelectionHtml();
  } else {
    changeSelectionNoHtml();
  }
}

let cursorOffsetCacheHtml: number[] = []; // HTML用キャッシュ

function changeSelectionHtml() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  const document = editor.document;
  const text = document.getText();
  const selections = editor.selections;

  let pairs: Pair[] = [];
  const roots = getParsedTree(document);
  for (const root of roots) {
    collectPairs(root, pairs, text);
  }

  if (pairs.length === 0) return;

  // cache のサイズを selections に合わせて調整
  if (cursorOffsetCacheHtml.length < selections.length) {
    cursorOffsetCacheHtml = [
      ...cursorOffsetCacheHtml,
      ...Array(selections.length - cursorOffsetCacheHtml.length).fill(-1),
    ];
  } else if (cursorOffsetCacheHtml.length > selections.length) {
    cursorOffsetCacheHtml = cursorOffsetCacheHtml.slice(0, selections.length);
  }

  const newSelections = selections.map((selection, idx) => {
    const startOffset = document.offsetAt(selection.start);
    const endOffset = document.offsetAt(selection.end);

    // 範囲選択されていない場合 → 現在のカーソル位置を記録
    if (selection.isEmpty) {
      cursorOffsetCacheHtml[idx] = startOffset;
    } else {
      // 範囲選択されていて cache が未設定なら範囲先頭を記録
      if (cursorOffsetCacheHtml[idx] === -1) {
        cursorOffsetCacheHtml[idx] = startOffset;
      }
    }

    const containingPairs = pairs
      .filter((p) => p.open <= startOffset && p.close >= endOffset)
      .sort((a, b) => a.close - a.open - (b.close - b.open));

    if (containingPairs.length === 0) {
      // ペアが見つからなければ cache に戻す
      if (cursorOffsetCacheHtml[idx] !== -1) {
        const pos = document.positionAt(cursorOffsetCacheHtml[idx]);
        cursorOffsetCacheHtml[idx] = -1;
        return new vscode.Selection(pos, pos);
      }
      return selection;
    }

    const currentRange = { start: startOffset, end: endOffset };
    let nextRange: { start: number; end: number } | undefined;

    for (let i = 0; i < containingPairs.length; i++) {
      const pair = containingPairs[i];

      if (pair.type === "attrValue") {
        // 値 → 属性全体
        if (
          currentRange.start === pair.open &&
          currentRange.end === pair.close
        ) {
          const attrPair = containingPairs.find(
            (p) =>
              p.type === "attr" && p.open <= pair.open && p.close >= pair.close
          );
          if (attrPair)
            nextRange = { start: attrPair.open, end: attrPair.close };
        } else {
          nextRange = { start: pair.open, end: pair.close };
        }
        break;
      } else if (pair.type === "attr") {
        // 属性全体 → 開始タグ
        if (
          currentRange.start === pair.open &&
          currentRange.end === pair.close
        ) {
          const tagPair = containingPairs.find(
            (p) =>
              p.type === "openTag" &&
              p.open <= pair.open &&
              p.close >= pair.close
          );
          if (tagPair) nextRange = { start: tagPair.open, end: tagPair.close };
        } else {
          nextRange = { start: pair.open, end: pair.close };
        }
        break;
      } else if (pair.type === "openTag") {
        // 開始タグ → タグ全体
        const tagPair = containingPairs.find(
          (p) => !["attr", "attrValue", "openTag"].includes(p.type)
        );
        if (tagPair)
          nextRange = { start: tagPair.open, end: tagPair.close + 1 };
        break;
      } else {
        // タグの内側テキスト → タグ全体
        const openGt = text.indexOf(">", pair.open);
        const closeLt = text.lastIndexOf("<", pair.close);
        if (openGt !== -1 && closeLt !== -1 && openGt + 1 <= closeLt) {
          const innerText = { start: openGt + 1, end: closeLt };
          const outerTag = { start: pair.open, end: pair.close + 1 };

          if (
            currentRange.start === innerText.start &&
            currentRange.end === innerText.end
          ) {
            nextRange = outerTag;
          } else if (
            currentRange.start === outerTag.start &&
            currentRange.end === outerTag.end
          ) {
            if (i + 1 < containingPairs.length) {
              const nextPair = containingPairs[i + 1];
              nextRange = { start: nextPair.open, end: nextPair.close + 1 };
            } else {
              // 最大まで拡大済み → cache に戻す
              if (cursorOffsetCacheHtml[idx] !== -1) {
                const pos = document.positionAt(cursorOffsetCacheHtml[idx]);
                cursorOffsetCacheHtml[idx] = -1;
                return new vscode.Selection(pos, pos);
              }
            }
          } else {
            nextRange = innerText;
          }
          break;
        }
      }
    }

    if (nextRange) {
      return new vscode.Selection(
        document.positionAt(nextRange.start),
        document.positionAt(nextRange.end)
      );
    } else {
      // 範囲拡大できなければ cache に戻す
      if (cursorOffsetCacheHtml[idx] !== -1) {
        const pos = document.positionAt(cursorOffsetCacheHtml[idx]);
        cursorOffsetCacheHtml[idx] = -1;
        return new vscode.Selection(pos, pos);
      }
      return selection;
    }
  });

  editor.selections = newSelections;
}

let cursorOffsetCache: number[] = []; // 各マルチカーソルのオフセット位置を保持 (-1 初期値)

function changeSelectionNoHtml() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  const document = editor.document;
  const text = document.getText();
  const selections = editor.selections; // マルチカーソル対応

  const pairs = findAllPairs(text);
  if (pairs.length === 0) return;

  // cache のサイズを selections に合わせて調整
  if (cursorOffsetCache.length < selections.length) {
    cursorOffsetCache = [
      ...cursorOffsetCache,
      ...Array(selections.length - cursorOffsetCache.length).fill(-1),
    ];
  } else if (cursorOffsetCache.length > selections.length) {
    cursorOffsetCache = cursorOffsetCache.slice(0, selections.length);
  }

  const newSelections = selections.map((selection, idx) => {
    const startOffset = document.offsetAt(selection.start);
    const endOffset = document.offsetAt(selection.end);

    // もし範囲選択されていなければ → cache に現在位置を記録
    if (selection.isEmpty) {
      cursorOffsetCache[idx] = startOffset;
    } else {
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
    let nextRange: { start: number; end: number } | undefined;

    for (let i = 0; i < containingPairs.length; i++) {
      const pair = containingPairs[i];
      const inner = { start: pair.open + 1, end: pair.close };
      const outer = { start: pair.open, end: pair.close + 1 };

      if (
        currentRange.start === inner.start &&
        currentRange.end === inner.end
      ) {
        nextRange = outer;
        break;
      } else if (
        currentRange.start === outer.start &&
        currentRange.end === outer.end
      ) {
        if (i + 1 < containingPairs.length) {
          const nextPair = containingPairs[i + 1];
          nextRange = { start: nextPair.open + 1, end: nextPair.close };
        } else {
          // 最大まで拡大済み → cache に戻る
          if (cursorOffsetCache[idx] !== -1) {
            const pos = document.positionAt(cursorOffsetCache[idx]);
            cursorOffsetCache[idx] = -1;
            return new vscode.Selection(pos, pos);
          }
        }
        break;
      } else {
        nextRange = inner;
        break;
      }
    }

    if (nextRange) {
      return new vscode.Selection(
        document.positionAt(nextRange.start),
        document.positionAt(nextRange.end)
      );
    } else {
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
