import assert from 'node:assert/strict';
import test from 'node:test';

import { calculateCbm } from '../calculateCbm.js';
import { deriveRowValues, validateRows } from '../validation.js';

test('计算厘米长宽高对应的立方米单位体积和总体积', () => {
  assert.deepEqual(calculateCbm(39, 41, 41, 14), {
    unitCbm: 0.065559,
    totalCbm: 0.917826
  });
});

test('确认页修改长宽高后会重新计算单位体积和总体积', () => {
  const row = deriveRowValues({
    length: 39,
    width: 41,
    height: 41,
    cartonCount: 14,
    quantityPerCarton: 36,
    grossWeight: 13.02
  });
  const changed = deriveRowValues({ ...row, length: 40 });

  assert.equal(changed.unitVolume, 0.06724);
  assert.equal(changed.totalVolume, 0.94136);
});

test('确认页修改箱数后会重新计算总体积', () => {
  const row = deriveRowValues({
    length: 39,
    width: 41,
    height: 41,
    cartonCount: 14,
    quantityPerCarton: 36,
    grossWeight: 13.02
  });
  const changed = deriveRowValues({ ...row, cartonCount: 2 });

  assert.equal(changed.unitVolume, 0.065559);
  assert.equal(changed.totalVolume, 0.131118);
});

test('空值和0不会显示 NaN', () => {
  assert.deepEqual(calculateCbm('', '', '', ''), {
    unitCbm: 0,
    totalCbm: 0
  });
  assert.deepEqual(calculateCbm(0, 41, 41, 14), {
    unitCbm: 0,
    totalCbm: 0
  });
});

test('文本输入会在校验时给出明确错误提示', () => {
  const result = validateRows([{
    cartonNo: '1-14',
    customerOrderNo: 'HLX-260702-1',
    productChineseName: '胡须理发器',
    cartonCount: 14,
    quantityPerCarton: 36,
    grossWeight: 13.02,
    length: '中文',
    width: 41,
    height: 41
  }]);

  assert.equal(result.ok, false);
  assert.equal(result.errors[0].message, '第1条商品明细的“长”必须是大于等于0的数字。');
});
