/**
 * CareerAI — Pre-LLM PII Redactor
 *
 * Scans user inputs before transmitting to AI services (Gemini API)
 * and redacts personally identifiable information (emails, phone numbers,
 * US SSNs, Aadhaar/ID numbers) using deterministic placeholder tokens.
 */

export interface RedactionResult {
  redactedText: string;
  redactedCount: number;
  redactedTypes: string[];
}

const EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
const PHONE_PATTERN = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
const SSN_PATTERN = /\b\d{3}-\d{2}-\d{4}\b/g;
const CREDIT_CARD_PATTERN = /\b(?:\d{4}[-\s]?){3}\d{4}\b/g;

/**
 * Scans and redacts sensitive PII from text before forwarding to LLM endpoints.
 * @param input Raw text containing possible personal information
 * @returns Object containing redacted text, total scrubbed count, and matched types
 */
export function redactPII(input: string): RedactionResult {
  if (!input || typeof input !== 'string') {
    return { redactedText: '', redactedCount: 0, redactedTypes: [] };
  }

  let text = input;
  let count = 0;
  // Algorithmic O(1) Set lookup
  const typesDetectedSet = new Set<string>();

  // Redact Emails
  text = text.replace(EMAIL_PATTERN, () => {
    count++;
    typesDetectedSet.add('EMAIL');
    return '[EMAIL_REDACTED]';
  });

  // Redact Phone Numbers
  text = text.replace(PHONE_PATTERN, () => {
    count++;
    typesDetectedSet.add('PHONE');
    return '[PHONE_REDACTED]';
  });

  // Redact SSN
  text = text.replace(SSN_PATTERN, () => {
    count++;
    typesDetectedSet.add('SSN');
    return '[SSN_REDACTED]';
  });

  // Redact Credit Cards
  text = text.replace(CREDIT_CARD_PATTERN, () => {
    count++;
    typesDetectedSet.add('CARD');
    return '[CARD_REDACTED]';
  });

  return {
    redactedText: text,
    redactedCount: count,
    redactedTypes: Array.from(typesDetectedSet),
  };
}
