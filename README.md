# 物流文档工具箱

一个纯前端 React + Vite 本地网页工具箱，把多个物流文档处理功能放在同一个系统里，避免互相覆盖。

## 页面入口

- `/`：物流文档工具箱首页
- `/carton-mark`：箱唛自动生成器
- `/packing-list`：巴西海运发票转海运装箱单

## 功能

### 箱唛自动生成器

- 上传 `.xls`、`.xlsx` Excel。
- 自动识别产品、SKU、海运号、重量、每箱数量、总箱数等字段。
- 生成前确认数据。
- 支持手动编辑确认数据。
- 每个箱唛一页。
- 单文件下载 Word，多文件下载 ZIP。

### 巴西海运发票转海运装箱单

- 支持读取 `.xls`、`.xlsx` 发票。
- 读取 `出货信息表`。
- 按第 19 行商品表头识别字段，并保留固定列兜底。
- 商品明细从第 20 行开始读取，遇到空 `货箱编号` 停止。
- 确认页支持编辑、增加行、删除选中行、恢复原始数据。
- 生成前校验必填字段和数字字段。
- 输出文件保留模板表头、工作表和第 4 行样式。
- 体积公式固定为厘米转立方米：
  - 单位体积：`长 × 宽 × 高 ÷ 1000000`
  - 总体积：`单位体积 × 箱数`
- Excel 中 R 列和 S 列公式会主动覆盖为正确公式，不再依赖旧模板公式。

## 数据隐私

- Excel 通过浏览器 `File.arrayBuffer()` 读取。
- 文件内容不会通过 HTTP、API 或表单上传到服务器。
- Word、ZIP、Excel 都在浏览器内生成，并直接下载到用户电脑。
- 关闭或刷新页面后，当前选择的 Excel 和识别结果不会被网站保存。

## 模板

装箱单默认模板文件：

```text
public/templates/packing-list-template.xlsx
```

更新业务模板时，替换这个文件后重新构建即可。不要改文件名，除非同步修改 `src/lib/packingList.js` 中的 `DEFAULT_TEMPLATE_URL`。

箱唛当前由代码直接生成 Word 版式，没有使用默认 `.docx` 模板文件。

## 本地开发

```bash
npm install
npm run dev
```

打开终端显示的本地地址：

- `http://localhost:端口/`
- `http://localhost:端口/carton-mark`
- `http://localhost:端口/packing-list`

## 验证

```bash
npm test
npm run lint
npm run build
```

装箱单验收样本：

```text
/Users/sunshine/Desktop/未命名文件夹/巴西海运发票.xls
/Users/sunshine/Desktop/未命名文件夹/海运装箱单模版(1).xlsx
```

样本发票应生成一条装箱单明细：

- 货箱编号：`1-14`
- 单号：`HLX-260702-1`
- 产品中文品名：`胡须理发器`
- SKU：`BK1-LFQ5`
- 型号：`No`
- 箱数：`14`
- 每箱数量：`36`
- 单箱重量：`13.02`
- 长宽高：`39 × 41 × 41`
- 单位体积：`0.065559`
- 总体积：`0.917826`
- 中文材质：`合金属`
- 品牌：`No`
- 用途：`理发haircut`
- 包装种类：`纸箱`
- 装箱规格：`39×41×41 CM`

Excel 公式应为：

```text
R4 = O4*P4*Q4/1000000
S4 = R4*J4
```

## 部署

生产构建产物位于 `dist/`，可以由 Vercel 或任意静态文件服务器托管，不需要 Node.js 后端。

```bash
npm run build
```

Vercel 使用同一个项目、同一个域名，通过不同路径访问不同功能。`vercel.json` 已配置子路径回退到 `index.html`，避免直接打开 `/carton-mark` 或 `/packing-list` 时 404。
