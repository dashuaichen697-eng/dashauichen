# 陈百万的星际征程

一个手机端优先、可配置的人生 RPG PWA。任务、分类权重、XP、金币、奖励商城和长期主线目标均可在应用内管理。项目使用 React、Vite、Tailwind CSS、localStorage 和 Vercel Blob 云同步。

## 重要部署说明

当前 Vercel 项目 `chen-million-stellar-rpg` 必须部署本仓库根目录的 RPG 应用：

```text
Project: chen-million-stellar-rpg
Framework: Vite
Build Command: npm run build
Output Directory: dist
Production URL: https://chen-million-stellar-rpg.vercel.app/
Alias: https://chen-million-stellar-v2.vercel.app/
```

不要把物流文档工具箱、箱唛生成器或 `brazil-logistics-partner-system` 配到这个 Vercel Project 的 Root Directory。那些工具应使用独立 Vercel Project 或独立域名。

## 主要功能

- 首页：等级、总 XP、金币、连续打卡、今日完成率、主线任务和今日战报
- 任务页：今日任务和长期任务分区打卡
- 设置页：任务、奖励、分类、主线任务可配置
- 商城页：金币兑换奖励，奖励可增删改启停
- 统计页：每日 XP、周完成率、分类完成率和累计指标
- PWA：支持 iPhone Safari 添加到主屏幕
- 同步：通过 Vercel Blob 账号系统，同一账号在电脑和 iPhone 同步
- 安装：标准 PWA，支持 iPhone Safari 添加到主屏幕后独立运行

## 本地运行

```bash
npm install
npm run dev
```

默认本地地址：

```text
http://localhost:5173/
```

## 检查与构建

```bash
npm run lint
npm run test
npm run build
```

构建产物位于 `dist/`。

## 部署到 Vercel

```bash
npx vercel --prod
```

Vercel 项目设置：

- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Root Directory: 仓库根目录

如果 `chen-million-stellar-v2.vercel.app` 显示了物流工具箱，说明该域名指向了错误部署，或 Production Deployment 来自物流工具箱提交。需要重新部署本 RPG 根目录，并把 `chen-million-stellar-v2.vercel.app` alias 指向新的 RPG production deployment。

如果手机访问提示无权限或返回 `401 Unauthorized`，检查 Vercel Project 的 Deployment Protection / Vercel Authentication。面向手机桌面使用时，`*.vercel.app` 访问需要关闭保护，或改用已放行的自定义域名。

常用核对命令：

```bash
npx vercel project inspect chen-million-stellar-rpg
npx vercel inspect chen-million-stellar-v2.vercel.app
npx vercel alias set <latest-deployment-url> chen-million-stellar-v2.vercel.app
```

## 手机端访问排查

1. 用 Safari 打开 HTTPS 地址。
2. 如果显示旧项目，先在 Safari 中刷新线上地址。
3. 删除 iPhone 桌面旧图标，再重新“添加到主屏幕”。
4. 如仍显示旧项目，进入 Safari 设置清除该域名网站数据，或等待新的 service worker 激活。

本项目 service worker 当前缓存版本为 `stellar-rpg-pwa-v10`，会在新部署后清理旧缓存，并缓存 HTML、CSS、JS、图片和 manifest。`/api/` 同步接口会绕过 PWA 缓存。

## iPhone 添加到主屏幕

1. 用 iPhone Safari 打开 `https://chen-million-stellar-v2.vercel.app/`。
2. 等首页正常加载一次。
3. 点击 Safari 底部分享按钮。
4. 选择“添加到主屏幕”。
5. 名称建议保留“陈百万的星际征程”。
6. 点击“添加”。

安装后从桌面图标打开，会以 standalone 模式运行，没有 Safari 地址栏，并显示黑金火箭 App 图标和启动画面。

## PWA 检查

关键资源：

- `/manifest.webmanifest`
- `/service-worker.js`
- `/apple-touch-icon.png`
- `/icon-192.png`
- `/icon-512.png`
- `/maskable-icon.png`
- `/favicon.ico`

首次联网访问后，短时间离线仍可打开首页。用户刷新一次页面即可触发新版 service worker 更新。

本地 Lighthouse 检查：

```bash
npm run preview -- --port 4173
npx lighthouse http://localhost:4173 --chrome-flags="--headless=new --no-sandbox"
```

说明：新版 Lighthouse 已移除旧版独立 PWA category，可重点查看 manifest、service worker、移动端 viewport、最佳实践和离线能力。

## 云同步

线上账号和游戏数据通过 Vercel Blob 私有存储同步。Vercel 项目需要绑定 Blob store，并配置 `BLOB_READ_WRITE_TOKEN`。
