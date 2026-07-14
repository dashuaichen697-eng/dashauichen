import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildDownloadFilename,
  sanitizeFilenamePart,
  validateRows
} from '../validation.js';

function validRow(overrides = {}) {
  return {
    id: 'row-1',
    cartonNo: '1-14',
    customerOrderNo: 'HLX-260702-1',
    productChineseName: '胡须理发器',
    sku: 'BK1-LFQ5',
    model: 'No',
    cartonCount: 14,
    quantityPerCarton: 36,
    grossWeight: 13.02,
    length: 39,
    width: 41,
    height: 41,
    chineseMaterial: '合金属',
    brand: 'No',
    usage: '理发haircut',
    packingType: '纸箱',
    packingSpec: '39×41×41 CM',
    customer: '',
    owner: '',
    ...overrides
  };
}

test('validates required fields with row and field labels', () => {
  const result = validateRows([validRow({ cartonCount: '' })]);

  assert.equal(result.ok, false);
  assert.equal(result.errors[0].message, '第1条商品明细的“箱数”为空，请补充后再生成。');
  assert.equal(result.errors[0].rowIndex, 0);
  assert.equal(result.errors[0].field, 'cartonCount');
});

test('validates numeric fields as non-negative numbers', () => {
  const result = validateRows([validRow({ grossWeight: '中文' }), validRow({ length: -1 })]);

  assert.equal(result.ok, false);
  assert.deepEqual(
    result.errors.map((error) => error.message),
    [
      '第1条商品明细的“单箱重量”必须是大于等于0的数字。',
      '第2条商品明细的“长”必须是大于等于0的数字。'
    ]
  );
});

test('accepts a complete sample-shaped row', () => {
  const result = validateRows([validRow()]);

  assert.equal(result.ok, true);
  assert.deepEqual(result.errors, []);
});

test('sanitizes invalid filename characters', () => {
  assert.equal(sanitizeFilenamePart('HLX/2607:02*1?'), 'HLX2607021');
});

test('builds download names from customer order number or timestamp fallback', () => {
  const now = new Date('2026-07-11T10:05:30+08:00');

  assert.equal(
    buildDownloadFilename('HLX-260702-1', now),
    '海运装箱单_HLX-260702-1_20260711.xlsx'
  );
  assert.equal(
    buildDownloadFilename('', now),
    '海运装箱单_20260711_100530.xlsx'
  );
});
