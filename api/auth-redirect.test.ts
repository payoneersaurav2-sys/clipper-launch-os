import assert from 'node:assert/strict';
import test from 'node:test';
import { getPostAuthDestination } from '../apps/web/src/lib/auth-redirect';

test('post-auth redirects preserve safe in-app destinations', () => {
  assert.equal(getPostAuthDestination('/checkout/complete'), '/checkout/complete');
  assert.equal(getPostAuthDestination('/dashboard/settings?tab=billing'), '/dashboard/settings?tab=billing');
});

test('post-auth redirects reject external and authentication-loop destinations', () => {
  assert.equal(getPostAuthDestination('https://attacker.example'), '/dashboard');
  assert.equal(getPostAuthDestination('//attacker.example/path'), '/dashboard');
  assert.equal(getPostAuthDestination('/login?returnTo=/login'), '/dashboard');
  assert.equal(getPostAuthDestination(null), '/dashboard');
});
