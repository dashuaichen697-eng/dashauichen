# AI 项目隔离与治理设计

## 目标

建立一套可执行的 AI 应用开发规范，并将当前混合工作区安全整理为三个独立产品，使每个产品满足：

```text
一个产品 = 一个 GitHub Repository = 一个 Vercel Project = 一个独立域名
```

本次改造不新增业务功能，不直接删除或覆盖当前未提交文件。现有混合仓库作为只读迁移源，完成新项目验证后再冻结。

## 已确认的当前状态

当前工作区根目录 `/Users/sunshine/Documents/AI 编剧本` 是 Git 仓库，远端为：

```text
https://github.com/dashuaichen697-eng/dashauichen.git
```

该仓库同时出现以下内容：

- 陈百万星际征程 RPG 的应用代码和部署配置。
- 箱唛自动生成器及物流文档工具代码和历史提交。
- 未跟踪的 `brazil-logistics-partner-system` 子目录及其配套文档。

根目录 Vercel 链接为 `chen-million-stellar-rpg`。`brazil-logistics-partner-system` 子目录存在另一个 Vercel Project ID，但没有独立 `.git`，因此它仍属于外层 Git 工作区，尚未满足仓库隔离要求。

当前仓库包含未提交文件。迁移过程中禁止删除、覆盖或重写这些文件；所有新项目先复制到并列目录，待校验通过后再单独决定旧文件处置。

## 产品身份与命名

三个产品采用以下唯一身份：

| 中文产品名 | 标准项目名 | GitHub Repository | Vercel Project | 默认生产域名 |
| --- | --- | --- | --- | --- |
| 陈百万星际征程 RPG | `michael-life-rpg` | `michael-life-rpg` | `michael-life-rpg` | `michael-life-rpg.vercel.app` |
| 箱唛自动生成器 | `michael-box-label-generator` | `michael-box-label-generator` | `michael-box-label-generator` | `michael-box-label-generator.vercel.app` |
| 华迅达 CRM 系统 | `michael-brazil-crm` | `michael-brazil-crm` | `michael-brazil-crm` | `michael-brazil-crm.vercel.app` |

未来项目名称统一采用 `michael-<product-slug>`。目录名、`package.json` 的 `name`、GitHub Repository 和 Vercel Project 默认使用同一个标准项目名。

## 目录架构

三个产品必须是并列目录，禁止互相嵌套：

```text
/Users/sunshine/Documents/AI 编剧本/
├── michael-life-rpg/
├── michael-box-label-generator/
├── michael-brazil-crm/
└── PROJECTS.md
```

每个项目至少包含：

```text
<project>/
├── src/
├── public/
├── package.json
├── README.md
├── .env.example
├── deployment.md
└── changelog.md
```

框架需要额外目录时可以增加，但不得省略上述治理文件。Next.js 项目如果以 `app/` 为实际源码入口，应保留 `app/`，同时建立 `src/README.md` 说明源码布局，避免为满足目录名称而机械迁移框架结构。

## 仓库隔离

每个产品目录拥有独立 `.git`，且只配置一个属于该产品的 `origin`。开发开始前必须执行：

```bash
git remote -v
```

开发前检查还必须核对：

- 当前工作目录是否位于目标项目根目录。
- 目录名与项目标准名称是否一致。
- `package.json` 的 `name` 是否一致。
- `origin` 的 Repository 名称是否一致。
- `.vercel/project.json` 的 `projectName` 是否一致。
- 当前部署目标是否为 development、preview 或 production。

任一检查不通过时，检查脚本必须以非零状态退出。此时停止开发，不修改代码、不执行部署。

## 部署隔离

每个 GitHub Repository 只连接一个 Vercel Project，每个 Vercel Project 只部署一个应用：

```text
GitHub Repository
        ↓
Vercel Project
        ↓
独立生产域名
```

每个项目的 `deployment.md` 必须记录：

1. GitHub Repository 地址。
2. Vercel Project 地址。
3. 生产域名。
4. 框架、Root Directory、Build Command 和 Output Directory。
5. 环境变量配置范围。
6. development、preview、production 的部署流程。
7. 回滚方式和上线验证清单。

旧域名只有在页面内容、Vercel Project 归属和新部署均验证正确后，才允许迁移 alias。禁止把旧域名直接指向未经验证的新项目。

## 环境变量隔离

每个项目独立维护本地 `.env` 或框架规定的本地环境文件，并提交不含密钥的 `.env.example`。实际密钥不得提交到 Git。

业务变量采用项目语义前缀：

- RPG：`RPG_`，浏览器公开变量按框架要求使用 `VITE_RPG_`。
- CRM：`CRM_`，浏览器公开变量按框架要求使用 `NEXT_PUBLIC_CRM_`。
- 箱唛生成器：`BOX_`，浏览器公开变量按框架要求使用 `VITE_BOX_`。

第三方 SDK 强制要求固定变量名时，可以保留其标准名称，但必须在各自 Vercel Project 中单独配置，并在 `.env.example` 和 `deployment.md` 说明归属。禁止复制真实密钥到另一个项目来实现“共用配置”。

## 文档规范

每个项目的 `README.md` 必须记录：

1. 项目介绍。
2. 功能说明。
3. 本地运行方式。
4. 部署方式。
5. 环境变量。

每个项目的 `changelog.md` 使用日期和版本记录每次修改，至少包含 Added、Changed、Fixed、Deployment 中实际发生的类别。

父目录的 `PROJECTS.md` 是项目总清单，每个项目记录：项目名称、用途、GitHub、Vercel、域名和状态。它只保存项目元数据，不保存任何产品代码、部署配置或密钥。

## 迁移策略

采用“复制、验证、切换、冻结”策略：

1. 从当前混合仓库识别三个产品各自的源码、静态资源、测试和文档。
2. 复制到三个并列新目录；不删除迁移源。
3. 清除复制品中属于其他产品的代码、构建配置和资源。
4. 为每个项目建立独立 Git 仓库及治理文件。
5. 在本地分别安装依赖并执行 lint、test（如存在）和 build。
6. 创建或连接各自 GitHub Repository。
7. 创建或连接各自 Vercel Project，并逐项目配置环境变量。
8. 先部署 preview，验证产品身份、主要页面和静态资源。
9. 通过检查后部署 production，并核对域名返回的产品内容。
10. 在 `PROJECTS.md` 更新实际链接和状态。
11. 将旧 `dashauichen` 仓库标记为冻结迁移源，取消其生产部署职责。

## 生产保护流程

默认发布路径为：

```text
开发环境 → 自动化测试 → lint → build → preview → 人工验收 → production
```

所有 Node.js 项目上线前必须执行：

```bash
npm run build
```

如果项目提供 lint 或 test 脚本，也必须执行：

```bash
npm run lint
npm run test
```

任何命令失败都必须停止生产部署。警告需要逐条判断；影响运行、安全、数据一致性或部署可重复性的警告视为失败。

## 自动检查机制

父目录建立可复用的项目检查脚本。每个产品通过项目内配置声明预期的：

- 项目标准名称。
- GitHub Repository 名称。
- Vercel Project 名称。
- 允许的生产域名。
- 必需文件和目录。
- 必需环境变量名称，但不保存变量值。

检查脚本只读取元数据，不显示环境变量值。检查结果包含 PASS、FAIL 和未配置项；出现 FAIL 时返回非零状态。新项目必须先从标准模板创建，再通过检查，之后才能开始业务编码。

## 错误处理和恢复

- GitHub 或 Vercel 登录不可用时，保留已完成的本地隔离结果，并把远端状态标记为 `待连接`，不得伪造 URL 或声称部署完成。
- 线上域名无法访问时，不切换 alias，记录 HTTP 状态或连接错误并保留旧生产入口。
- 构建失败时只修复对应项目，不从其他项目复制配置作为临时绕过。
- 发现迁移遗漏时从只读迁移源补复制，不在新旧目录之间双向同步。
- 整理过程不执行破坏性 Git 命令，不改写旧仓库历史。

## 验收标准

本次改造只有在以下条件全部有证据支持时才算完成：

- 三个产品分别位于独立并列目录并拥有独立 `.git`。
- 三个项目均具备规定的目录和文档。
- 三个项目的代码和构建配置不存在跨产品内容。
- 三个项目分别通过适用的 lint、test 和 build。
- 三个 GitHub Repository 的 `origin` 与项目名称一致。
- 三个 Vercel Project 的名称、Root Directory 和 Git 绑定正确。
- 三个生产域名分别返回正确产品。
- 环境变量分别配置，真实密钥未进入 Git。
- `PROJECTS.md` 记录实际链接和当前状态。
- 开发前检查脚本能够发现仓库名或 Vercel Project 名不一致，并阻止继续执行。

如果因为缺少 GitHub/Vercel 授权、域名控制权或线上连接而无法完成远端步骤，最终报告必须把本地完成项与外部待办明确分开，不得把待办描述为已完成。
