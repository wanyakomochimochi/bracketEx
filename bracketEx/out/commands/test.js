"use strict";
function findAllHtmlPairs(text) {
    const pairs = [];
    const tagRegex = /<\/?([a-zA-Z0-9-]+)(\s[^<>]*?)?(\/?)>/g;
    const stack = [];
    let match;
    while ((match = tagRegex.exec(text)) !== null) {
        const [full, tagName, attrs, selfClose] = match;
        const start = match.index;
        const end = match.index + full.length - 1;
        if (selfClose === '/') {
            pairs.push({ open: start, close: end, type: 'selfclose' });
        }
        else if (full.startsWith('</')) {
            for (let j = stack.length - 1; j >= 0; j--) {
                if (stack[j].tag === tagName) {
                    const open = stack[j];
                    pairs.push({ open: open.pos, close: end, type: tagName });
                    stack.splice(j, 1);
                    break;
                }
            }
        }
        else {
            stack.push({ tag: tagName, pos: start, attrs: attrs || '', fullEnd: end });
            if (attrs) {
                let attrOffset = start + full.indexOf(attrs);
                const attrRegex = /([a-zA-Z0-9-_]+)(\s*=\s*("[^"]*"|'[^']*'|[^\s"'>]+))?/g;
                let attrMatch;
                while ((attrMatch = attrRegex.exec(attrs)) !== null) {
                    const [attrFull, attrName, attrValueRaw] = attrMatch;
                    const attrStart = attrOffset + attrMatch.index;
                    if (attrValueRaw) {
                        // 属性値の中身のみ（"name" -> name）を選択
                        const quoteChar = attrValueRaw[0] === '"' || attrValueRaw[0] === "'" ? attrValueRaw[0] : '';
                        const valueStart = attrStart + attrFull.indexOf(attrValueRaw) + (quoteChar ? 1 : 0);
                        const valueEnd = attrStart + attrFull.indexOf(attrValueRaw) + attrValueRaw.length - (quoteChar ? 1 : 0) - 1;
                        pairs.push({ open: valueStart, close: valueEnd, type: 'attrValue' });
                        // 属性名 + = + 値の範囲
                        const nameValueStart = attrStart;
                        const nameValueEnd = attrStart + attrFull.length - 1;
                        pairs.push({ open: nameValueStart, close: nameValueEnd, type: 'attrNameValue' });
                    }
                    else {
                        // 値が無い場合は属性名のみ
                        pairs.push({ open: attrStart, close: attrStart + attrFull.length - 1, type: 'attrNameValue' });
                    }
                }
            }
        }
    }
    return pairs;
}
//# sourceMappingURL=test.js.map