import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  PageOrientation,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType
} from 'docx';
import FileSaver from 'file-saver';
import JSZip from 'jszip';
import { pinyin } from 'pinyin-pro';
import * as XLSX from 'xlsx';

const HEADER_SCAN_LIMIT = 30;

const FIELD_ALIASES = {
  chineseName: ['产品中文品名', '中文品名', '中文名称', '申报中文品名', '产品中文名', '品名中文'],
  englishName: ['产品英文品名', '英文品名', '英文名称', '申报英文品名', '产品英文名', '品名英文'],
  model: ['型号', '产品型号', 'Model'],
  quantityPerBox: ['产品申报数量/每箱', '申报数量/每箱', '每箱数量', '每箱装箱数量', '装箱数量', '每箱PCS', 'PCS/箱'],
  totalQuantity: ['产品申报数量', '申报数量', '总申报数量', '申报总数量', '总数量'],
  weight: ['客户货箱重量', '货箱重量', '箱重', '单箱重量', '每箱重量', '重量'],
  shippingNo: ['海运号', '海运编号', '运输编号', 'Shipment No', 'Shipping No'],
  sku: ['SKU', '产品SKU', '商品SKU'],
  totalBoxes: ['总箱数', '箱数', '件数', '总件数', '箱数合计', '总箱数/件数', '一样的产品总箱数']
};

const REQUIRED_LABELS = {
  chineseName: '产品中文品名',
  englishName: '产品英文品名',
  quantityPerBox: '产品申报数量/每箱',
  weight: '客户货箱重量',
  shippingNo: '海运号',
  sku: 'SKU'
};

const noValue = new Set(['no', 'NO', 'No', 'n/a', 'NA', 'N/A', '无', '/']);

export function normalizeHeader(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\s*＊]+/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '');
}

function normalizeCell(value) {
  return String(value ?? '').trim();
}

function getHeaderMatchScore(header, aliases) {
  const normalizedHeader = normalizeHeader(header);
  if (!normalizedHeader) return 0;

  return aliases.reduce((bestScore, alias) => {
    const normalizedAlias = normalizeHeader(alias);
    if (!normalizedAlias) return bestScore;
    if (normalizedHeader === normalizedAlias) return Math.max(bestScore, 1000 + normalizedAlias.length);
    if (normalizedHeader.includes(normalizedAlias)) return Math.max(bestScore, 500 + normalizedAlias.length);
    if (normalizedHeader.length >= 3 && normalizedAlias.includes(normalizedHeader)) {
      return Math.max(bestScore, 200 + normalizedHeader.length);
    }
    return bestScore;
  }, 0);
}

function extractNumber(value) {
  const match = String(value ?? '').match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function formatInteger(value) {
  const number = extractNumber(value);
  return Number.isFinite(number) ? Math.ceil(number) : null;
}

function formatQuantity(value) {
  const text = normalizeCell(value);
  if (!text) return '';
  return /pcs/i.test(text) ? text : `${text} PCS`;
}

function formatWeight(value) {
  const text = normalizeCell(value);
  if (!text) return '';
  return /kg/i.test(text) ? text : `${text} kg`;
}

function formatProductName(englishName, model) {
  const english = normalizeCell(englishName);
  const modelText = normalizeCell(model);
  if (!modelText || noValue.has(modelText)) return english;
  return `${english} / ${modelText.replace(/^model:?\s*/i, '')}`;
}

function getInitials(chineseName) {
  const productCore = normalizeCell(chineseName)
    .replace(/\d+(?:\.\d+)?\s*(?:片|件|个|套|盒|包|支|只|枚|组)\s*(?:套?装)?$/u, '')
    .match(/[\p{Script=Han}]/gu)?.slice(-3).join('') ?? normalizeCell(chineseName);
  const letters = pinyin(productCore, {
    pattern: 'first',
    toneType: 'none',
    type: 'array'
  }).join('');
  return letters.replace(/[^a-z]/gi, '').toUpperCase().slice(0, 3) || 'MARK';
}

function getTitleConfig(titleRange, chineseName, totalBoxes) {
  const text = normalizeCell(titleRange);
  const firstTitle = text.split(/\s*(?:至|to)\s*/i)[0];
  const match = firstTitle.match(/^(.+?)-(\d+)\/(\d+)$/);
  if (match) {
    const startNumber = Number(match[2]);
    const denominator = Number(match[3]);
    const endNumber = startNumber + totalBoxes - 1;
    return {
      prefix: match[1].trim() || getInitials(chineseName),
      startNumber,
      denominator: denominator > 0 ? denominator : totalBoxes,
      width: Math.max(2, match[2].length, String(endNumber).length)
    };
  }

  return {
    prefix: text || getInitials(chineseName),
    startNumber: 1,
    denominator: totalBoxes,
    width: Math.max(2, String(totalBoxes).length)
  };
}

function getBaseShippingNo(value) {
  return normalizeCell(value).replace(/-U\d{3}$/i, '');
}

function createFieldMap(headers) {
  const candidates = headers.flatMap((header, columnIndex) =>
    Object.entries(FIELD_ALIASES).map(([key, aliases]) => ({
      key,
      header: normalizeCell(header),
      columnIndex,
      columnLetter: XLSX.utils.encode_col(columnIndex),
      score: getHeaderMatchScore(header, aliases)
    }))
  ).filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score || a.columnIndex - b.columnIndex);

  const fieldMap = Object.fromEntries(Object.keys(FIELD_ALIASES).map((key) => [key, null]));
  const usedColumns = new Set();
  candidates.forEach((candidate) => {
    if (fieldMap[candidate.key] || usedColumns.has(candidate.columnIndex)) return;
    fieldMap[candidate.key] = candidate;
    usedColumns.add(candidate.columnIndex);
  });
  return fieldMap;
}

function getValue(row, fieldMap, key) {
  const mapping = fieldMap[key];
  return mapping ? normalizeCell(row.cells[mapping.columnIndex]) : '';
}

function hasOverride(overrides, key) {
  return Object.prototype.hasOwnProperty.call(overrides, key);
}

function getEffectiveValue(row, fieldMap, key, overrides) {
  return hasOverride(overrides, key)
    ? normalizeCell(overrides[key])
    : getValue(row, fieldMap, key);
}

function getTotalBoxes(row, fieldMap, globalValues, manualTotalBoxes, overrides = {}) {
  const directValue = getEffectiveValue(row, fieldMap, 'totalBoxes', overrides);
  const directTotal = formatInteger(directValue);
  if (directTotal && directTotal > 0) {
    return { value: directTotal, source: hasOverride(overrides, 'totalBoxes') ? '页面编辑' : 'Excel 数据行' };
  }
  if (hasOverride(overrides, 'totalBoxes')) return { value: null, source: '页面编辑' };

  const globalTotal = formatInteger(globalValues.totalBoxes?.value);
  if (globalTotal && globalTotal > 0) return { value: globalTotal, source: 'Excel 全局字段' };

  const totalQuantity = extractNumber(getValue(row, fieldMap, 'totalQuantity') || globalValues.totalQuantity?.value);
  const quantityPerBox = extractNumber(getEffectiveValue(row, fieldMap, 'quantityPerBox', overrides));
  if (totalQuantity && quantityPerBox) {
    return { value: Math.ceil(totalQuantity / quantityPerBox), source: '总数量 ÷ 每箱数量' };
  }

  const manualTotal = formatInteger(manualTotalBoxes);
  if (manualTotal && manualTotal > 0) return { value: manualTotal, source: '手动输入' };

  return { value: null, source: '' };
}

function readSheetMatrix(sheet, startRow = 0, endRow = null) {
  const usedRange = XLSX.utils.decode_range(sheet['!ref'] || 'A1:A1');
  const boundedEndRow = endRow === null ? usedRange.e.r : Math.min(endRow, usedRange.e.r);
  return XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: '',
    raw: false,
    blankrows: true,
    range: {
      s: { r: startRow, c: 0 },
      e: { r: boundedEndRow, c: usedRange.e.c }
    }
  });
}

function findHeaderRow(matrix) {
  return matrix.slice(0, HEADER_SCAN_LIMIT).reduce((best, headers, rowIndex) => {
    const fieldMap = createFieldMap(headers);
    const mappings = Object.values(fieldMap).filter(Boolean);
    const matchCount = mappings.length;
    if (matchCount < 3) return best;
    const score = matchCount * 10000 + mappings.reduce((sum, mapping) => sum + mapping.score, 0);
    return !best || score > best.score ? { rowIndex, headers, fieldMap, score } : best;
  }, null);
}

function findGlobalValues(matrix, headerRowIndex) {
  const values = { totalBoxes: null, totalQuantity: null };
  matrix.slice(0, headerRowIndex).forEach((row, rowIndex) => {
    row.forEach((cell, columnIndex) => {
      for (const key of Object.keys(values)) {
        if (getHeaderMatchScore(cell, FIELD_ALIASES[key]) < 1000) continue;
        const valueColumnIndex = row.findIndex((value, index) => index > columnIndex && normalizeCell(value));
        if (valueColumnIndex < 0) continue;
        values[key] = {
          value: normalizeCell(row[valueColumnIndex]),
          header: normalizeCell(cell),
          rowNumber: rowIndex + 1,
          columnIndex,
          columnLetter: XLSX.utils.encode_col(columnIndex)
        };
      }
    });
  });
  return values;
}

export async function readWorkbook(file) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  let detected = null;

  workbook.SheetNames.forEach((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const scanMatrix = readSheetMatrix(sheet, 0, HEADER_SCAN_LIMIT - 1);
    const headerCandidate = findHeaderRow(scanMatrix);
    if (headerCandidate && (!detected || headerCandidate.score > detected.score)) {
      detected = { ...headerCandidate, sheetName, sheet, score: headerCandidate.score };
    }
  });

  if (!detected) {
    throw new Error('前 30 行内未找到包含至少 3 个关键字段的表头行。');
  }

  const matrix = readSheetMatrix(detected.sheet);
  const globalValues = findGlobalValues(matrix, detected.rowIndex);
  const sourceRows = matrix.slice(detected.rowIndex + 1).map((cells, index) => ({
    cells,
    rowNumber: detected.rowIndex + index + 2
  }));
  const rows = sourceRows.filter((row) => {
    const chineseName = getValue(row, detected.fieldMap, 'chineseName');
    const englishName = getValue(row, detected.fieldMap, 'englishName');
    const sku = getValue(row, detected.fieldMap, 'sku');
    return Boolean(chineseName || englishName || sku);
  });

  return {
    sheetName: detected.sheetName,
    headerRowNumber: detected.rowIndex + 1,
    fieldMap: detected.fieldMap,
    globalValues,
    rows
  };
}

export function analyzeRows(workbookData, manualTotalBoxes = '', rowOverrides = {}) {
  if (!workbookData) {
    return {
      fieldMap: {},
      missing: [],
      rowErrors: [],
      parsedRows: [],
      totalPages: 0,
      needsManualTotalBoxes: false
    };
  }

  const { fieldMap, globalValues, rows } = workbookData;
  const needsManualTotalBoxes = rows.some(
    (row) => !getTotalBoxes(row, fieldMap, globalValues, '', rowOverrides[row.rowNumber] ?? {}).value
  );

  const parsedRows = rows.map((row) => {
    const overrides = rowOverrides[row.rowNumber] ?? {};
    const totalBoxesResult = getTotalBoxes(row, fieldMap, globalValues, manualTotalBoxes, overrides);
    return {
      rowIndex: row.rowNumber,
      chineseName: getEffectiveValue(row, fieldMap, 'chineseName', overrides),
      englishName: getEffectiveValue(row, fieldMap, 'englishName', overrides),
      model: getEffectiveValue(row, fieldMap, 'model', overrides),
      quantityPerBox: getEffectiveValue(row, fieldMap, 'quantityPerBox', overrides),
      weight: getEffectiveValue(row, fieldMap, 'weight', overrides),
      shippingNo: getEffectiveValue(row, fieldMap, 'shippingNo', overrides),
      sku: getEffectiveValue(row, fieldMap, 'sku', overrides),
      titleRange: hasOverride(overrides, 'titleRange') ? normalizeCell(overrides.titleRange) : null,
      totalBoxes: totalBoxesResult.value,
      totalBoxesSource: totalBoxesResult.source,
      missingTotalBoxes: !totalBoxesResult.value
    };
  });

  const missing = Object.entries(REQUIRED_LABELS)
    .filter(([key]) => parsedRows.length > 0
      ? parsedRows.some((row) => !row[key])
      : !fieldMap[key])
    .map(([, label]) => label);

  const rowErrors = parsedRows.flatMap((row) => {
    if (!row.missingTotalBoxes) return [];
    return [`Excel 第 ${row.rowIndex} 行无法确定总箱数，请在下方手动输入。`];
  });

  return {
    fieldMap,
    missing: Array.from(new Set(missing)),
    rowErrors,
    parsedRows,
    totalPages: parsedRows.reduce((sum, row) => sum + (row.totalBoxes ?? 0), 0),
    needsManualTotalBoxes
  };
}

export function buildMarks(parsedRows) {
  return parsedRows.flatMap((row) => {
    if (!row.totalBoxes) return [];

    const titleConfig = getTitleConfig(row.titleRange, row.chineseName, row.totalBoxes);
    const baseShippingNo = getBaseShippingNo(row.shippingNo);

    return Array.from({ length: row.totalBoxes }, (_, index) => {
      const current = index + 1;
      const titleNumber = titleConfig.startNumber + index;
      return {
        title: `${titleConfig.prefix}-${String(titleNumber).padStart(titleConfig.width, '0')}/${titleConfig.denominator}`,
        productName: formatProductName(row.englishName, row.model),
        quantity: formatQuantity(row.quantityPerBox),
        weight: formatWeight(row.weight),
        shippingNo: `${baseShippingNo}-U${String(current).padStart(3, '0')}`,
        sku: row.sku
      };
    });
  });
}

const emptyBorder = {
  style: BorderStyle.NONE,
  size: 0,
  color: 'FFFFFF'
};

function textRun(text, size, bold = false) {
  return new TextRun({
    text,
    size,
    bold,
    font: 'Arial'
  });
}

function tableCell(text, options = {}) {
  return new TableCell({
    borders: {
      top: emptyBorder,
      bottom: emptyBorder,
      left: emptyBorder,
      right: emptyBorder
    },
    margins: {
      top: 80,
      bottom: 80,
      left: 220,
      right: 220
    },
    verticalAlign: VerticalAlign.CENTER,
    width: {
      size: options.width ?? 50,
      type: WidthType.PERCENTAGE
    },
    children: [
      new Paragraph({
        alignment: options.align ?? AlignmentType.LEFT,
        children: [textRun(text, options.size ?? 44, options.bold ?? false)]
      })
    ]
  });
}

function createMarkSection(mark) {
  const tableRows = [
    ['品名/型号', mark.productName],
    ['每一箱装箱数量', mark.quantity],
    ['重量', mark.weight],
    ['海运号', mark.shippingNo],
    ['SKU', mark.sku]
  ].map(([label, value]) => new TableRow({
    children: [
      tableCell(label, { width: 38, size: 40 }),
      tableCell(value, { width: 62, size: 40 })
    ]
  }));

  return {
    properties: {
      page: {
        size: {
          orientation: PageOrientation.LANDSCAPE,
          width: 11906,
          height: 16838
        },
        margin: {
          top: 720,
          right: 900,
          bottom: 720,
          left: 900
        }
      }
    },
    children: [
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { after: 260 },
        children: [textRun('【海运】', 52, true)]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 420 },
        children: [textRun(mark.title, 260, true)]
      }),
      new Table({
        width: {
          size: 72,
          type: WidthType.PERCENTAGE
        },
        alignment: AlignmentType.CENTER,
        rows: tableRows
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 240 },
        children: [textRun('Made in China', 150, true)]
      })
    ]
  };
}

export async function createWordBlob(marks) {
  const doc = new Document({
    creator: '箱唛自动生成器',
    title: '箱唛',
    sections: marks.map(createMarkSection)
  });

  return Packer.toBlob(doc);
}

export async function downloadWord(marks, filename) {
  const blob = await createWordBlob(marks);
  FileSaver.saveAs(blob, filename);
}

function sanitizeFilePart(value) {
  return normalizeCell(value).replace(/[\\/:*?"<>|]/g, '_') || '未命名';
}

export function formatDownloadName(parsedRows) {
  const firstShippingNo = getBaseShippingNo(parsedRows[0]?.shippingNo ?? '未命名');
  return `箱唛_${sanitizeFilePart(firstShippingNo)}.docx`;
}

function formatDate(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

export function formatBatchDownloadName(date = new Date()) {
  return `箱唛批量_${formatDate(date)}.zip`;
}

export async function createBatchZipBlob(entries) {
  const zip = new JSZip();
  const fileNameCounts = new Map();

  for (const entry of entries) {
    const marks = buildMarks(entry.parsedRows);
    const wordBlob = await createWordBlob(marks);
    const originalName = formatDownloadName(entry.parsedRows);
    const seenCount = (fileNameCounts.get(originalName) ?? 0) + 1;
    fileNameCounts.set(originalName, seenCount);
    const fileName = seenCount === 1
      ? originalName
      : originalName.replace(/\.docx$/i, `_${seenCount}.docx`);
    zip.file(fileName, await wordBlob.arrayBuffer());
  }

  return zip.generateAsync({ type: 'blob' });
}

export async function downloadBatchWords(entries, date = new Date()) {
  const zipBlob = await createBatchZipBlob(entries);
  FileSaver.saveAs(zipBlob, formatBatchDownloadName(date));
}
