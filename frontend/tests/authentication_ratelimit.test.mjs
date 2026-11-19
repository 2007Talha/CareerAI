import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Sliding Window Token Bucket Rate Limiter implementation for testing.
 */
class TokenBucketRateLimiter {
  constructor(capacity = 5, fillRatePerSec = 1) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.fillRate = fillRatePerSec;
    this.lastRefill = Date.now();
  }

  refill() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.fillRate);
    this.lastRefill = now;
  }

  consume(tokens = 1) {
    this.refill();
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }
    return false;
  }
}

describe('Authentication & Rate Limiting Test Suite', () => {
  test('Token bucket allows requests up to maximum burst capacity', () => {
    const limiter = new TokenBucketRateLimiter(5, 1);
    for (let i = 0; i < 5; i++) {
      assert.strictEqual(limiter.consume(1), true, `Request ${i + 1} should be permitted`);
    }
  });

  test('Token bucket rejects requests exceeding burst capacity', () => {
    const limiter = new TokenBucketRateLimiter(3, 1);
    assert.strictEqual(limiter.consume(1), true);
    assert.strictEqual(limiter.consume(1), true);
    assert.strictEqual(limiter.consume(1), true);
    assert.strictEqual(limiter.consume(1), false, '4th request should be rejected by rate limiter');
  });

  test('Authentication credential validation blocks unauthorized empty email', () => {
    const validateAuth = (email, pass) => {
      if (!email || !email.includes('@')) throw new Error('Invalid email address');
      if (!pass || pass.length < 6) throw new Error('Password must be at least 6 characters');
      return true;
    };

    assert.throws(() => validateAuth('', 'password123'), /Invalid email address/);
    assert.throws(() => validateAuth('student@uni.edu', '123'), /Password must be at least 6 characters/);
    assert.strictEqual(validateAuth('student@uni.edu', 'secret123'), true);
  });

  test('Demo session payload generates valid candidate session object', () => {
    const makeSession = (name, email) => ({
      uid: 'usr_' + Math.random().toString(36).substring(2, 9),
      email,
      displayName: name,
      created_at: new Date().toISOString(),
    });

    const session = makeSession('Alex Rivera', 'alex@university.edu');
    assert.strictEqual(session.displayName, 'Alex Rivera');
    assert.strictEqual(session.email, 'alex@university.edu');
    assert.strictEqual(session.uid.startsWith('usr_'), true);
  });
});
