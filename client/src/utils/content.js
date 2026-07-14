import DOMPurify from 'dompurify';

const HTML_TAG_PATTERN = /<\/?[a-z][\s\S]*>/i;

export function looksLikeHtml(content) {
  return typeof content === 'string' && HTML_TAG_PATTERN.test(content);
}

function stripHtml(html) {
  if (!html) {
    return '';
  }

  const normalizedHtml = String(html)
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/?(p|div|li|ul|ol|h1|h2|h3|h4|h5|h6|blockquote)[^>]*>/gi, ' ');

  if (typeof window !== 'undefined' && typeof window.DOMParser !== 'undefined') {
    const parser = new window.DOMParser();
    const document = parser.parseFromString(DOMPurify.sanitize(normalizedHtml), 'text/html');
    return document.body.textContent || '';
  }

  return normalizedHtml.replace(/<[^>]*>/g, ' ');
}

export function sanitizeRichText(html) {
  return DOMPurify.sanitize(String(html || ''));
}

export function getContentPreview(content, maxLength = 180) {
  const source = looksLikeHtml(content) ? stripHtml(content) : String(content || '');
  const normalized = source.replace(/\s+/g, ' ').trim();

  if (!normalized) {
    return 'No content available';
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength).trimEnd()}...`;
}