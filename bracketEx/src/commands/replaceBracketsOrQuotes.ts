import * as vscode from "vscode";

import { findAllPairs } from "../utils/findAllPairs";

export function replaceBracketsOrQuotes() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  const document = editor.document;
  const text = document.getText();
  const pairs = findAllPairs(text);

  if (pairs.length === 0) {
    vscode.window.showInformationMessage("括弧・クォートが見つかりません");
    return;
  }

  vscode.window
    .showInputBox({ prompt: "Replace bracket/quote:" })
    .then((value) => {
      if (value === undefined) return;

      const matchingClose: Record<string, string> = {
        "(": ")",
        "{": "}",
        "[": "]",
      };
      const edits: { range: vscode.Range; text: string }[] = [];

      // 各カーソルに対して処理
      editor.selections.forEach((selection) => {
        const cursorOffset = document.offsetAt(selection.active);

        // カーソルの外側で最も近いペアを探す
        const outerPair = pairs
          .filter((p) => p.open <= cursorOffset && p.close >= cursorOffset)
          .sort((a, b) => a.close - a.open - (b.close - b.open))[0];

        if (!outerPair) return; // このカーソルはスキップ

        const openChar = value;
        const closeChar = matchingClose[openChar] ?? value;

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
        vscode.window.showInformationMessage(
          "カーソルの外側に括弧・クォートが見つかりません"
        );
        return;
      }

      editor
        .edit((editBuilder) => {
          edits.forEach((e) => editBuilder.replace(e.range, e.text));
        })
        .then(() => {
          // メインカーソル基準でスクロール
          const mainSelection = editor.selection;
          editor.revealRange(
            new vscode.Range(mainSelection.active, mainSelection.active),
            vscode.TextEditorRevealType.InCenter
          );
        });
    });
}
