import * as vscode from "vscode";

import { findAllPairs } from "../utils/findAllPairs";

let cursorOffsetCache: number[] = []; // 各マルチカーソルのオフセット位置を保持 (-1 初期値)

export function changeSelection() {
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
