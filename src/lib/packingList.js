import ExcelJS from 'exceljs';

import { PACKING_LIST_TEMPLATE_BASE64 } from './packingListTemplateBase64.js';
import { deriveRowValues } from './validation.js';

export const DEFAULT_TEMPLATE_URL = '/templates/packing-list-template.xlsx';

const DETAIL_TEMPLATE_ROW = 4;
const MAPPED_COLUMNS = {
  cartonNo: 'A',
  customerOrderNo: 'B',
  productChineseName: 'C',
  sku: 'E',
  model: 'H',
  cartonCount: 'J',
  quantityPerCarton: 'K',
  grossWeight: 'M',
  length: 'O',
  width: 'P',
  height: 'Q',
  chineseMaterial: 'T',
  brand: 'U',
  usage: 'V',
  packingType: 'W',
  packingSpec: 'X',
  customer: 'Y',
  owner: 'Z'
};

const FORMULA_COLUMNS = ['L', 'N', 'R', 'S'];

function clone(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

async function loadDefaultTemplateBuffer() {
  try {
    const response = await fetch(encodeURI(DEFAULT_TEMPLATE_URL));
    if (response.ok) {
      return response.arrayBuffer();
    }
  } catch {
    // 离线单文件打开时 fetch(file://...) 可能不可用，下面使用内置模板兜底。
  }
  return base64ToArrayBuffer(PACKING_LIST_TEMPLATE_BASE64);
}

function base64ToArrayBuffer(base64) {
  if (globalThis.Buffer) {
    return globalThis.Buffer.from(base64, 'base64');
  }
  const binary = globalThis.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes.buffer;
}

function normalizeBuffer(buffer) {
  if (buffer instanceof ArrayBuffer) return buffer;
  if (ArrayBuffer.isView(buffer)) {
    return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  }
  return buffer;
}

export function adjustFormulaRows(formula, fromRow, toRow) {
  const delta = toRow - fromRow;
  return String(formula ?? '').replace(/(\$?[A-Z]{1,3})(\$?)(\d+)/g, (match, column, absoluteMarker, rowText) => {
    if (absoluteMarker === '$') return match;
    const rowNumber = Number(rowText);
    if (!Number.isFinite(rowNumber)) return match;
    return `${column}${rowNumber + delta}`;
  });
}

function copyCellTemplate(sourceCell, targetCell) {
  targetCell.style = clone(sourceCell.style) ?? {};
  targetCell.numFmt = sourceCell.numFmt;
  targetCell.font = clone(sourceCell.font);
  targetCell.alignment = clone(sourceCell.alignment);
  targetCell.border = clone(sourceCell.border);
  targetCell.fill = clone(sourceCell.fill);
  targetCell.protection = clone(sourceCell.protection);
  targetCell.dataValidation = clone(sourceCell.dataValidation);
}

function copyTemplateRow(sheet, targetRowNumber) {
  const sourceRow = sheet.getRow(DETAIL_TEMPLATE_ROW);
  const targetRow = sheet.getRow(targetRowNumber);

  targetRow.height = sourceRow.height;
  sourceRow.eachCell({ includeEmpty: true }, (sourceCell, columnNumber) => {
    const targetCell = targetRow.getCell(columnNumber);
    copyCellTemplate(sourceCell, targetCell);
    if (sourceCell.value && typeof sourceCell.value === 'object' && 'formula' in sourceCell.value) {
      targetCell.value = {
        formula: adjustFormulaRows(sourceCell.value.formula, DETAIL_TEMPLATE_ROW, targetRowNumber)
      };
    } else if (sourceCell.formula) {
      targetCell.value = {
        formula: adjustFormulaRows(sourceCell.formula, DETAIL_TEMPLATE_ROW, targetRowNumber)
      };
    } else {
      targetCell.value = clone(sourceCell.value) ?? null;
    }
  });
  targetRow.commit?.();
}

function prepareDetailRows(sheet, rowCount) {
  if (rowCount < 1) {
    throw new Error('没有可生成的商品明细。');
  }

  for (let index = 0; index < rowCount; index += 1) {
    copyTemplateRow(sheet, DETAIL_TEMPLATE_ROW + index);
  }
}

function setFormulaCells(sheet, rowNumber) {
  const formulaByColumn = {
    L: `J${rowNumber}*K${rowNumber}`,
    N: `M${rowNumber}*J${rowNumber}`,
    R: `O${rowNumber}*P${rowNumber}*Q${rowNumber}/1000000`,
    S: `R${rowNumber}*J${rowNumber}`
  };

  FORMULA_COLUMNS.forEach((column) => {
    sheet.getCell(`${column}${rowNumber}`).value = { formula: formulaByColumn[column] };
  });
  sheet.getCell(`R${rowNumber}`).numFmt = '0.000000';
  sheet.getCell(`S${rowNumber}`).numFmt = '0.000000';
}

function writeRow(sheet, row, rowNumber) {
  const derivedRow = deriveRowValues(row);

  Object.entries(MAPPED_COLUMNS).forEach(([field, column]) => {
    const value = derivedRow[field];
    sheet.getCell(`${column}${rowNumber}`).value = value === '' || value === undefined ? null : value;
  });

  sheet.getCell(`D${rowNumber}`).value = null;
  sheet.getCell(`F${rowNumber}`).value = null;
  sheet.getCell(`G${rowNumber}`).value = null;
  sheet.getCell(`I${rowNumber}`).value = null;
  setFormulaCells(sheet, rowNumber);
}

export async function createPackingListWorkbook(rows, options = {}) {
  const { templateBuffer } = options;

  const workbook = new ExcelJS.Workbook();
  const buffer = templateBuffer ?? await loadDefaultTemplateBuffer();
  await workbook.xlsx.load(normalizeBuffer(buffer));
  const sheet = workbook.getWorksheet('Sheet1');

  if (!sheet) {
    throw new Error('装箱单模板中找不到 Sheet1，请检查模板文件。');
  }

  prepareDetailRows(sheet, rows.length);
  rows.forEach((row, index) => {
    writeRow(sheet, row, DETAIL_TEMPLATE_ROW + index);
  });

  return workbook.xlsx.writeBuffer();
}
