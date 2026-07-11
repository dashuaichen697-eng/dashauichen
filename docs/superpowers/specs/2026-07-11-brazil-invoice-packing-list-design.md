# Brazil sea freight invoice to packing list design

## Goal

Build a local browser tool that converts a Brazil sea freight invoice Excel workbook into a sea freight packing list workbook. The first version replaces the current root Vite app experience with a focused offline workflow:

1. Upload `巴西海运发票.xls` or `.xlsx`.
2. Read the `出货信息表` base fields and product rows.
3. Show an editable confirmation table.
4. Validate required and numeric fields.
5. Generate a new `.xlsx` from the provided packing list template.

The tool must not upload business data to a server. All parsing, confirmation, and download behavior runs in the browser.

## Confirmed Sample Structure

Invoice sample: `/Users/sunshine/Desktop/未命名文件夹/巴西海运发票.xls`

- Workbook sheets: `出货信息表`, `备注`.
- `出货信息表` base fields are in rows 2-18, values mostly in column B.
- Product headers are on row 19.
- Product rows start on row 20 and stop at the first row whose `货箱编号` is empty.
- Sample row values:
  - `货箱编号`: `1-14`
  - `客户单号`: `HLX-260702-1`
  - `产品中文品名`: `胡须理发器`
  - `SKU`: `BK1-LFQ5`
  - `Model`: `No`
  - `一样的产品总箱数`: `14`
  - `产品申报数量/每箱`: `36`
  - `客户货箱重量`: `13.02`
  - `长/宽/高`: `39/41/41`
  - `中文材质`: `合金属`
  - `Brand`: `No`
  - `中英文用途`: `理发haircut`

Template sample: `/Users/sunshine/Desktop/未命名文件夹/海运装箱单模版(1).xlsx`

- Workbook sheets: `Sheet1`, `Sheet2`, `Sheet3`.
- Output target sheet: `Sheet1`.
- Header rows: 1-3.
- Standard detail row: row 4.
- Current row 4 formulas:
  - `L4 = J4*K4`
  - `N4 = M4*J4`
  - `R4 = O4*P4*Q4/10000`
  - `S4 = R4*J4`

## Scope

In scope:

- Replace the current root app UI with the invoice-to-packing-list tool.
- Add the provided packing list template under `public/templates/` as the default template.
- Parse both `.xls` and `.xlsx` invoice uploads.
- Preserve the template workbook as the generation base.
- Copy row 4 for as many detail rows as needed.
- Preserve row 4 styles, formulas, row height, and template workbook sheets.
- Keep one output row per invoice product row. Do not split `1-14`; do not de-duplicate repeated carton numbers.
- Generate the download name as `海运装箱单_客户单号_YYYYMMDD.xlsx`, with invalid filename characters removed. If customer order number is empty, use `海运装箱单_YYYYMMDD_HHmmss.xlsx`.

Out of scope for version 1:

- User accounts.
- Server-side upload or storage.
- Batch processing multiple invoices at once.
- Image insertion for product pictures.
- Business configuration screens.
- Automatic correction of the volume formula divisor.

## Architecture

The implementation stays inside the root React + Vite app.

- `src/lib/invoiceParser.js`
  - Reads invoice workbook bytes with `xlsx`.
  - Requires `出货信息表`.
  - Reads base fields from labels and fixed-position fallback.
  - Resolves product columns from row 19 header names, with fixed-column fallback.
  - Returns normalized product rows and source metadata.

- `src/lib/packingList.js`
  - Loads the default template from `/templates/海运装箱单模版(1).xlsx`.
  - Uses ExcelJS for template-preserving `.xlsx` manipulation.
  - Copies row 4 to all required detail rows.
  - Writes mapped values.
  - Copies formulas down with row-number adjustment.
  - Exposes a volume formula mode config:
    - `template`: keep copied template formula, default.
    - `cubicMeter`: force `O*P*Q/1000000`.

- `src/lib/validation.js`
  - Validates required fields and numeric fields.
  - Produces user-readable row and field errors.

- `src/App.jsx`
  - Provides the upload, confirmation/edit, and generate workflow.

## UI Flow

### Upload

The first screen shows:

- Title: `巴西海运发票转海运装箱单`
- Invoice upload control accepting `.xls,.xlsx`.
- `读取文件` action.
- A compact privacy note that data is processed locally in the browser.

The template is not uploaded by the user in the default flow because the approved design uses the sample template as an internal default.

### Confirmation

After parsing, the app shows an editable table with these columns:

- 货箱编号
- 客户单号
- 产品中文品名
- SKU
- 型号
- 箱数
- 每箱数量
- 总数量
- 单箱重量
- 总重量
- 长
- 宽
- 高
- 单位体积
- 总体积
- 中文材质
- 品牌
- 用途
- 包装种类
- 装箱规格
- 客户
- OWNER

Controls:

- 返回重新上传
- 增加一行
- 删除选中行
- 恢复原始数据
- 生成装箱单

Derived preview values such as total quantity, total weight, unit volume, and total volume update in the confirmation table, but generated workbook formulas remain formulas rather than hardcoded calculation results.

## Field Mapping

Packing list columns:

- A `NO.`: invoice `货箱编号`
- B `单号`: base `客户单号`
- C `品名 Product`: invoice `产品中文品名`
- D `唛头 MARK`: blank
- E `SKU`: invoice `SKU`
- F `SKU CODE`: blank
- G `MB SKU`: blank
- H `Description`: invoice `Model`
- I `picture`: blank
- J `Carton`: invoice `一样的产品总箱数`
- K `pcs/ctn`: invoice `产品申报数量/每箱`
- L `Qty`: formula copied from template row
- M `G.W`: invoice `客户货箱重量`
- N `Total WT`: formula copied from template row
- O `长`: invoice `长`
- P `宽`: invoice `宽`
- Q `高`: invoice `高`
- R `CBM`: template formula copied by default
- S `CBM`: template formula copied by default
- T `material`: invoice `中文材质`
- U `Brand`: invoice `Brand`
- V `用途`: invoice `中英文用途`
- W `包装种类`: default `纸箱`
- X `装箱规格`: `${长}×${宽}×${高} CM`
- Y `客户`: editable blank by default
- Z `OWNER`: editable blank by default
- AA-AC: leave template fields intact unless explicitly mapped later.

## Validation

Generation is blocked if any of these fields are empty:

- 货箱编号
- 客户单号
- 产品中文品名
- 箱数
- 每箱数量
- 单箱重量
- 长
- 宽
- 高

Generation is blocked if any of these fields are not numbers greater than or equal to 0:

- 箱数
- 每箱数量
- 单箱重量
- 长
- 宽
- 高

Errors must name the product row and field, for example:

`第3条商品明细的“箱数”为空，请补充后再生成。`

The corresponding editable cell is visually marked in the confirmation table.

## Error Handling

The UI uses human-readable errors for:

- Non-Excel upload.
- Damaged workbook.
- Missing `出货信息表`.
- Missing or unrecognized row 19 product headers.
- No product details.
- Invalid numeric values.
- Template load failure.
- Formula copy/generation failure.
- Invalid filename characters.

## Template Handling

The generator must:

- Load the sample template as a binary workbook.
- Never modify the original template file.
- Keep existing workbook sheets.
- Keep sheet names.
- Keep header rows 1-3.
- Keep row 4 style as the detail-row source.
- Copy row 4 style and formulas to extra rows.
- Use row-adjusted formulas for `L`, `N`, `R`, and `S`.
- Preserve columns beyond mapped fields.

Known limitation: browser Excel libraries vary in how completely they preserve print settings, hidden sheets, and some advanced workbook metadata. The implementation should preserve what ExcelJS supports and verify the sample template output. If business later needs exact full-fidelity workbook metadata, move generation to Python/openpyxl or a server-side Excel engine.

## Testing And Verification

Add focused automated tests for:

- Parsing the provided invoice sample.
- Header-based mapping with fixed-position fallback.
- Stopping product reads at the first empty `货箱编号`.
- Validation messages for required and numeric fields.
- Output filename sanitization.
- Formula row adjustment for copied formulas.

Manual/sample verification:

- Generate from the two provided sample files.
- Inspect output `Sheet1!A4:X4`.
- Confirm sample values:
  - `A4`: `1-14`
  - `B4`: `HLX-260702-1`
  - `C4`: `胡须理发器`
  - `E4`: `BK1-LFQ5`
  - `H4`: `No`
  - `J4`: `14`
  - `K4`: `36`
  - `L4`: formula `=J4*K4`
  - `M4`: `13.02`
  - `N4`: formula `=M4*J4`
  - `O4:Q4`: `39`, `41`, `41`
  - `R4`: template volume formula
  - `S4`: template total volume formula
  - `T4`: `合金属`
  - `U4`: `No`
  - `V4`: `理发haircut`
  - `W4`: `纸箱`
  - `X4`: `39×41×41 CM`
- Confirm `Sheet2` and `Sheet3` still exist.
- Confirm the template source file is unchanged.

## Acceptance Criteria

- The app runs locally with `npm run dev`.
- `npm run lint` and `npm run build` pass.
- The sample invoice generates a downloadable `.xlsx`.
- The generated workbook preserves the template header and workbook sheets.
- The generated first detail row matches the expected sample values.
- Formula cells remain formulas rather than hardcoded numeric results.
