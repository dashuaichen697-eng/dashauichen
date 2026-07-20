# 陈百万的星际征程

一个手机端优先、可配置的人生 RPG PWA。任务、分类权重、XP、金币、奖励商城和长期主线目标均可在应用内管理。项目使用 React、Vite、Tailwind CSS 和 localStorage，并保留 Supabase 实时同步能力。

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
- 同步：配置 Supabase 后，同一账号在电脑和 iPhone 实时同步

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

## 手机端访问排查

1. 用 Safari 打开 HTTPS 地址。
2. 如果显示旧项目，先在 Safari 中刷新线上地址。
3. 删除 iPhone 桌面旧图标，再重新“添加到主屏幕”。
4. 如仍显示旧项目，进入 Safari 设置清除该域名网站数据，或等待新的 service worker 激活。

本项目 service worker 当前缓存版本为 `stellar-rpg-v8`，会在新部署后清理旧缓存，并只缓存 `200` 的 HTML，避免错误页或旧工具箱页面继续被 PWA 使用。

## Supabase 同步

在 Vercel 和本地 `.env.local` 中配置：

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

未配置环境变量时应用使用纯 localStorage 模式。
