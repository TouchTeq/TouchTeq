import assert from 'node:assert/strict';
import test from 'node:test';

import { searchSite } from '../lib/search-index.ts';

test('finds the standalone calibration service from calibration terms', () => {
  const [result] = searchSite('ultrasonic flow calibration');

  assert.equal(result?.url, '/services/instrument-calibration');
  assert.equal(result?.category, 'Service');
});
