# SQL Builder BI - 自自助多维数据分析平台 / Self-Service Multi-Dimensional Analysis Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue.svg)](https://www.typescriptlang.org/)

## 🚀 项目简介 / Overview

**SQL Builder BI** 是一款专为大型互联网公司设计的自自助（Self-Service）多维数据分析平台。它基于“所见即所得”的设计理念，通过可视化的 UI 交互，将复杂的 SQL 查询逻辑抽象为直观的维度、指标和过滤条件选择，帮助数据分析师、产品经理和运营人员快速获取业务洞察。

**SQL Builder BI** is a premium self-service data exploration platform designed for fast-paced internet businesses. It abstracts complex SQL logic into intuitive UI interactions, enabling analysts and stakeholders to build sophisticated queries and gain insights without writing a single line of code.

---

## 📈 应用场景 / Use Cases (Analyst Perspective)

作为一名大型互联网公司的数据分析师，通常面临海量的业务数据和碎片化的指标需求。本平台针对以下典型场景进行了深度优化：

As a data analyst in a large internet firm, handling massive data and fragmented requirements is the norm. This platform is optimized for these core scenarios:

### 1. 核心看板快速诊断 / Core Dashboard Diagnosis
- **场景**: 每日早起观察 GMV 或订单量波动。
- **功能**: 通过“时间粒度”快速切换日/周/月视图，配合“对比模式”一键查看日环比 (DoD) 或周同比 (WoW)，秒级定位数据异常点。
- **Scenario**: Monitoring daily GMV or order volume fluctuations. Use "Time Granularity" and "Comparison Mode" to perform instant WoW/DoD analysis and pinpoint anomalies in seconds.

### 2. 精细化运营下钻分析 / Fine-grained Operational Drill-down
- **场景**: 当发现“服务类型”整体转化下降时。
- **功能**: 锁定该维度，进一步选定“城市”、“车型”或“供应商”，通过“维度筛选”增加精准 WHERE 条件，实现从全局到局部的逐层下钻。
- **Scenario**: Investigating a drop in conversion for specific service types. Lock dimensions, add precision filters for city or vehicle type, and drill down from macro to micro levels effortlessly.

### 3. 多指标关联分析 / Multi-Metric Correlation
- **场景**: 评估营销活动对“呼叫单量”与“应答单量”的协同影响。
- **功能**: 在“选择指标”区域勾选多个复合指标，通过联动图表实时观察不同指标间的趋势重合度及波动相关性。
- **Scenario**: Evaluating marketing impact on both call and response volumes. Multi-select metrics to observe correlations and trend overlapping in high-fidelity charts.

---

## ✨ 核心特性 / Key Features

### 🛠 极致灵活的查询构建 / Flexible Query Building
- **Dimensions & Metrics**: 支持核心维度（日期、城市）与辅助维度的自由组合。指标提供详细的悬浮说明（Tooltip），解决“口径对齐”痛点。
- **Dimensions & Metrics**: Combine core and auxiliary dimensions freely. Built-in tooltips for metrics ensure data definition alignment across teams.

### � 强大的 WHERE 过滤系统 / Advanced Filtering (WHERE)
- **多级筛选**: 包含日期（Date Picker）、小时（Hour Filter）以及基于维度的自定义过滤（Filter Builder）。
- **Comprehensive Filters**: Includes sophisticated date range pickers, sub-hour filtering, and dynamic dimension-based WHERE condition builders.

### � 专业级可视化效果 / Professional Visualizations
- **联动响应**: 查询结果自动渲染为趋势图（Line/Bar/Area）与明细数据表。
- **Responsive Views**: Seamlessly renders results into high-quality charts (powered by Recharts) and detailed data tables.

---

## 🛠 技术栈 / Tech Stack

- **React 18 & TypeScript**: 确保组件化开发的高效与类型安全。
- **Vite**: 极速的热更新开发体验。
- **Tailwind CSS**: 像素级还原现代、商务的 UI 设计（包含 Glassmorphism 特效）。
- **Zustand**: 轻量级、无样板代码的状态管理。
- **Recharts**: 灵活且功能强大的 D3.js 二次封装图表库。

---

## 📂 项目结构 / Structure

```text
src/
├── components/analysis/  # 核心 BI 组件 (图表、选择器、过滤器)
├── data/                 # 业务元数据 (维度定义、指标库)
├── lib/                  # 核心转换逻辑 (日期计算、SQL 抽象)
├── types/                # 严格的类型定义
└── App.tsx               # 模块聚合，支撑整个分层设计体系
```

---

## 📦 快速开始 / Quick Start

```bash
# 克隆仓库
git clone https://github.com/Hackerer/sql_builder_BI.git

# 安装依赖
npm install

# 本地开发
npm run dev

# 生产环境构建
npm run build
```

---

## 🎨 设计哲学 / Design Philosophy

我们相信 **“数据是有温度的”**。通过深色模式、流畅的动效以及合理的间距设计，我们将单调的数据探索转化为一种愉悦的交互体验。每一个间距（p-6, space-y-8）和每一个字体权重（font-bold vs font-semibold）都经过精密计算，以确保长时间工作下的视觉舒适度。

We believe **"Data should be lived"**. By combining sleek dark modes, fluid animations, and meticulous spacing, we turn tedious data exploration into a premium interactive experience.

---

## 📄 开源协议 / License

[MIT License](LICENSE)
