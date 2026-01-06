# SQL Builder BI

A powerful, modern Business Intelligence (BI) analysis platform built with React, TypeScript, and Tailwind CSS. This project focuses on providing an intuitive interface for multi-dimensional data exploration and SQL-like query building.

![Screenshot](https://via.placeholder.com/800x400?text=SQL+Builder+BI+Interface)

## 🚀 Features

- **Multi-dimensional Selection**: Easily select and switch between different analysis dimensions (City, Supplier, Product Type, etc.).
- **Flexible Metric System**: Support for multiple metric selections with detailed tooltips and descriptions.
- **Advanced Filtering (WHERE)**:
    - **Date Range Picker**: Full dual-calendar view with preset shortcuts.
    - **Comparison Mode**: Built-in support for Day-over-Day (DoD), Week-over-Week (WoW), and custom period comparisons.
    - **Hour Filtering**: Precise hour-level data filtering.
    - **Dimension Filters**: Complex filter building for any available dimension.
- **Data Visualization**: Dynamic charts (Line, Bar, Area) powered by Recharts with smart axis handling and tooltips.
- **Detailed Data Table**: High-performance data table for granular inspection of queried results.
- **Responsive Management**: Clean, premium UI with a focus on information hierarchy and professional aesthetics.

## 🛠 Tech Stack

- **Framework**: [React 18](https://reactjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Charts**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Date Handling**: [date-fns](https://date-fns.org/)

## 📦 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Hackerer/sql_builder_BI.git
   cd sql_builder_BI
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## 📂 Project Structure

```text
src/
├── components/       # Reusable UI components
│   └── analysis/     # BI-specific components (Charts, Pickers, etc.)
├── data/             # Mock data and metadata definitions
├── lib/              # Utility functions and core logic
├── types/            # TypeScript type definitions
├── App.tsx           # Main application logic and layout
└── main.tsx          # Application entry point
```

## 🎨 Design Philosophy

The project adheres to a premium, information-dense design philosophy:
- **Clarity**: Bold typography and clear spatial grouping for different query sections.
- **Efficiency**: Minimized vertical scrolling by grouping filters and actions.
- **Feedback**: Immediate visual feedback for selections and query states.

## 📄 License

[MIT License](LICENSE)
