# POD 多智能体系统 - 前端

基于 [Next.js 14](https://nextjs.org) 构建的现代化前端应用，使用 [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app) 初始化。

## 🚀 快速开始

首先，启动开发服务器：

```bash
npm run dev
# 或
yarn dev
# 或
pnpm dev
# 或
bun dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看应用。

你可以通过修改 `app/page.tsx` 开始编辑页面，页面会自动热更新。

## 🔧 技术栈

| 组件 | 技术 |
|------|------|
| 框架 | Next.js 14 (App Router) |
| 语言 | TypeScript |
| 样式 | Tailwind CSS |
| UI 组件库 | shadcn/ui |
| 状态管理 | Zustand |
| 数据获取 | TanStack Query + Axios |
| 图标库 | Lucide React |
| 字体 | Geist (由 Vercel 提供) |

## 📁 目录结构

```
frontend/
├── src/
│   ├── app/               # App Router 页面
│   │   ├── (dashboard)/   # 仪表盘布局组
│   │   ├── layout.tsx     # 根布局
│   │   └── page.tsx       # 首页
│   ├── components/        # React 组件
│   │   ├── ui/           # shadcn/ui 组件
│   │   ├── layout/       # 布局组件
│   │   └── providers.tsx # Provider 包装器
│   ├── hooks/            # 自定义 Hooks
│   ├── lib/              # 工具库
│   │   ├── api.ts        # API 客户端
│   │   ├── types.ts      # TypeScript 类型定义
│   │   └── utils.ts      # 工具函数
│   └── stores/           # Zustand 状态管理
├── public/               # 静态资源
├── tailwind.config.ts    # Tailwind 配置
└── package.json          # 项目依赖
```

## 📖 学习更多

了解更多 Next.js 相关知识：

- [Next.js 文档](https://nextjs.org/docs) - 学习 Next.js 功能和 API
- [Learn Next.js](https://nextjs.org/learn) - 交互式 Next.js 教程

## 🚢 部署

推荐使用 [Vercel 平台](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) 部署 Next.js 应用。

查看 [Next.js 部署文档](https://nextjs.org/docs/app/building-your-application/deploying) 了解更多详情。
