# BracketEx Extension

BracketEx is a Visual Studio Code extension that provides enhanced functionality for working with brackets, quotes, and (for HTML files) tags in your code. This extension includes three main commands that allow you to manipulate selections and brackets/quotes efficiently.

## Features

1. **Change Selection**:
   Modifies the current selection range by cycling through the nearest enclosing structure:
   - In most file types: parentheses `()`, braces `{}`, brackets `[]`, and quotes (`"`, `'`).
   - In HTML files: standard brackets/quotes **plus correct HTML tags** (e.g., `<div>...</div>`).
     - The extension detects matching **opening and closing tags** and treats them as a pair.

2. **Remove Brackets, Quotes, or Tags**:
   Deletes the nearest enclosing brackets, quotes, or (in HTML files) the entire tag pair.
   For example, with the cursor inside `<span>hello</span>`, running this command removes the tags and leaves `hello`.

3. **Replace Brackets, Quotes, or Tags**:
   Replaces the nearest enclosing brackets, quotes, or tags with a user-defined string.
   - For HTML files, you can change a tag name (e.g., `<p>...</p>` → `<div>...</div>`) by entering the new tag.

## Usage

1. Open a file in VS Code.
2. Place one or more cursors inside or around brackets, quotes, or (for HTML files) tag pairs.
3. Run the command **`extension.changeSelection`** (you can bind it to a shortcut key for convenience).
   - The selection will expand and contract between:
     - Inside a pair → the pair itself → the next outer pair → back to the innermost.
   - Multi-cursor selections are fully supported.
   - In HTML files, matching is done based on tag names only (attributes are ignored).
   - Self-closing tags such as `<br/>` or `<img .../>` are treated as a single bracket-like pair.

Example:
- `(example)` → select `example` → select `(example)` → select outer context.

## License

This extension is released under the [MIT License](LICENSE).
