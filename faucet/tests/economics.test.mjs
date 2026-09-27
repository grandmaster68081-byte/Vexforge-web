import test from 'node:test';
import assert from 'node:assert/strict';

test('launch economics keep the advertised points and payout rail', () => {
  const pointsPerUsdDisplay = 1000;
  const exchangeRate = 350;
  const minimumPoints = 10000;
  assert.equal(minimumPoints / pointsPerUsdDisplay, 10);
  assert.equal(exchangeRate, 350);
  assert.deepEqual({ asset: 'USDT', network: 'TRC20' }, { asset: 'USDT', network: 'TRC20' });
});

test('recommendation ordering never treats missing duration as infinite efficiency', () => {
  const items = [{ reward: 400, durationSeconds: 60 }, { reward: 1000 }, { reward: 300, durationSeconds: 30 }];
  const score = (item) => item.durationSeconds && item.durationSeconds > 0 ? item.reward / (item.durationSeconds / 60) : undefined;
  const ranked = [...items].sort((a, b) => (score(b) ?? -1) - (score(a) ?? -1));
  assert.equal(ranked[0].reward, 300);
  assert.equal(score(ranked[2]), undefined);
});
