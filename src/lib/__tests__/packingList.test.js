import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ExcelJS from 'exceljs';

import { createEditableRows, parseInvoiceWorkbook } from '../invoiceParser.js';
import { adjustFormulaRows, createPackingListWorkbook } from '../packingList.js';

const sampleInvoicePath = '/Users/sunshine/Desktop/未命名文件夹/巴西海运发票.xls';
const sampleTemplatePath = '/Users/sunshine/Desktop/未命名文件夹/海运装箱单模版(1).xlsx';

async function loadGeneratedWorkbook() {
  const invoiceBuffer = await readFile(sampleInvoicePath);
  const templateBuffer = await readFile(sampleTemplatePath);
  const rows = createEditableRows(parseInvoiceWorkbook(invoiceBuffer));
  const outputBuffer = await createPackingListWorkbook(rows, { templateBuffer });
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(outputBuffer);
  return workbook;
}

test('adjusts formula references from template row to target row', () => {
  assert.equal(adjustFormulaRows('J4*K4', 4, 12), 'J12*K12');
  assert.equal(adjustFormulaRows('O4*P4*Q4/1000000', 4, 5), 'O5*P5*Q5/1000000');
  assert.equal(adjustFormulaRows('R4*J4', 4, 6), 'R6*J6');
});

test('generates packing list workbook from sample invoice and template', async () => {
  const workbook = await loadGeneratedWorkbook();
  const sheet = workbook.getWorksheet('Sheet1');

  assert.ok(sheet, 'Sheet1 should exist');
  assert.ok(workbook.getWorksheet('Sheet2'), 'Sheet2 should be preserved');
  assert.ok(workbook.getWorksheet('Sheet3'), 'Sheet3 should be preserved');

  assert.equal(sheet.getCell('A4').value, '1-14');
  assert.equal(sheet.getCell('B4').value, 'HLX-260702-1');
  assert.equal(sheet.getCell('C4').value, '胡须理发器');
  assert.equal(sheet.getCell('D4').value, null);
  assert.equal(sheet.getCell('E4').value, 'BK1-LFQ5');
  assert.equal(sheet.getCell('H4').value, 'No');
  assert.equal(sheet.getCell('J4').value, 14);
  assert.equal(sheet.getCell('K4').value, 36);
  assert.equal(sheet.getCell('L4').value.formula, 'J4*K4');
  assert.equal(sheet.getCell('M4').value, 13.02);
  assert.equal(sheet.getCell('N4').value.formula, 'M4*J4');
  assert.equal(sheet.getCell('O4').value, 39);
  assert.equal(sheet.getCell('P4').value, 41);
  assert.equal(sheet.getCell('Q4').value, 41);
  assert.equal(sheet.getCell('R4').value.formula, 'O4*P4*Q4/1000000');
  assert.equal(sheet.getCell('S4').value.formula, 'R4*J4');
  assert.equal(sheet.getCell('R4').numFmt, '0.000000');
  assert.equal(sheet.getCell('S4').numFmt, '0.000000');
  assert.equal(sheet.getCell('T4').value, '合金属');
  assert.equal(sheet.getCell('U4').value, 'No');
  assert.equal(sheet.getCell('V4').value, '理发haircut');
  assert.equal(sheet.getCell('W4').value, '纸箱');
  assert.equal(sheet.getCell('X4').value, '39×41×41 CM');
});

test('generates row-specific volume formulas for multiple product rows', async () => {
  const templateBuffer = await readFile(sampleTemplatePath);
  const rows = [
    {
      cartonNo: '1',
      customerOrderNo: 'A',
      productChineseName: '商品A',
      sku: 'SKU-A',
      model: 'M1',
      cartonCount: 1,
      quantityPerCarton: 2,
      grossWeight: 3,
      length: 39,
      width: 41,
      height: 41,
      chineseMaterial: '',
      brand: '',
      usage: '',
      packingType: '纸箱',
      packingSpec: '39×41×41 CM',
      customer: '',
      owner: ''
    },
    {
      cartonNo: '2',
      customerOrderNo: 'A',
      productChineseName: '商品B',
      sku: 'SKU-B',
      model: 'M2',
      cartonCount: 4,
      quantityPerCarton: 5,
      grossWeight: 6,
      length: 10,
      width: 20,
      height: 30,
      chineseMaterial: '',
      brand: '',
      usage: '',
      packingType: '纸箱',
      packingSpec: '10×20×30 CM',
      customer: '',
      owner: ''
    }
  ];
  const outputBuffer = await createPackingListWorkbook(rows, { templateBuffer });
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(outputBuffer);
  const sheet = workbook.getWorksheet('Sheet1');

  assert.equal(sheet.getCell('R4').value.formula, 'O4*P4*Q4/1000000');
  assert.equal(sheet.getCell('S4').value.formula, 'R4*J4');
  assert.equal(sheet.getCell('R5').value.formula, 'O5*P5*Q5/1000000');
  assert.equal(sheet.getCell('S5').value.formula, 'R5*J5');
});
