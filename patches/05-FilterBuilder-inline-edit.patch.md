# 补丁5: FilterBuilder - 即时添加行和内联编辑优化

**文件**: `src/components/analysis/FilterBuilder.tsx` 和 `src/App.tsx`

**目标**: 将 FilterBuilder 从模态框选择模式改为即时添加空行+内联编辑模式

---

## 问题分析

当前实现:
- 点击"+ 维度筛选"打开一个模态框
- 在模态框中选择维度、操作符、值
- 确认后添加筛选条件

问题:
- 每次只能添加一个筛选
- 需要打开/关闭模态框,效率低
- 添加多个筛选时重复操作繁琐

---

## 新的设计方案

### 交互流程
1. 点击"+ 维度筛选" → **立即添加一个空筛选行**
2. 每行包含三个内联选择器:
   - 维度下拉框
   - 操作符下拉框 (IN / NOT IN)
   - 值多选器
3. 每行右侧有删除按钮
4. 支持连续点击多次,添加多个空行

### UI 布局
```
[维度选择器 ▼] [IN ▼] [值多选器 ▼] [×删除]
[维度选择器 ▼] [NOT IN ▼] [值多选器 ▼] [×删除]
[+ 维度筛选]
```

---

## 实施步骤

### 步骤1: 在 App.tsx 中修改筛选相关代码

#### 1.1 修改筛选状态结构 (约第555-559行)

**替换为**:
```typescript
    // --- Filter Builder State ---
    const [filters, setFilters] = useState<QueryFilter[]>([]);
```

#### 1.2 移除旧的 FilterBuilder 相关状态

**删除以下代码**(约第555-559行):
```typescript
const [isFilterBuilderOpen, setIsFilterBuilderOpen] = useState(false);
const [newFilterDim, setNewFilterDim] = useState<string>('');
const [newFilterOperator, setNewFilterOperator] = useState<'IN' | 'NOT_IN'>('IN');
const [newFilterValues, setNewFilterValues] = useState<string[]>([]);
```

#### 1.3 添加新的筛选处理函数

**在第1120行附近添加**:
```typescript
// 添加空筛选行
const handleAddEmptyFilter = () => {
    const newFilter: QueryFilter = {
        id: `filter_${Date.now()}`,
        dimId: '',
        operator: 'IN',
        values: []
    };
    setQuery(prev => ({ ...prev, filters: [...prev.filters, newFilter] }));
};

// 更新筛选
const handleUpdateFilter = (filterId: string, updates: Partial<QueryFilter>) => {
    setQuery(prev => ({
        ...prev,
        filters: prev.filters.map(f => 
            f.id === filterId ? { ...f, ...updates } : f
        )
    }));
};

// 删除筛选
const handleRemoveFilter = (filterId: string) => {
    setQuery(prev => ({
        ...prev,
        filters: prev.filters.filter(f => f.id !== filterId)
    }));
};
```

#### 1.4 更新筛选UI渲染 (约第1755-1783行)

**替换整个"Existing Filters Display"部分**:
```typescript
                            {/* Filter Rows */}
                            {query.filters.length > 0 && (
                                <div className="space-y-2 mb-4">
                                    {query.filters.map(filter => (
                                        <div
                                            key={filter.id}
                                            className="flex items-center gap-2 p-3 bg-secondary/30 border border-border rounded-lg group"
                                        >
                                            {/* 维度选择器 */}
                                            <select
                                                value={filter.dimId}
                                                onChange={(e) => {
                                                    handleUpdateFilter(filter.id, { 
                                                        dimId: e.target.value,
                                                        values: [] // 切换维度时清空值
                                                    });
                                                }}
                                                className="px-3 py-2 bg-background border border-border rounded-lg text-sm min-w-[140px]"
                                            >
                                                <option value="">选择维度...</option>
                                                {METADATA_DIMS.filter(d => d.id !== 'dt').map(dim => (
                                                    <option key={dim.id} value={dim.id}>{dim.name}</option>
                                                ))}
                                            </select>

                                            {/* 操作符选择器 */}
                                            <select
                                                value={filter.operator}
                                                onChange={(e) => handleUpdateFilter(filter.id, { operator: e.target.value as 'IN' | 'NOT_IN' })}
                                                className="px-3 py-2 bg-background border border-border rounded-lg text-sm w-[120px]"
                                                disabled={!filter.dimId}
                                            >
                                                <option value="IN">包含 (IN)</option>
                                                <option value="NOT_IN">不包含 (NOT IN)</option>
                                            </select>

                                            {/* 值多选器 */}
                                            {filter.dimId && DIMENSION_VALUES[filter.dimId] ? (
                                                <div className="flex-1 flex flex-wrap gap-1 px-3 py-2 bg-background border border-border rounded-lg min-h-[40px]">
                                                    {DIMENSION_VALUES[filter.dimId].map(value => {
                                                        const isSelected = filter.values.includes(value);
                                                        return (
                                                            <button
                                                                key={value}
                                                                onClick={() => {
                                                                    const newValues = isSelected
                                                                        ? filter.values.filter(v => v !== value)
                                                                        : [...filter.values, value];
                                                                    handleUpdateFilter(filter.id, { values: newValues });
                                                                }}
                                                                className={cn(
                                                                    "px-2 py-0.5 text-xs rounded border transition-all",
                                                                    isSelected
                                                                        ? "bg-primary/10 border-primary text-primary font-medium"
                                                                        : "bg-muted border-border text-muted-foreground hover:border-primary/50"
                                                                )}
                                                            >
                                                                {isSelected && <Check size={10} className="inline mr-1" />}
                                                                {value}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="flex-1 px-3 py-2 bg-muted/30 border border-dashed border-border rounded-lg text-xs text-muted-foreground italic">
                                                    {filter.dimId ? '该维度暂无枚举值' : '请先选择维度'}
                                                </div>
                                            )}

                                            {/* 删除按钮 */}
                                            <button
                                                onClick={() => handleRemoveFilter(filter.id)}
                                                className="p-2 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                                                title="删除筛选"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
```

#### 1.5 更新"+ 维度筛选"按钮 (约第1727-1737行)

**替换按钮的 onClick 事件**:
```typescript
                                    {/* Add Dimension Filter Button */}
                                    <button
                                        onClick={handleAddEmptyFilter}
                                        className="text-xs px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors flex items-center gap-1 font-medium"
                                    >
                                        <Plus size={12} /> 维度筛选
                                    </button>
```

#### 1.6 移除旧的 FilterBuilder UI

**删除整个 Filter Builder (Expanded) 部分** (约第1983-2029行):
```typescript
{/* Filter Builder (Expanded) */}
{isFilterBuilderOpen && (
    // ... 删除整个块
)}
```

### 步骤2: 更新 FilterBuilder 组件 (可选)

由于我们在 App.tsx 中直接实现了新逻辑,`FilterBuilder.tsx` 组件可以保持不变或标记为废弃。

如果想清理,可以将该组件改为简单的筛选展示组件。

---

## 验证清单

完成后请验证以下功能:

- [ ] 点击"+ 维度筛选"立即添加一个空筛选行
- [ ] 可以连续点击多次,添加多个空行
- [ ] 每行可以独立选择维度、操作符、值
- [ ] 选择维度后,值选择器显示对应的枚举值
- [ ] 切换维度时,之前选择的值会被清空
- [ ] 点击值按钮可以切换选中/取消选中状态
- [ ] 鼠标悬停时显示删除按钮
- [ ] 点击删除按钮可以移除该筛选行
- [ ] 筛选条件正确应用到查询中

---

## 需要导入的组件

确保在 App.tsx 顶部已导入:

```typescript
import { Check } from 'lucide-react';
```

---

## 设计亮点

1. **即时反馈**: 点击添加立即看到新行,无需等待模态框
2. **批量操作**: 可以先添加多个空行,再逐一填写
3. **内联编辑**: 所有操作都在一个视图中完成,减少上下文切换
4. **视觉引导**: 
   - 未选择维度时显示提示文字
   - 已选值高亮显示
   - hover时显示删除按钮
5. **防呆设计**:
   - 未选择维度时,值选择器显示提示
   - 切换维度时自动清空之前的值选择

---

## 注意事项

1. **类型定义**: 确保 `QueryFilter` 类型包含 `id`, `dimId`, `operator`, `values` 字段
2. **维度值数据**: 确保 `DIMENSION_VALUES` 包含所有可枚举维度的值列表
3. **空筛选处理**: 在执行查询时,应过滤掉未完整填写的筛选(dimId为空或values为空)
4. **性能优化**: 如果筛选数量很多,考虑虚拟化渲染

