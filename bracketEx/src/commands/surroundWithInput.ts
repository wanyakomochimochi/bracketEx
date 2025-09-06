import * as vscode from 'vscode';

export function surroundWithInput() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const document = editor.document;

    vscode.window.showInputBox({ prompt: '文字列で囲む:' }).then(value => {
        if (!value || value.length === 0) return;

        const matchingClose: Record<string, string> = { '(': ')', '{': '}', '[': ']', '"': '"', "'": "'", '`': '`', '<': '>' };
        const openChar = value;
        const closeChar = matchingClose[openChar] ?? openChar;

        const edits: { start: vscode.Position; end: vscode.Position }[] = [];

        editor.selections.forEach(selection => {
            let startPos: vscode.Position;
            let endPos: vscode.Position;

            if (selection.isEmpty) {
                const wordRange = document.getWordRangeAtPosition(selection.active);
                if (!wordRange) return; // このカーソルはスキップ
                startPos = wordRange.start;
                endPos = wordRange.end;
            } else {
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
