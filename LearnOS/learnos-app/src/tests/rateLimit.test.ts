import test from "node:test";
import assert from "node:assert";
import { checkRateLimit } from "../lib/security/rateLimit";

test("Rate Limit Logic", async (t) => {
  await t.test("allows initial requests within limit", () => {
    const userId = "user_" + Date.now();
    
    // MAX_TOKENS is 10, so 10 requests should pass
    for (let i = 0; i < 10; i++) {
      const allowed = checkRateLimit(userId);
      assert.strictEqual(allowed, true, `Request ${i + 1} should be allowed`);
    }

    // 11th request should be blocked
    const blocked = checkRateLimit(userId);
    assert.strictEqual(blocked, false, "Request 11 should be blocked");
  });

  await t.test("blocks requests for different users independently", () => {
    const userA = "userA_" + Date.now();
    const userB = "userB_" + Date.now();
    
    for (let i = 0; i < 10; i++) {
      checkRateLimit(userA);
    }
    
    // User A should now be blocked
    assert.strictEqual(checkRateLimit(userA), false);
    
    // User B should still be allowed
    assert.strictEqual(checkRateLimit(userB), true);
  });
});
