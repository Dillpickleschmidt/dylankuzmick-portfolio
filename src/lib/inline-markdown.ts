/**
 * Renders a small subset of inline markdown for short text fields like
 * frontmatter descriptions. Currently supports backtick-delimited inline
 * code: `text` becomes <code>text</code>.
 *
 * HTML is escaped first, so the input string is safe to pass to set:html.
 */
export function renderInlineMarkdown(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
  return escaped.replace(/`([^`]+)`/g, "<code>$1</code>")
}
