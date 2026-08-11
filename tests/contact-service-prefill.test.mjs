import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CALIBRATION_SERVICE,
  VALID_SERVICES,
  getPrefilledService,
} from '../lib/formValidation.ts';

test('calibration is a valid full contact service', () => {
  assert.ok(VALID_SERVICES.includes(CALIBRATION_SERVICE));
});

test('returns a recognised service from the query string', () => {
  assert.equal(getPrefilledService(CALIBRATION_SERVICE), CALIBRATION_SERVICE);
});

test('rejects an unrecognised service from the query string', () => {
  assert.equal(getPrefilledService('Unapproved Service'), '');
});

test('rejects a missing service value', () => {
  assert.equal(getPrefilledService(null), '');
});
