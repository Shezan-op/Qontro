import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize user-controlled HTML before rendering via dangerouslySetInnerHTML.
 *
 * Strips:
 *  - <script>, <iframe>, <object>, <embed>, <form>, <base>
 *  - all on* event attributes (onclick, onerror, onload, etc.)
 *  - javascript: and data: URI schemes
 *
 * Preserves safe formatting: headings, paragraphs, lists, bold, italic, code,
 * blockquote, tables, and <a href> with http/https only.
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty || typeof dirty !== 'string') return '';

  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'hr',
      'ul', 'ol', 'li',
      'strong', 'b', 'em', 'i', 'u', 's', 'del', 'ins',
      'code', 'pre', 'kbd', 'samp',
      'blockquote', 'cite', 'q',
      'a',
      'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption',
      'span', 'div', 'section', 'article',
      'sup', 'sub',
      'mark',
    ],
    ALLOWED_ATTR: ['href', 'title', 'class', 'id', 'colspan', 'rowspan', 'align'],
    ALLOWED_URI_REGEXP: /^(?:https?|mailto):/i,
    FORBID_ATTR: ['style', 'onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onchange', 'onsubmit', 'formaction'],
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'select', 'textarea', 'base', 'link', 'meta', 'noscript', 'template', 'slot'],
    SANITIZE_DOM: true,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
  });
}

/**
 * Sanitize plain text -- strip ALL HTML tags, return pure text.
 * Use for titles, names, categories -- fields that should never contain HTML.
 */
export function sanitizeText(dirty: string): string {
  if (!dirty || typeof dirty !== 'string') return '';
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}
