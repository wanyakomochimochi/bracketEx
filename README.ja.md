# Bracket & Quote Tools

VSCode での括弧、クォート、タグ操作を簡単にする拡張機能です。
コード編集時の選択範囲変更、囲み、置換、括弧の削除を効率化します。
紐づけを必要とするキーバインドが最小限になるように工夫しています。

---

## 主な機能

### 選択範囲の変更 (`changeSelection`)

![Demo](assets/demo01.gif)

カーソル位置から括弧やタグの範囲を自動で選択
連続して実行することで、以下のように範囲が拡大する

1.  直近の括弧・タグを含まない内側全体
2.  直近の括弧・タグを含む範囲全体
3.  一つ外側の括弧・タグから見た内側全体
4.  一つ外側の括弧・タグを含む範囲全体
5.  以降は 3,4 の繰り返し
6.  外側に括弧・タグが見つからなければ最初のカーソル位置に戻る

複数カーソルにも対応
Html ファイルは、コンテンツ → タグ全体 → 親タグのコンテンツ全体 → 親タグ全体に範囲が拡大される

### 括弧・クォートの置換 (`replaceBracketsOrQuotes`)

![Demo](assets/demo02.gif)

直近の開き括弧/閉じ括弧やクォートを任意の文字に置換
何も入力せず決定（Enter を入力）することで括弧・クォートを削除
複数カーソルにも対応

### 任意文字で囲む (`surroundWithInput`)

![Demo](assets/demo03.gif)

選択範囲を指定した文字列で囲む
HTML タグや括弧、クォートなど自由に設定可能

## 対応言語

- JavaScript / TypeScript
- Python / Ruby
- C / C++ / C# / Java
- HTML / XML

上記以外の言語でも基本的な括弧・クォート操作は可能ですが、
コメントや特殊構文は正しく判定できない場合があります。

## インストール方法

1. VSCode で拡張機能ビューを開く
2. 「Bracket & Quote Tools」を検索
3. インストールボタンをクリック
   またはローカルで .vsix パッケージを作成してインストール可能

## 使い方

コマンドパレット (Ctrl+Shift+P / Cmd+Shift+P) で以下を検索

- BracketEx: Change Selection
- BracketEx: Replace Brackets or Quotes
- BracketEx: Surround With Input

または、後述のキーボードショートカットを設定すると、より効率的に操作できます

## コマンド一覧

| コマンド ID                         | 説明                                       |
| ----------------------------------- | ------------------------------------------ |
| `bracketEx.changeSelection`         | カーソル・括弧等に基づき選択範囲を変更     |
| `bracketEx.surroundWithInput`       | 選択範囲をユーザー入力で囲む               |
| `bracketEx.replaceBracketsOrQuotes` | 現在の括弧・クォートを別の文字に置き換える |

---

## キーボードショートカット例

`keybindings.json` に以下のように追加できます：

```json
[
  {
    "key": "ctrl+alt+s",
    "command": "extension.changeSelection",
    "when": "editorTextFocus"
  },
  {
    "key": "ctrl+alt+w",
    "command": "extension.surroundWithInput",
    "when": "editorTextFocus"
  },
  {
    "key": "ctrl+alt+r",
    "command": "extension.replaceBracketsOrQuotes",
    "when": "editorTextFocus"
  }
]
```

## 注意事項

- 複雑な正規表現は正しく認識されない場合があります。
- マルチカーソル対応ですが、ネストが深すぎる場合は意図通りに動作しないことがあります。
- 拡張の設定や動作は、VSCode のバージョンに依存する場合があります。

## 開発者向け情報

{
"repository": "https://github.com/yourname/bracket-quote-tools",
"license": "MIT",
"vscodeVersion": "1.80+"
}

## フィードバック

- バグ報告や機能改善の提案は GitHub Issues で受け付けています。
- 拡張機能の改善にぜひご協力ください。

---
