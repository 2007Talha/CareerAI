/**
 * CareerAI — Pre-LLM PII Redactor
 *
 * Scans user inputs before transmitting to AI services (Gemini API)
 * and redacts personally identifiable information using deterministic placeholder tokens.
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
 * Replaces pattern occurrences and records telemetry.
 * @param text Current string
 * @param regex Target regex
 * @param token Replacement token
 * @param type PII label
 * @param typesSet Set to record detected type
 * @returns Object containing replaced text and count
 */
function maskPattern(
  text: string,
  regex: RegExp,
  token: string,
  type: string,
  typesSet: Set<string>
): { text: string; count: number } {
  let count = 0;
  const replaced = text.replace(regex, () => {
    count++;
    typesSet.add(type);
    return token;
  });
  return { text: replaced, count };
}

/**
 * Scans and redacts sensitive PII from text before forwarding to LLM endpoints.
 * @param input Raw text containing possible personal information
 * @returns Object containing redacted text, total scrubbed count, and matched types
 */
export function redactPII(input: string): RedactionResult {
  if (!input || typeof input !== 'string') {
    return { redactedText: '', redactedCount: 0, redactedTypes: [] };
  }

  const typesDetectedSet = new Set<string>();
  let totalCount = 0;
  let text = input;

  const patterns = [
    { regex: EMAIL_PATTERN, token: '[EMAIL_REDACTED]', type: 'EMAIL' },
    { regex: PHONE_PATTERN, token: '[PHONE_REDACTED]', type: 'PHONE' },
    { regex: SSN_PATTERN, token: '[SSN_REDACTED]', type: 'SSN' },
    { regex: CREDIT_CARD_PATTERN, token: '[CARD_REDACTED]', type: 'CARD' },
  ];

  for (const { regex, token, type } of patterns) {
    const res = maskPattern(text, regex, token, type, typesDetectedSet);
    text = res.text;
    totalCount += res.count;
  }

  return {
    redactedText: text,
    redactedCount: totalCount,
    redactedTypes: Array.from(typesDetectedSet),
  };
}
