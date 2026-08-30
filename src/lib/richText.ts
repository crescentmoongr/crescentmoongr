const ALLOWED_TAGS = new Set([
  'p','br','strong','b','em','i','u','h3','h4','ul','ol','li','hr','blockquote'
]);

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function plainTextToHtml(value: string) {
  const clean = value.replace(/\r\n?/g, '\n').trim();
  if (!clean) return '';
  return clean
    .split(/\n{2,}/)
    .map(block => `<p>${escapeHtml(block).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

export function sanitizeRichText(input: string | null | undefined) {
  let value = String(input || '').trim().slice(0, 20000);
  if (!value) return '';

  // Old descriptions were plain text. Preserve their line breaks automatically.
  if (!/<[a-z][\s\S]*>/i.test(value)) return plainTextToHtml(value);

  // Remove comments and dangerous element blocks first.
  value = value
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style|iframe|object|embed|svg|math|form)[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<(script|style|iframe|object|embed|svg|math|form|input|button|textarea|select|option|link|meta|base|img|video|audio|source|canvas)[^>]*\/?>/gi, '');

  // Keep only the small formatting allow-list and strip every attribute.
  value = value.replace(/<\/?([a-z0-9]+)(?:\s[^>]*)?>/gi, (whole, rawTag) => {
    const tag = String(rawTag).toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) return '';
    const closing = /^<\//.test(whole);
    if (tag === 'br' || tag === 'hr') return closing ? '' : `<${tag}>`;
    return closing ? `</${tag}>` : `<${tag}>`;
  });

  // Normalize aliases.
  value = value
    .replace(/<b>/gi, '<strong>').replace(/<\/b>/gi, '</strong>')
    .replace(/<i>/gi, '<em>').replace(/<\/i>/gi, '</em>');

  return value.trim();
}

export function richTextToHtml(input: string | null | undefined) {
  return sanitizeRichText(input);
}
