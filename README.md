# SQL Builder BI - 自助多维数据分析平台

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.3-purple.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC.svg)](https://tailwindcss.com/)

## 🚀 项目简介

**SQL Builder BI** 是一款自助（Self-Service）多维数据分析平台。它基于"所见即所得"的设计理念，通过可视化的 UI 交互，将复杂的 SQL 查询逻辑抽象为直观的维度、指标和过滤条件选择，帮助数据分析师、产品经理和运营人员快速获取业务洞察。

---

## 📦 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0 或 pnpm >= 8.0.0

### 安装依赖

```bash
# 使用 npm
npm install

# 或使用 pnpm
pnpm install
```

### 开发模式

```bash
npm run dev
```

启动后访问 http://localhost:5173

### 生产构建

```bash
npm run build
```

构建产物将输出到 `dist/` 目录。

### 预览构建

```bash
npm run preview
```

---

## 📈 应用场景 (分析师视角)

作为一名数据分析师，通常面临海量的业务数据和碎片化的指标需求。本平台针对以下典型场景进行了深度优化：

### 1. 核心看板快速诊断
- **场景**: 每日早起观察 GMV 或订单量波动。
- **功能**: 通过"统计周期"快速切换日/周/月视图，配合"对比模式"一键查看日环比 (DoD) 或周同比 (WoW)，秒级定位数据异常点。

### 2. 精细化运营下钻分析
- **场景**: 当发现"服务类型"整体转化下降时。
- **功能**: 锁定该维度，进一步选定"城市"、"车型"或"供应商"，通过"维度筛选"增加精准 WHERE 条件，实现从全局到局部的逐层下钻。

### 3. 多指标关联分析
- **场景**: 评估营销活动对"呼叫单量"与"应答单量"的协同影响。
- **功能**: 在"选择指标"区域勾选多个复合指标，通过联动图表实时观察不同指标间的趋势重合度及波动相关性。

---

## ✨ 核心特性

### 🛠 极致灵活的查询构建
- **维度与指标**: 支持核心维度（日期、城市）与辅助维度的自由组合。指标提供详细的悬浮说明（Tooltip），解决"口径对齐"痛点。
- **智能兼容性检查**: 自动检测维度与指标的兼容性，避免无效查询。

### 🔍 强大的 WHERE 过滤系统
- **多级筛选**: 包含日期（Date Picker）、小时（Hour Filter）以及基于维度的自定义过滤（Filter Builder）。
- **操作符支持**: 支持 IN / NOT IN 等常用过滤操作。

### 📊 专业级可视化效果
- **多图表类型**: 支持折线图、柱状图、面积图切换。
- **联动响应**: 查询结果自动渲染为趋势图与明细数据表。
- **对比分析**: 内置环比/同比对比功能，支持多时间粒度。

### ⏱ 时间粒度控制
- **灵活粒度**: 支持小时/日/周/月四种时间粒度。
- **智能对比**: 根据粒度自动计算对比区间。

---

## 🛠 技术栈

| 类别 | 技术 | 说明 |
|------|------|------|
| **框架** | React 18 | 组件化开发 |
| **语言** | TypeScript 5.2 | 类型安全 |
| **构建** | Vite 5.3 | 极速热更新 |
| **样式** | Tailwind CSS 3.4 | 原子化 CSS |
| **状态管理** | Zustand 5.0 | 轻量无样板代码 |
| **图表** | Recharts 2.12 | 基于 D3.js 的 React 图表库 |
| **日期处理** | date-fns 3.6 | 现代日期工具库 |
| **图标** | Lucide React | 开源图标库 |
| **动画** | Framer Motion 11 | 流畅动效 |
| **搜索** | Fuse.js 7.1 | 模糊搜索引擎 |
| **虚拟列表** | TanStack Virtual 3 | 高性能虚拟滚动 |

---

## 📂 项目结构

```text
zizhu_analysis2026/
├── src/
│   ├── App.tsx                    # 主应用入口，包含核心业务逻辑
│   ├── main.tsx                   # React 应用挂载点
│   ├── index.css                  # 全局样式与 Tailwind 配置
│   │
│   ├── MetricSelectorModal.tsx    # 指标选择器弹窗组件
│   ├── MetricConfigPage.tsx       # 指标配置管理页面
│   │
│   ├── components/
│   │   ├── analysis/              # 核心 BI 分析组件
│   │   │   ├── ChartContainer.tsx      # 图表容器（支持多种图表类型）
│   │   │   ├── ComparisonSelector.tsx  # 对比模式选择器
│   │   │   ├── DataTable.tsx           # 数据明细表格
│   │   │   ├── DateRangePicker.tsx     # 日期范围选择器
│   │   │   ├── DimensionSelector.tsx   # 维度多选器
│   │   │   ├── FilterBuilder.tsx       # 动态过滤条件构建器
│   │   │   ├── TimeGranularitySelector.tsx  # 时间粒度选择器
│   │   │   └── index.ts                # 组件导出
│   │   │
│   │   ├── common/                # 通用 UI 组件
│   │   └── layout/                # 布局组件
│   │
│   ├── data/
│   │   ├── dimensions.ts          # 维度元数据定义
│   │   ├── metrics.ts             # 指标元数据定义
│   │   ├── mockGenerator.ts       # Mock 数据生成器
│   │   └── index.ts               # 数据导出
│   │
│   ├── lib/
│   │   ├── comparison.ts          # 对比计算逻辑（环比/同比）
│   │   └── utils.ts               # 通用工具函数（cn 样式合并等）
│   │
│   └── types/
│       ├── dimension.ts           # 维度类型定义
│       ├── metric.ts              # 指标类型定义
│       ├── query.ts               # 查询状态类型定义
│       └── index.ts               # 类型导出
│
├── index.html                     # HTML 入口
├── package.json                   # 项目配置与依赖
├── tsconfig.json                  # TypeScript 配置
├── vite.config.ts                 # Vite 构建配置
├── tailwind.config.js             # Tailwind CSS 配置
└── postcss.config.js              # PostCSS 配置
```

---

## 🔧 核心组件说明

### 维度系统 (Dimensions)

维度分为 4 个组别，共 10 个维度：

| 组别 | 维度 | 说明 |
|------|------|------|


### 指标系统 (Metrics)

指标分为 5 个主题，包含完整的订单漏斗和业务监控指标：

| 主题 | 子分组 | 典型指标 |
|------|--------|----------|


### 对比模式 (Comparison)

支持多种时间对比模式：

| 时间粒度 | 支持的对比类型 |
|----------|----------------|
| 小时 | 环比（上一小时）、日环比、周环比、月环比 |
| 日 | 日环比（昨日）、周环比、月环比 |
| 周 | 周环比（上周）、月环比 |
| 月 | 月环比（上月） |

---

## 🎨 设计哲学

我们相信 **"数据是有温度的"**。通过深色模式、流畅的动效以及合理的间距设计，我们将单调的数据探索转化为一种愉悦的交互体验。

- **Glassmorphism 特效**: 现代玻璃态视觉效果
- **响应式设计**: 适配不同屏幕尺寸
- **无障碍支持**: 遵循 WCAG 标准的交互设计
- **精密间距系统**: 每一个 padding 和 font-weight 都经过精心计算

---

## 🔌 扩展指南

### 添加新维度

在 `src/data/dimensions.ts` 中添加维度定义：

```typescript
export const METADATA_DIMS: Dimension[] = [
    // ... 现有维度
    {
        id: 'new_dim',
        name: '新维度',
        group: '业务',
        description: '新维度描述',
        isCore: false
    }
];
```

### 添加新指标

在 `src/data/metrics.ts` 中添加指标定义：

```typescript
export const INITIAL_METRICS: Metric[] = [
    // ... 现有指标
    {
        id: 'new_metric',
        name: '新指标',
        group: '订单',
        subGroup: '订单漏斗',
        unit: '单',
        aggr: 'SUM',
        tags: ['core', 'realtime'],
        compatibleDims: ['dt', 'city', 'service_type'],
        compatibleGranularities: ['hour', 'day', 'week', 'month'],
        description: '新指标的业务描述',
        owner: '数据团队',
        updateFrequency: '实时',
        isStarred: false
    }
];
```

---

## 📝 开发规范

### 代码风格

- 使用 TypeScript 严格模式
- 组件使用函数式组件 + Hooks
- 样式使用 Tailwind CSS 原子类
- 使用 `cn()` 工具函数合并样式类

### 命名规范

- 组件文件：PascalCase（如 `DateRangePicker.tsx`）
- 工具函数：camelCase（如 `getValidComparisonTypes`）
- 类型定义：PascalCase（如 `QueryFilter`）
- 常量：UPPER_SNAKE_CASE（如 `METADATA_DIMS`）

---

## 🚀 部署

### 静态部署

构建后的 `dist/` 目录可直接部署到任意静态服务器：

```bash
npm run build
# 将 dist/ 目录部署到 Nginx、CDN 或其他静态托管服务
```

### Docker 启动 (开发模式)

本项目支持 Docker 一键启动开发环境：

```bash
# 启动服务
docker-compose up
```

访问地址：[http://localhost:5173](http://localhost:5173)

详细说明请参考 [DEPLOY.md](./DEPLOY.md)。

---

## 📄 License


---

## ☁️ Vercel 部署指南

本项目已配置 Vercel 适配文件，支持一键部署。

### 方式一：使用 Vercel CLI（推荐用于测试）

1. 全局安装 Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. 在项目根目录登录并部署:
   ```bash
   vercel login
   vercel
   ```
   一路回车即可。

3. 部署生产环境:
   ```bash
   vercel --prod
   ```

### 方式二：Git 集成（推荐用于生产）

1. 将代码推送到 GitHub/GitLab/Bitbucket。
2. 登录 [Vercel Dashboard](https://vercel.com/dashboard)。
3. 点击 **"Add New..."** -> **"Project"**。
4. 导入你的 Git 仓库。
5. **Framework Preset** 选择 `Vite`。
6. 点击 **"Deploy"**。

由于项目根目录已包含 `vercel.json`，路由重写规则会自动生效，确保刷新页面时不会出现 404 错误。

# SQL Builder BI - Self-Service Multi-Dimensional Analysis Platform (English)

## 🚀 Overview

**SQL Builder BI** is a premium self-service data exploration platform designed for fast-paced internet businesses. It abstracts complex SQL logic into intuitive UI interactions, enabling analysts and stakeholders to build sophisticated queries and gain insights without writing a single line of code.

---

## 📦 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0 or pnpm >= 8.0.0

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Visit http://localhost:5173

### Production Build

```bash
npm run build
```

---

## 📈 Use Cases (Analyst Perspective)

### 1. Core Dashboard Diagnosis
- **Scenario**: Monitoring daily GMV or order volume fluctuations.
- **Function**: Use "Statistical Period" (Time Granularity) and "Comparison Mode" to perform instant WoW/DoD analysis and pinpoint anomalies in seconds.

### 2. Fine-grained Operational Drill-down
- **Scenario**: Investigating a drop in conversion for specific service types.
- **Function**: Lock dimensions, add precision filters for city or vehicle type, and drill down from macro to micro levels effortlessly.

### 3. Multi-Metric Correlation
- **Scenario**: Evaluating marketing impact on both call and response volumes.
- **Function**: Multi-select metrics to observe correlations and trend overlapping in high-fidelity charts.

---

## ✨ Key Features

### 🛠 Flexible Query Building
- **Dimensions & Metrics**: Combine core and auxiliary dimensions freely. Built-in tooltips for metrics ensure data definition alignment across teams.
- **Smart Compatibility Check**: Automatic validation of dimension-metric compatibility.

### 🔍 Advanced Filtering (WHERE)
- **Comprehensive Filters**: Includes sophisticated date range pickers, sub-hour filtering, and dynamic dimension-based WHERE condition builders.
- **Operator Support**: IN / NOT IN filtering operators.

### 📊 Professional Visualizations
- **Multiple Chart Types**: Line, Bar, and Area charts.
- **Responsive Views**: Seamlessly renders results into high-quality charts and detailed data tables.
- **Comparison Analysis**: Built-in period-over-period comparison with multiple time granularities.

---

## 🛠 Tech Stack

| Category | Technology | Description |
|----------|------------|-------------|
| **Framework** | React 18 | Component-based UI |
| **Language** | TypeScript 5.2 | Type safety |
| **Build Tool** | Vite 5.3 | Fast HMR |
| **Styling** | Tailwind CSS 3.4 | Utility-first CSS |
| **State** | Zustand 5.0 | Minimal state management |
| **Charts** | Recharts 2.12 | D3-based React charts |
| **Date** | date-fns 3.6 | Modern date utility |
| **Icons** | Lucide React | Open source icons |
| **Animation** | Framer Motion 11 | Fluid animations |
| **Search** | Fuse.js 7.1 | Fuzzy search engine |

---

---

## 🎨 Design Philosophy

We believe **"Data should be lived"**. By combining sleek dark modes, fluid animations, and meticulous spacing, we turn tedious data exploration into a premium interactive experience.

---

## 📄 License

[MIT License](LICENSE)
