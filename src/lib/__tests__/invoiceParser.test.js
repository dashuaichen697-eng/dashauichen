import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { createEditableRows, parseInvoiceWorkbook } from '../invoiceParser.js';

const sampleInvoicePath = '/Users/sunshine/Desktop/未命名文件夹/巴西海运发票.xls';

test('parses the provided Brazil sea freight invoice sample', async () => {
  const buffer = await readFile(sampleInvoicePath);
  const invoice = parseInvoiceWorkbook(buffer);

  assert.equal(invoice.sheetName, '出货信息表');
  assert.equal(invoice.base.customerOrderNo, 'HLX-260702-1');
  assert.equal(invoice.base.serviceType, 'BR-S1');
  assert.equal(invoice.base.cartonCount, 14);
  assert.equal(invoice.items.length, 1);

  assert.deepEqual(invoice.items[0], {
    cartonNo: '1-14',
    poNumber: '/',
    productEnglishName: 'Beard trimmer',
    productChineseName: '胡须理发器',
    customsCode: '8510200000',
    englishMaterial: 'Metal',
    chineseMaterial: '合金属',
    usage: '理发haircut',
    quantityPerCarton: 36,
    cartonCount: 14,
    declaredUnitValue: 8.16,
    declaredTotalValue: 4112.64,
    grossWeight: 13.02,
    length: 39,
    width: 41,
    height: 41,
    sku: 'BK1-LFQ5',
    bluetooth: '不带',
    brand: 'No',
    model: 'No'
  });
});

test('creates editable rows with derived preview values', async () => {
  const buffer = await readFile(sampleInvoicePath);
  const rows = createEditableRows(parseInvoiceWorkbook(buffer));

  assert.equal(rows.length, 1);
  assert.equal(rows[0].customerOrderNo, 'HLX-260702-1');
  assert.equal(rows[0].totalQuantity, 504);
  assert.equal(rows[0].totalWeight, 182.28);
  assert.equal(rows[0].unitVolume, 0.065559);
  assert.equal(rows[0].totalVolume, 0.917826);
  assert.equal(rows[0].packingType, '纸箱');
  assert.equal(rows[0].packingSpec, '39×41×41 CM');
});

test('rejects invoices without the required sheet', () => {
  assert.throws(
    () => parseInvoiceWorkbook(Buffer.from('not an excel workbook')),
    /找不到“出货信息表”|无法读取 Excel 文件/
  );
});
