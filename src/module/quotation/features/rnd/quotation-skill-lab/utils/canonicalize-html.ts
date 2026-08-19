const ALLOWED_ELEMENTS = new Set([
  'section',
  'p',
  'br',
  'strong',
  'em',
  'u',
  's',
  'h1',
  'h2',
  'h3',
  'ul',
  'ol',
  'li',
  'blockquote',
  'hr',
  'a',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
]);

const BLOCK_ELEMENTS = new Set([
  'section',
  'p',
  'h1',
  'h2',
  'h3',
  'ul',
  'ol',
  'li',
  'blockquote',
  'hr',
  'table',
  'thead',
  'tbody',
  'tr',
]);

const REMOVE_WITH_CONTENT = new Set([
  'script',
  'style',
  'iframe',
  'object',
  'embed',
  'form',
  'meta',
  'link',
  'title',
  'head',
  'noscript',
]);

export function canonicalizeHTML(html: string): string {
  const root = document.createElement('div');
  root.innerHTML = html;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT + NodeFilter.SHOW_COMMENT);
  const nodes = [];
  while (walker.nextNode()) {
    nodes.push(walker.currentNode);
  }

  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i];
    if (node.nodeType === Node.COMMENT_NODE) {
      node.parentNode?.removeChild(node);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tag = el.tagName.toLowerCase();
      if (REMOVE_WITH_CONTENT.has(tag)) {
        el.parentNode?.removeChild(el);
      } else if (!ALLOWED_ELEMENTS.has(tag)) {
        while (el.firstChild) {
          el.parentNode?.insertBefore(el.firstChild, el);
        }
        el.parentNode?.removeChild(el);
      } else {
        const attrs = Array.from(el.attributes);
        for (const attr of attrs) {
          const name = attr.name.toLowerCase();
          const value = attr.value;

          if (tag === 'section') {
            if (!['data-block-type', 'data-template-code', 'data-modified'].includes(name)) {
              el.removeAttribute(name);
            }
          } else if (tag === 'a' && name === 'href') {
            try {
              const url = new URL(value, 'http://dummy.com');
              if (!['http:', 'https:', 'mailto:'].includes(url.protocol)) {
                el.removeAttribute(name);
              }
            } catch {
              el.removeAttribute(name);
            }
          } else if ((tag === 'td' || tag === 'th') && (name === 'colspan' || name === 'rowspan')) {
            const num = parseInt(value, 10);
            if (isNaN(num) || num < 1 || num > 20) {
              el.removeAttribute(name);
            } else {
              el.setAttribute(name, num.toString());
            }
          } else {
            el.removeAttribute(name);
          }
        }
      }
    }
  }

  const tables = root.querySelectorAll('table');
  for (let i = 0; i < tables.length; i++) {
    const table = tables[i];
    const rows = Array.from(table.querySelectorAll('tr'));

    while (table.firstChild) {
      table.removeChild(table.firstChild);
    }

    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');

    let inThead = true;
    for (const row of rows) {
      const cells = Array.from(row.children);
      const isHeaderRow = cells.length > 0 && cells.every((c) => c.tagName.toLowerCase() === 'th');

      if (inThead && isHeaderRow) {
        thead.appendChild(row);
      } else {
        inThead = false;
        tbody.appendChild(row);
      }
    }

    if (thead.childNodes.length > 0) table.appendChild(thead);
    if (tbody.childNodes.length > 0) table.appendChild(tbody);
  }

  const textWalker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (textWalker.nextNode()) {
    textNodes.push(textWalker.currentNode);
  }

  for (const text of textNodes) {
    if (!text.nodeValue || text.nodeValue.trim() === '') {
      const parentTag = text.parentElement?.tagName.toLowerCase();
      if (['section', 'ul', 'ol', 'table', 'thead', 'tbody', 'tr'].includes(parentTag || '')) {
        text.parentNode?.removeChild(text);
      } else {
        const prev = text.previousSibling;
        const next = text.nextSibling;
        const isPrevBlock =
          !prev ||
          (prev.nodeType === Node.ELEMENT_NODE &&
            BLOCK_ELEMENTS.has((prev as HTMLElement).tagName.toLowerCase()));
        const isNextBlock =
          !next ||
          (next.nodeType === Node.ELEMENT_NODE &&
            BLOCK_ELEMENTS.has((next as HTMLElement).tagName.toLowerCase()));

        if (isPrevBlock && isNextBlock) {
          text.parentNode?.removeChild(text);
        }
      }
    }
  }

  return root.innerHTML;
}
