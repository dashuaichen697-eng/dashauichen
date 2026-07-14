const REQUIRED_FIELDS = [
  ['cartonNo', '货箱编号'],
  ['customerOrderNo', '客户单号'],
  ['productChineseName', '产品中文品名'],
  ['cartonCount', '箱数'],
  ['quantityPerCarton', '每箱数量'],
  ['grossWeight', '单箱重量'],
  ['length', '长'],
  ['width', '宽'],
  ['height', '高']
];

const NUMERIC_FIELDS = [
  ['cartonCount', '箱数'],
  ['quantityPerCarton', '每箱数量'],
  ['grossWeight', '单箱重量'],
  ['length', '长'],
  ['width', '宽'],
  ['height', '高']
];

export function isBlank(value) {
  return value === null || value === undefined || String(value).trim() === '';
}

export function toNumber(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (isBlank(value)) return null;
  const normalized = String(value).trim().replace(/,/g, '');
  if (!/^-?\d+(?:\.\d+)?$/.test(normalized)) return null;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function round(value, digits = 6) {
  if (!Number.isFinite(value)) return '';
  const multiplier = 10 ** digits;
  return Math.round(value * multiplier) / multiplier;
}

export function deriveRowValues(row) {
  const cartonCount = toNumber(row.cartonCount);
  const quantityPerCarton = toNumber(row.quantityPerCarton);
  const grossWeight = toNumber(row.grossWeight);
  const { unitCbm, totalCbm } = calculateCbm(row.length, row.width, row.height, row.cartonCount);

  const totalQuantity = cartonCount !== null && quantityPerCarton !== null
    ? round(cartonCount * quantityPerCarton, 6)
    : '';
  const totalWeight = cartonCount !== null && grossWeight !== null
    ? round(cartonCount * grossWeight, 6)
    : '';

  return {
    ...row,
    totalQuantity,
    totalWeight,
    unitVolume: unitCbm,
    totalVolume: totalCbm,
    packingSpec: row.packingSpec || buildPackingSpec(row)
  };
}

export function buildPackingSpec(row) {
  if (isBlank(row.length) || isBlank(row.width) || isBlank(row.height)) return '';
  return `${row.length}×${row.width}×${row.height} CM`;
}

export function validateRows(rows) {
  const errors = [];

  rows.forEach((row, rowIndex) => {
    REQUIRED_FIELDS.forEach(([field, label]) => {
      if (!isBlank(row[field])) return;
      errors.push({
        rowIndex,
        field,
        label,
        message: `第${rowIndex + 1}条商品明细的“${label}”为空，请补充后再生成。`
      });
    });

    NUMERIC_FIELDS.forEach(([field, label]) => {
      if (isBlank(row[field])) return;
      const number = toNumber(row[field]);
      if (number !== null && number >= 0) return;
      errors.push({
        rowIndex,
        field,
        label,
        message: `第${rowIndex + 1}条商品明细的“${label}”必须是大于等于0的数字。`
      });
    });
  });

  return {
    ok: errors.length === 0,
    errors
  };
}

export function sanitizeFilenamePart(value) {
  return String(value ?? '')
    .replace(/[\\/:*?"<>|]/g, '')
    .trim();
}

function pad2(value) {
  return String(value).padStart(2, '0');
}

function formatDatePart(date) {
  return [
    date.getFullYear(),
    pad2(date.getMonth() + 1),
    pad2(date.getDate())
  ].join('');
}

function formatTimePart(date) {
  return [
    pad2(date.getHours()),
    pad2(date.getMinutes()),
    pad2(date.getSeconds())
  ].join('');
}

export function buildDownloadFilename(customerOrderNo, now = new Date()) {
  const cleanOrderNo = sanitizeFilenamePart(customerOrderNo);
  const datePart = formatDatePart(now);
  if (cleanOrderNo) {
    return `海运装箱单_${cleanOrderNo}_${datePart}.xlsx`;
  }
  return `海运装箱单_${datePart}_${formatTimePart(now)}.xlsx`;
}
import { calculateCbm } from './calculateCbm.js';
