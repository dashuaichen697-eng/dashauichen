import * as XLSX from 'xlsx';

import { deriveRowValues } from './validation.js';

const INVOICE_SHEET_NAME = '出货信息表';
const HEADER_ROW_INDEX = 18;
const FIRST_PRODUCT_ROW_INDEX = 19;

const BASE_FIELD_CELLS = {
  customerOrderNo: 'B2',
  serviceType: 'B3',
  customsMode: 'B4',
  hasBattery: 'B5',
  hasMagnet: 'B6',
  remark: 'B7',
  fbaWarehouseCode: 'B8',
  recipientName: 'B9',
  recipientCompany: 'B10',
  recipientAddress: 'B11',
  recipientCity: 'B12',
  recipientState: 'B13',
  recipientPostalCode: 'B14',
  recipientCountry: 'B15',
  recipientPhone: 'B16',
  currency: 'B17',
  cartonCount: 'B18'
};

const FIELD_ALIASES = {
  cartonNo: ['货箱编号'],
  poNumber: ['PO Number'],
  productEnglishName: ['产品英文品名'],
  productChineseName: ['产品中文品名'],
  customsCode: ['目的国海关编码'],
  englishMaterial: ['英文材质'],
  chineseMaterial: ['中文材质'],
  usage: ['中英文用途'],
  quantityPerCarton: ['产品申报数量/每箱'],
  cartonCount: ['一样的产品总箱数'],
  declaredUnitValue: ['单个产品申报价值'],
  declaredTotalValue: ['产品申报总价值'],
  grossWeight: ['客户货箱重量'],
  length: ['长'],
  width: ['宽'],
  height: ['高'],
  sku: ['SKU'],
  bluetooth: ['带蓝牙'],
  brand: ['Brand', '品牌'],
  model: ['Model', '型号']
};

const FIXED_PRODUCT_COLUMNS = {
  cartonNo: 0,
  poNumber: 1,
  productEnglishName: 2,
  productChineseName: 3,
  customsCode: 4,
  englishMaterial: 5,
  chineseMaterial: 6,
  usage: 7,
  quantityPerCarton: 8,
  cartonCount: 9,
  declaredUnitValue: 10,
  declaredTotalValue: 11,
  grossWeight: 12,
  length: 13,
  width: 14,
  height: 15,
  sku: 16,
  bluetooth: 17,
  brand: 18,
  model: 19
};

const NUMERIC_ITEM_FIELDS = new Set([
  'quantityPerCarton',
  'cartonCount',
  'declaredUnitValue',
  'declaredTotalValue',
  'grossWeight',
  'length',
  'width',
  'height'
]);

const TEXT_ITEM_FIELDS = new Set(['customsCode']);

function normalizeHeader(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\s*＊()（）/\\\n\r]+/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '');
}

function getCell(sheet, address) {
  const cell = sheet[address];
  return cell ? cell.v : '';
}

function normalizeText(value) {
  return String(value ?? '').trim();
}

function normalizeNumber(value) {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'number') return Number.isFinite(value) ? value : '';
  const text = normalizeText(value).replace(/,/g, '');
  if (!/^-?\d+(?:\.\d+)?$/.test(text)) return normalizeText(value);
  return Number(text);
}

function readWorkbook(buffer) {
  try {
    return XLSX.read(buffer, {
      type: buffer instanceof ArrayBuffer ? 'array' : 'buffer',
      raw: true,
      cellFormula: true
    });
  } catch (error) {
    throw new Error(`无法读取 Excel 文件：${error.message || '上传的文件不是有效的 Excel。'}`);
  }
}

function readBase(sheet) {
  const base = {};
  Object.entries(BASE_FIELD_CELLS).forEach(([key, address]) => {
    base[key] = key === 'cartonCount'
      ? normalizeNumber(getCell(sheet, address))
      : normalizeText(getCell(sheet, address));
  });
  return base;
}

function buildHeaderMap(sheet) {
  const headerMap = {};
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:A1');
  const headers = [];

  for (let columnIndex = range.s.c; columnIndex <= range.e.c; columnIndex += 1) {
    const address = XLSX.utils.encode_cell({ r: HEADER_ROW_INDEX, c: columnIndex });
    const value = getCell(sheet, address);
    headers[columnIndex] = value;
  }

  Object.entries(FIELD_ALIASES).forEach(([field, aliases]) => {
    const normalizedAliases = aliases.map(normalizeHeader);
    const matchedColumn = headers.findIndex((header) => {
      const normalizedHeader = normalizeHeader(header);
      return normalizedAliases.some((alias) => normalizedHeader.includes(alias));
    });
    headerMap[field] = matchedColumn >= 0 ? matchedColumn : FIXED_PRODUCT_COLUMNS[field];
  });

  if (headerMap.cartonNo === undefined || !normalizeText(headers[headerMap.cartonNo])) {
    throw new Error('上传的文件不是标准的巴西海运发票模板，请检查文件版本。');
  }

  return { headerMap, headers };
}

function readItemCell(sheet, rowIndex, columnIndex, field) {
  const address = XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex });
  const rawValue = getCell(sheet, address);
  if (TEXT_ITEM_FIELDS.has(field)) return normalizeText(rawValue);
  if (NUMERIC_ITEM_FIELDS.has(field)) return normalizeNumber(rawValue);
  return normalizeText(rawValue);
}

function readItems(sheet, headerMap) {
  const items = [];
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:A1');

  for (let rowIndex = FIRST_PRODUCT_ROW_INDEX; rowIndex <= range.e.r; rowIndex += 1) {
    const cartonNo = readItemCell(sheet, rowIndex, headerMap.cartonNo, 'cartonNo');
    if (!cartonNo) break;

    const item = {};
    Object.entries(headerMap).forEach(([field, columnIndex]) => {
      item[field] = readItemCell(sheet, rowIndex, columnIndex, field);
    });
    items.push(item);
  }

  if (items.length === 0) {
    throw new Error('没有读取到商品明细，请检查发票第20行开始是否有数据。');
  }

  return items;
}

export function parseInvoiceWorkbook(buffer) {
  const workbook = readWorkbook(buffer);
  const sheet = workbook.Sheets[INVOICE_SHEET_NAME];

  if (!sheet) {
    throw new Error('找不到“出货信息表”，请确认上传的是标准巴西海运发票。');
  }

  const base = readBase(sheet);
  const { headerMap, headers } = buildHeaderMap(sheet);
  const items = readItems(sheet, headerMap);

  return {
    sheetName: INVOICE_SHEET_NAME,
    base,
    headers,
    headerMap,
    items
  };
}

export function createEditableRows(parsedInvoice) {
  return parsedInvoice.items.map((item, index) => deriveRowValues({
    id: `row-${index + 1}`,
    cartonNo: item.cartonNo,
    customerOrderNo: parsedInvoice.base.customerOrderNo,
    productChineseName: item.productChineseName,
    sku: item.sku,
    model: item.model,
    cartonCount: item.cartonCount,
    quantityPerCarton: item.quantityPerCarton,
    grossWeight: item.grossWeight,
    length: item.length,
    width: item.width,
    height: item.height,
    chineseMaterial: item.chineseMaterial,
    brand: item.brand,
    usage: item.usage,
    packingType: '纸箱',
    packingSpec: '',
    customer: '',
    owner: '',
    sourceItem: item
  }));
}
