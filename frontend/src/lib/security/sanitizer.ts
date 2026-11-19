/**
 * CareerAI — Defensive Security Sanitizer
 *
 * Implements strict input sanitization scrubbing XSS patterns,
 * malicious scripts, IFRAMEs, javascript: protocol URI vectors,
 * and invisible non-printable Unicode control characters.
 */

const HTML_ENTITY_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
};

/**
 * Escapes unsafe HTML characters to prevent DOM-based XSS attacks.
 * @param input Raw unsanitized text string
 * @returns Safe HTML-escaped string
 */
export function escapeHtml(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input.replace(/[&<>"'/]/g, (match) => HTML_ENTITY_MAP[match] || match);
}

/**
 * Strips dangerous executable script tags, event handlers, and protocol URIs.
 * @param input Raw user or AI input string
 * @returns Clean sanitized text without active scripts or injections
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  // 1. Strip null bytes and non-printable control characters (excluding newlines/tabs)
  let clean = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // 2. Remove script tags and embedded JavaScript
  clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // 3. Remove onload, onerror, onclick and other dangerous inline DOM event attributes
  clean = clean.replace(/on\w+\s*=\s*(["'])?[^"'>]+?\1/gi, '');
  
  // 4. Remove dangerous protocol targets (javascript:, vbscript:, data:text/html)
  clean = clean.replace(/(?:javascript|vbscript|data\s*:\s*text\/html):/gi, 'blocked:');
  
  // 5. Remove IFRAME, OBJECT, EMBED elements
  clean = clean.replace(/<\/?(?:iframe|object|embed|applet)\b[^>]*>/gi, '');
  
  return clean.trim();
}

/**
 * Validates whether an input contains potentially hazardous script markers.
 * @param input Text to inspect
 * @returns True if dangerous patterns are detected, false otherwise
 */
export function hasHazardousPatterns(input: string): boolean {
  if (!input) return false;
  const scriptRegex = /<script|javascript:|onerror=|onload=|eval\(|document\.cookie/i;
  return scriptRegex.test(input);
}
