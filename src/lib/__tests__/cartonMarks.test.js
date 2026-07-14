import assert from 'node:assert/strict';
import test from 'node:test';

import { buildMarks, formatDownloadName } from '../cartonMarks.js';

test('箱唛功能仍按总箱数生成每箱一页数据', () => {
  const marks = buildMarks([{
    chineseName: '胡须理发器',
    englishName: 'Beard trimmer',
    model: 'No',
    quantityPerBox: '36',
    weight: '13.02',
    shippingNo: 'HLX-260702-1',
    sku: 'BK1-LFQ5',
    totalBoxes: 2,
    titleRange: null
  }]);

  assert.equal(marks.length, 2);
  assert.equal(marks[0].shippingNo, 'HLX-260702-1-U001');
  assert.equal(marks[1].shippingNo, 'HLX-260702-1-U002');
  assert.equal(marks[0].quantity, '36 PCS');
  assert.equal(marks[0].weight, '13.02 kg');
});

test('箱唛下载文件名保持独立', () => {
  assert.equal(formatDownloadName([{ shippingNo: 'HLX-260702-1-U001' }]), '箱唛_HLX-260702-1.docx');
});
