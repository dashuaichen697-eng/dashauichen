import { useMemo, useRef, useState } from 'react';
import FileSaver from 'file-saver';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Plus,
  RotateCcw,
  Trash2,
  Upload
} from 'lucide-react';

import { createEditableRows, parseInvoiceWorkbook } from '../../lib/invoiceParser.js';
import { createPackingListWorkbook } from '../../lib/packingList.js';
import {
  buildDownloadFilename,
  deriveRowValues,
  validateRows
} from '../../lib/validation.js';

const editableFields = [
  { key: 'cartonNo', label: '货箱编号', required: true },
  { key: 'customerOrderNo', label: '客户单号', required: true },
  { key: 'productChineseName', label: '产品中文品名', required: true, wide: true },
  { key: 'sku', label: 'SKU' },
  { key: 'model', label: '型号' },
  { key: 'productImage', label: '产品图片', image: true },
  { key: 'cartonCount', label: '箱数', required: true, numeric: true },
  { key: 'quantityPerCarton', label: '每箱数量', required: true, numeric: true },
  { key: 'totalQuantity', label: '总数量', readonly: true },
  { key: 'grossWeight', label: '单箱重量', required: true, numeric: true },
  { key: 'totalWeight', label: '总重量', readonly: true },
  { key: 'length', label: '长', required: true, numeric: true },
  { key: 'width', label: '宽', required: true, numeric: true },
  { key: 'height', label: '高', required: true, numeric: true },
  { key: 'unitVolume', label: '单位体积', readonly: true },
  { key: 'totalVolume', label: '总体积', readonly: true },
  { key: 'chineseMaterial', label: '中文材质' },
  { key: 'brand', label: '品牌' },
  { key: 'usage', label: '用途', wide: true },
  { key: 'packingType', label: '包装种类' },
  { key: 'packingSpec', label: '装箱规格' },
  { key: 'customer', label: '客户' },
  { key: 'owner', label: 'OWNER' }
];

function formatCellValue(value) {
  return value ?? '';
}

function createBlankRow(index, customerOrderNo = '') {
  return deriveRowValues({
    id: `manual-${Date.now()}-${index}`,
    cartonNo: '',
    customerOrderNo,
    productChineseName: '',
    sku: '',
    model: '',
    cartonCount: '',
    quantityPerCarton: '',
    grossWeight: '',
    length: '',
    width: '',
    height: '',
    chineseMaterial: '',
    brand: '',
    usage: '',
    packingType: '纸箱',
    packingSpec: '',
    customer: '',
    owner: ''
  });
}

function getErrorMap(errors) {
  return errors.reduce((map, error) => {
    map.set(`${error.rowIndex}:${error.field}`, error.message);
    return map;
  }, new Map());
}

export default function PackingListTool() {
  const fileInputRef = useRef(null);
  const [fileName, setFileName] = useState('');
  const [originalRows, setOriginalRows] = useState([]);
  const [rows, setRows] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [status, setStatus] = useState('请选择 .xls 或 .xlsx 格式的巴西海运发票。');
  const [isBusy, setIsBusy] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const validation = useMemo(() => validateRows(rows), [rows]);
  const errorMap = useMemo(() => getErrorMap(validation.errors), [validation.errors]);
  const hasRows = rows.length > 0;
  const selectedCount = selectedIds.size;

  async function readInvoice(file) {
    if (!file) return;
    if (!/\.(xls|xlsx)$/i.test(file.name)) {
      setStatus('请上传 .xls 或 .xlsx 格式的 Excel 文件。');
      setShowErrors(false);
      return;
    }

    setIsBusy(true);
    setStatus('正在读取发票...');
    setShowErrors(false);

    try {
      const buffer = await file.arrayBuffer();
      const parsedInvoice = await parseInvoiceWorkbook(buffer);
      const editableRows = createEditableRows(parsedInvoice);
      setFileName(file.name);
      setOriginalRows(editableRows);
      setRows(editableRows);
      setSelectedIds(new Set());
      setStatus(`已读取 ${editableRows.length} 条商品明细，请确认后生成装箱单。`);
    } catch (error) {
      console.error(error);
      setFileName(file.name);
      setOriginalRows([]);
      setRows([]);
      setSelectedIds(new Set());
      setStatus(error.message || '读取失败，请检查发票模板是否正确。');
    } finally {
      setIsBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function updateRow(rowId, field, value) {
    setRows((currentRows) => currentRows.map((row) => {
      if (row.id !== rowId) return row;
      return deriveRowValues({ ...row, [field]: value });
    }));
  }

  function toggleRow(rowId) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(rowId)) next.delete(rowId);
      else next.add(rowId);
      return next;
    });
  }

  function addRow() {
    const customerOrderNo = rows[0]?.customerOrderNo ?? '';
    setRows((currentRows) => [...currentRows, createBlankRow(currentRows.length + 1, customerOrderNo)]);
    setStatus('已增加一条空白商品明细。');
  }

  function deleteSelectedRows() {
    if (selectedIds.size === 0) {
      setStatus('请先勾选需要删除的商品明细。');
      return;
    }
    setRows((currentRows) => currentRows.filter((row) => !selectedIds.has(row.id)));
    setSelectedIds(new Set());
    setStatus(`已删除 ${selectedIds.size} 条商品明细。`);
  }

  function resetRows() {
    setRows(originalRows);
    setSelectedIds(new Set());
    setShowErrors(false);
    setStatus('已恢复为发票读取后的原始数据。');
  }

  function backToUpload() {
    setFileName('');
    setOriginalRows([]);
    setRows([]);
    setSelectedIds(new Set());
    setShowErrors(false);
    setStatus('请选择 .xls 或 .xlsx 格式的巴西海运发票。');
  }

  async function generatePackingList() {
    const result = validateRows(rows);
    if (!result.ok) {
      setShowErrors(true);
      setStatus(result.errors[0].message);
      return;
    }

    setIsBusy(true);
    setStatus('正在生成海运装箱单...');

    try {
      const outputBuffer = await createPackingListWorkbook(rows);
      const blob = new window.Blob([outputBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const filename = buildDownloadFilename(rows[0]?.customerOrderNo);
      FileSaver.saveAs(blob, filename);
      setShowErrors(false);
      setStatus(`已生成 ${filename}。`);
    } catch (error) {
      console.error(error);
      setStatus(error.message || '生成失败，请检查数据或模板后重试。');
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <main className="app-shell">
      <section className="top-bar">
        <div>
          <p className="eyebrow">发票转装箱单</p>
          <h1>巴西海运发票转海运装箱单</h1>
          <p className="subtitle">在浏览器本地读取发票、确认明细，并按固定模板生成 .xlsx 装箱单。</p>
        </div>
        <div className="template-note">
          <FileSpreadsheet size={18} />
          默认模板：packing-list-template.xlsx
        </div>
      </section>

      <section className="upload-panel">
        <label className="upload-control">
          <Upload size={20} />
          <span>上传巴西海运发票</span>
          <small>支持 .xls、.xlsx</small>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xls,.xlsx"
            disabled={isBusy}
            onChange={(event) => readInvoice(event.target.files?.[0])}
          />
        </label>
        <button className="ghost-button" type="button" disabled={isBusy} onClick={() => fileInputRef.current?.click()}>
          读取文件
        </button>
      </section>

      <section className={`status-panel ${validation.ok ? '' : 'has-warning'}`}>
        <div className="status-icon">
          {validation.ok ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
        </div>
        <div>
          <strong>{status}</strong>
          <span>{fileName ? `当前文件：${fileName}` : 'Excel 内容不会上传服务器。'}</span>
        </div>
      </section>

      {hasRows && (
        <section className="work-panel">
          <div className="action-strip">
            <div>
              <strong>{rows.length}</strong>
              <span>条商品明细</span>
              {selectedCount > 0 && <em>已选 {selectedCount} 条</em>}
            </div>
            <div className="button-row">
              <button type="button" className="secondary-button" onClick={backToUpload} disabled={isBusy}>
                返回重新上传
              </button>
              <button type="button" className="icon-button" onClick={addRow} disabled={isBusy} title="增加一行">
                <Plus size={18} />
              </button>
              <button type="button" className="icon-button" onClick={deleteSelectedRows} disabled={isBusy} title="删除选中行">
                <Trash2 size={18} />
              </button>
              <button type="button" className="icon-button" onClick={resetRows} disabled={isBusy} title="恢复原始数据">
                <RotateCcw size={18} />
              </button>
              <button type="button" className="primary-button" onClick={generatePackingList} disabled={isBusy}>
                <Download size={18} />
                生成装箱单
              </button>
            </div>
          </div>

          {showErrors && validation.errors.length > 0 && (
            <div className="error-list">
              {validation.errors.slice(0, 6).map((error) => (
                <p key={`${error.rowIndex}-${error.field}`}>{error.message}</p>
              ))}
              {validation.errors.length > 6 && <p>还有 {validation.errors.length - 6} 个问题，请继续检查红色单元格。</p>}
            </div>
          )}

          <div className="table-wrap">
            <table className="confirm-table">
              <thead>
                <tr>
                  <th className="select-col">选</th>
                  <th className="row-col">#</th>
                  {editableFields.map((field) => (
                    <th key={field.key} className={field.wide ? 'wide-col' : undefined}>
                      {field.label}
                      {field.required && <span className="required-dot">*</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rowIndex) => (
                  <tr key={row.id}>
                    <td className="select-col">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(row.id)}
                        onChange={() => toggleRow(row.id)}
                      />
                    </td>
                    <td className="row-col">{rowIndex + 1}</td>
                    {editableFields.map((field) => {
                      const errorMessage = showErrors ? errorMap.get(`${rowIndex}:${field.key}`) : '';
                      return (
                        <td key={field.key} className={field.wide ? 'wide-col' : undefined}>
                          {field.image ? (
                            <div className="image-preview-cell">
                              {row.productImage?.dataUrl ? (
                                <img src={row.productImage.dataUrl} alt={`${row.productChineseName || '产品'}图片`} />
                              ) : (
                                <span>无图片</span>
                              )}
                            </div>
                          ) : (
                            <input
                              className={errorMessage ? 'cell-error' : undefined}
                              type={field.numeric ? 'number' : 'text'}
                              min={field.numeric ? '0' : undefined}
                              step={field.numeric ? 'any' : undefined}
                              readOnly={field.readonly}
                              title={errorMessage || field.label}
                              value={formatCellValue(row[field.key])}
                              onChange={(event) => updateRow(row.id, field.key, event.target.value)}
                            />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
