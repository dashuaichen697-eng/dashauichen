import { useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Archive,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  RotateCcw,
  Upload
} from 'lucide-react';

import {
  analyzeRows,
  buildMarks,
  downloadBatchWords,
  downloadWord,
  formatDownloadName,
  readWorkbook
} from '../../lib/cartonMarks.js';

const MAX_FILES = 20;

const editableFields = [
  ['chineseName', '产品中文品名'],
  ['englishName', '产品英文品名'],
  ['model', '型号'],
  ['quantityPerBox', '每箱数量'],
  ['weight', '客户货箱重量'],
  ['shippingNo', '海运号'],
  ['sku', 'SKU'],
  ['totalBoxes', '总箱数']
];

function createFileId(file, index) {
  return `${file.name}-${file.size}-${file.lastModified}-${index}`;
}

function analyzeItem(item) {
  if (!item.workbookData) return { ...item, analysis: null, canGenerate: false };
  const analysis = analyzeRows(item.workbookData, item.manualTotalBoxes, item.overrides);
  const canGenerate = analysis.parsedRows.length > 0
    && analysis.missing.length === 0
    && analysis.rowErrors.length === 0;
  return { ...item, analysis, canGenerate };
}

export default function CartonMarkTool() {
  const fileInputRef = useRef(null);
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('请上传 .xls 或 .xlsx 文件，单次最多 20 个。');
  const [isBusy, setIsBusy] = useState(false);

  const analyzedItems = useMemo(() => items.map(analyzeItem), [items]);
  const totalRows = analyzedItems.reduce((sum, item) => sum + (item.analysis?.parsedRows.length ?? 0), 0);
  const totalPages = analyzedItems.reduce((sum, item) => sum + (item.analysis?.totalPages ?? 0), 0);
  const allReady = analyzedItems.length > 0 && analyzedItems.every((item) => item.canGenerate);
  const isBatch = analyzedItems.length > 1;

  async function handleFileChange(event) {
    const selectedFiles = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (selectedFiles.length === 0) return;

    const files = selectedFiles.slice(0, MAX_FILES);
    setIsBusy(true);
    setStatus(`正在解析 ${files.length} 个 Excel 文件...`);

    const parsedItems = await Promise.all(files.map(async (file, index) => {
      try {
        return {
          id: createFileId(file, index),
          fileName: file.name,
          workbookData: await readWorkbook(file),
          manualTotalBoxes: '',
          overrides: {},
          error: ''
        };
      } catch (error) {
        console.error(error);
        return {
          id: createFileId(file, index),
          fileName: file.name,
          workbookData: null,
          manualTotalBoxes: '',
          overrides: {},
          error: error.message || '无法解析这个 Excel 文件。'
        };
      }
    }));

    const failedCount = parsedItems.filter((item) => item.error).length;
    setItems(parsedItems);
    if (selectedFiles.length > MAX_FILES) {
      setStatus(`一次最多处理 ${MAX_FILES} 个文件，本次已读取前 ${MAX_FILES} 个。`);
    } else if (failedCount > 0) {
      setStatus(`已读取 ${files.length} 个文件，其中 ${failedCount} 个需要检查。`);
    } else {
      setStatus(`已读取 ${files.length} 个文件，请核对下方确认信息。`);
    }
    setIsBusy(false);
  }

  function updateManualTotalBoxes(id, value) {
    setItems((currentItems) => currentItems.map((item) => (
      item.id === id ? { ...item, manualTotalBoxes: value } : item
    )));
  }

  function updateField(id, rowIndex, key, value) {
    setItems((currentItems) => currentItems.map((item) => {
      if (item.id !== id) return item;
      return {
        ...item,
        overrides: {
          ...item.overrides,
          [rowIndex]: {
            ...(item.overrides[rowIndex] ?? {}),
            [key]: value
          }
        }
      };
    }));
  }

  function resetAll() {
    setItems([]);
    setStatus('请上传 .xls 或 .xlsx 文件，单次最多 20 个。');
  }

  async function handleGenerate() {
    if (!allReady) {
      setStatus('请先补齐确认区里的必填信息。');
      return;
    }

    setIsBusy(true);
    setStatus(isBatch ? '正在生成 Word 并打包 ZIP...' : '正在生成 Word 箱唛...');
    try {
      if (isBatch) {
        await downloadBatchWords(analyzedItems.map((item) => ({
          parsedRows: item.analysis.parsedRows
        })));
        setStatus(`已生成 ${analyzedItems.length} 个 Word，共 ${totalPages} 页，并打包为 ZIP。`);
      } else {
        const parsedRows = analyzedItems[0].analysis.parsedRows;
        const marks = buildMarks(parsedRows);
        await downloadWord(marks, formatDownloadName(parsedRows));
        setStatus(`已生成 ${marks.length} 页箱唛 Word 文件。`);
      }
    } catch (error) {
      console.error(error);
      setStatus('生成失败，请检查确认区中的数据后重试。');
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <main className="app-shell">
      <section className="top-bar">
        <div>
          <p className="eyebrow">箱唛自动生成器</p>
          <h1>箱唛自动生成器</h1>
          <p className="subtitle">上传 Excel，确认字段后生成每箱一页的 Word 箱唛；多文件会自动打包 ZIP。</p>
        </div>
        <div className="template-note">
          <FileSpreadsheet size={18} />
          输出格式：Word / ZIP
        </div>
      </section>

      <section className="upload-panel">
        <label className="upload-control">
          <Upload size={20} />
          <span>上传箱唛 Excel</span>
          <small>支持 .xls、.xlsx，最多 {MAX_FILES} 个</small>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xls,.xlsx"
            multiple
            disabled={isBusy}
            onChange={handleFileChange}
          />
        </label>
        <button className="ghost-button" type="button" disabled={isBusy} onClick={() => fileInputRef.current?.click()}>
          读取文件
        </button>
      </section>

      <section className={`status-panel ${allReady || items.length === 0 ? '' : 'has-warning'}`}>
        <div className="status-icon">
          {allReady || items.length === 0 ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
        </div>
        <div>
          <strong>{status}</strong>
          <span>Excel 内容只在浏览器本地读取，不上传服务器。</span>
        </div>
      </section>

      {items.length > 0 && (
        <section className="work-panel">
          <div className="action-strip">
            <div>
              <strong>{totalRows}</strong>
              <span>条识别明细，预计 {totalPages} 页箱唛</span>
            </div>
            <div className="button-row">
              <button type="button" className="icon-button" onClick={resetAll} disabled={isBusy} title="重新上传">
                <RotateCcw size={18} />
              </button>
              <button type="button" className="primary-button" onClick={handleGenerate} disabled={isBusy || !allReady}>
                {isBatch ? <Archive size={18} /> : <Download size={18} />}
                {isBatch ? '批量生成 ZIP' : '生成 Word'}
              </button>
            </div>
          </div>

          <div className="file-stack">
            {analyzedItems.map((item) => (
              <section className="file-panel" key={item.id}>
                <div className="file-panel-header">
                  <div>
                    <strong>{item.fileName}</strong>
                    <span>{item.error || `识别到 ${item.analysis.parsedRows.length} 条，预计 ${item.analysis.totalPages} 页`}</span>
                  </div>
                  {item.analysis?.needsManualTotalBoxes && (
                    <label className="inline-input">
                      手动总箱数
                      <input
                        type="number"
                        min="1"
                        value={item.manualTotalBoxes}
                        onChange={(event) => updateManualTotalBoxes(item.id, event.target.value)}
                      />
                    </label>
                  )}
                </div>

                {item.analysis?.missing.length > 0 && (
                  <div className="error-list">
                    <p>缺少字段：{item.analysis.missing.join('、')}</p>
                  </div>
                )}
                {item.analysis?.rowErrors.length > 0 && (
                  <div className="error-list">
                    {item.analysis.rowErrors.map((error) => <p key={error}>{error}</p>)}
                  </div>
                )}

                {item.analysis?.parsedRows.length > 0 && (
                  <div className="table-wrap compact-table-wrap">
                    <table className="confirm-table">
                      <thead>
                        <tr>
                          <th className="row-col">#</th>
                          {editableFields.map(([, label]) => <th key={label}>{label}</th>)}
                          <th>页数</th>
                          <th>首个箱唛</th>
                        </tr>
                      </thead>
                      <tbody>
                        {item.analysis.parsedRows.map((row, index) => {
                          const marks = buildMarks([row]);
                          return (
                            <tr key={`${item.id}-${row.rowIndex}`}>
                              <td className="row-col">{index + 1}</td>
                              {editableFields.map(([key, label]) => (
                                <td key={key}>
                                  <input
                                    type={key === 'totalBoxes' ? 'number' : 'text'}
                                    min={key === 'totalBoxes' ? '1' : undefined}
                                    title={label}
                                    value={row[key] ?? ''}
                                    onChange={(event) => updateField(item.id, row.rowIndex, key, event.target.value)}
                                  />
                                </td>
                              ))}
                              <td><input readOnly value={row.totalBoxes ?? ''} /></td>
                              <td><input readOnly value={marks[0]?.title ?? ''} /></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
