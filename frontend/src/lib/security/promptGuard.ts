/**
 * CareerAI — Prompt Injection Guard
 *
 * Scans prompts and chat messages for prompt injection patterns,
 * system prompt extraction attempts, "DAN" style jailbreaks,
 * and role-reversal markers before dispatching to the LLM.
 */

export interface PromptGuardInspection {
  isSafe: boolean;
  riskScore: number;
  flaggedPatterns: string[];
}

interface RiskPattern {
  name: string;
  regex: RegExp;
  weight: number;
}

const INJECTION_PATTERNS: RiskPattern[] = [
  { name: 'SYSTEM_OVERRIDE', regex: /ignore\s+(all\s+)?(previous|prior)\s+instructions/i, weight: 0.9 },
  { name: 'PROMPT_LEAK', regex: /(reveal|print|show|output)\s+(your\s+)?(system\s+prompt|instructions|initial\s+prompt)/i, weight: 0.85 },
  { name: 'DAN_JAILBREAK', regex: /\b(DAN\s+mode|jailbreak|unrestricted\s+mode|do\s+anything\s+now)\b/i, weight: 0.95 },
  { name: 'ROLE_REVERSAL', regex: /you\s+are\s+now\s+(an\s+unfiltered|an\s+evil|a\s+different)\s+AI/i, weight: 0.8 },
  { name: 'DELIMITER_HIJACK', regex: /(system:|assistant:|developer:|<system>|\[INST\])/i, weight: 0.75 },
];

const RISK_THRESHOLD = 0.7;

/**
 * Inspects an incoming prompt or message against known adversarial jailbreak patterns.
 * @param input Message to inspect
 * @returns Inspection result with safety flag, numeric risk score, and matched patterns
 */
export function inspectPrompt(input: string): PromptGuardInspection {
  if (!input || typeof input !== 'string') {
    return { isSafe: true, riskScore: 0, flaggedPatterns: [] };
  }

  let totalRisk = 0;
  const flagged: string[] = [];

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.regex.test(input)) {
      totalRisk = Math.max(totalRisk, pattern.weight);
      flagged.push(pattern.name);
    }
  }

  return {
    isSafe: totalRisk < RISK_THRESHOLD,
    riskScore: Number(totalRisk.toFixed(2)),
    flaggedPatterns: flagged,
  };
}
