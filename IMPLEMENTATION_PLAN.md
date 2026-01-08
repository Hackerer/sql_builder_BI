# 元数据配置优化实施计划

## 📋 任务清单

### ✅ 已完成
1. **代码阅读与分析** - 完成所有关键文件的阅读和理解

### 🔧 待实施

#### 高优先级任务

**任务1: UnifiedConfigPage 标签页顺序调整**
- 文件: `src/UnifiedConfigPage.tsx`
- 修改内容:
  - 调整 TABS 数组顺序为: tables → metrics → dimensions
  - 修改默认 activeTab 为 'tables'
  - 调整 TabContent 渲染顺序

**任务2: TableManagementPage 嵌入模式按钮修复**  
- 文件: `src/TableManagementPage.tsx`
- 位置: 第 401-417 行 (LIST 视图的 Toolbar 部分)
- 修改内容:
  ```tsx
  {/* Toolbar - 添加嵌入模式按钮 */}
  <div className="flex items-center justify-between mb-6">
      <div className="relative w-80">
          <Search ... />
          <input ... />
      </div>
      <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
              共 {filteredTables.length} 个表模型
          </div>
          {/* 新增: 嵌入模式下显示"导入新表"按钮 */}
          {embedded && (
              <button
                  onClick={handleAddNewTable}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
              >
                  <Plus size={18} />
                  导入新表
              </button>
          )}
      </div>
  </div>
  ```

**任务3: 维度管理 - 分组管理功能**
- 文件: `src/DimensionManagementPage.tsx`
- 功能需求:
  1. 添加"管理分组"按钮 (位于"新建维度"按钮旁边)
  2. 创建 GroupManagerModal 组件:
     - 显示所有分组及每个分组的维度数量
     - 支持创建新分组 (内联输入)
     - 支持删除分组 (有维度时不允许删除并显示警告)
     - 支持编辑分组名称
  3. 在维度编辑器的分组下拉框中支持内联创建新分组
- 实现方案: 
  - 使用 state 管理分组列表 (初始化为 DIMENSION_GROUPS)
  - 分组数据持久化到 localStorage

**任务4: 指标管理 - 分组管理功能**
- 文件: `src/MetricConfigPage.tsx`  
- 功能需求: 同维度管理,但针对指标分组
- 位置: 第 1684-1690 行附近 (已有"管理分组"按钮)
- 状态: 按钮已存在,需实现对应的模态框和逻辑
- 实现方案:
  - 复用维度管理的 GroupManagerModal 组件
  - 使用 groups state (已存在)

**任务5: FilterBuilder 优化 - 即时添加行模式**
- 文件: `src/components/analysis/FilterBuilder.tsx`
- 当前行为: 点击"+ 维度筛选"打开模态框选择
- 新行为:
  1. 点击"+ 维度筛选"立即添加一个空筛选行
  2. 每行包含三个内联下拉框:
     - 维度选择器
     - 操作符选择器 (IN / NOT IN)
     - 值多选器
  3. 每行右侧有删除按钮
  4. 支持连续添加多行
- UI 设计:
  ```tsx
  <div className="filter-row">
      <select>维度</select>
      <select>IN/NOT IN</select>
      <multi-select>值</multi-select>
      <button>删除</button>
  </div>
  ```

## 🎯 实施策略

### 分阶段执行
1. **阶段1**: 修复紧急问题 (任务1, 2) - 确保基本功能可用
2. **阶段2**: 实现分组管理 (任务3, 4) - 提升便捷性
3. **阶段3**: 优化交互体验 (任务5) - 提升效率

### 测试验证
每完成一个任务后验证:
- ✓ 功能正确性
- ✓ UI 交互流畅性
- ✓ 边界情况处理
- ✓ 响应式布局适配

## 📝 技术要点

### 状态管理
- 使用 React useState 管理组件内部状态
- 通过 props 回调函数同步状态到父组件
- 考虑使用 localStorage 持久化分组配置

### UI 组件
- 复用现有的 Modal 组件
- 保持设计语言一致性
- 使用 framer-motion 实现过渡动画
- 使用 lucide-react 图标库

### 代码质量
- 遵循现有代码风格
- 添加必要的类型定义
- 合理的错误处理和用户提示
- 代码注释清晰

## 🚀 执行计划

根据用户反馈,按需求优先级逐个实施:
1. 首先完成任务1和任务2 (基础修复)
2. 然后实现任务3和任务4 (核心功能)  
3. 最后优化任务5 (体验提升)

每个任务完成后进行代码审查和功能测试。
