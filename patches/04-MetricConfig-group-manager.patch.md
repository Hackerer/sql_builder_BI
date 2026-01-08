# 补丁4: MetricConfigPage - 实现分组管理功能

**文件**: `src/MetricConfigPage.tsx`

**说明**: 指标管理的分组功能与维度管理类似，可以复用相同的 GroupManagerModal 组件逻辑。

---

## 实施步骤

### 步骤1: 复制 GroupManagerModal 组件

从补丁3中复制 `GroupManagerModal` 组件代码，粘贴到 `MetricConfigPage.tsx` 文件开头(在 `MetricEditor` 组件之前)。

注意修改以下内容:
- Props 中的 `dimensions` 改为 `metrics`  
- `getGroupDimensionCount` 改为 `getGroupMetricCount`
- 提示文案中的"维度"改为"指标"

### 步骤2: 确认状态已存在

检查 `MetricConfigPage` 组件中是否已存在以下状态(约第1163-1166行):

```typescript
// Group management state
const [groups, setGroups] = useState<string[]>(DEFAULT_GROUPS);
const [isGroupManagerOpen, setIsGroupManagerOpen] = useState(false);
const [newGroupName, setNewGroupName] = useState('');
```

✅ 如果已存在,跳过此步骤
❌ 如果不存在,添加这些状态声明

### 步骤3: 确认"管理分组"按钮

查找约第1685-1690行,确认是否已有"管理分组"按钮:

```typescript
<button
    onClick={() => setIsGroupManagerOpen(true)}
    className="px-3 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2"
>
    <Layers size={16} />
    管理分组
</button>
```

✅ 如果已存在,确保 `onClick` 正确触发 `setIsGroupManagerOpen(true)`
❌ 如果不存在,在"新建指标"按钮之前添加

### 步骤4: 添加 GroupManagerModal 实例

在组件 return 语句的最后，`</div>` 之前添加:

```typescript
            {/* Group Manager Modal */}
            <AnimatePresence>
                {isGroupManagerOpen && (
                    <GroupManagerModal
                        isOpen={isGroupManagerOpen}
                        onClose={() => setIsGroupManagerOpen(false)}
                        groups={groups}
                        onUpdateGroups={setGroups}
                        metrics={localMetrics}  {/* 注意:这里是metrics,不是dimensions */}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
```

### 步骤5: 更新 MetricEditor 使用动态分组

确保 `MetricEditor` 组件接收 `groups` prop:

```typescript
<MetricEditor
    metric={editingMetric}
    isOpen={editorOpen}
    onClose={() => setEditorOpen(false)}
    onSave={handleSaveMetric}
    existingIds={localMetrics.map(m => m.id)}
    existingNames={localMetrics.map(m => m.name)}
    atomicMetrics={localMetrics.filter(m => m.metricType !== 'calculated')}
    groups={groups}  // 确保此行存在
/>
```

在 `MetricEditor` 组件的 props 接口中添加:

```typescript
interface MetricEditorProps {
    // ... 其他 props
    groups: string[];  // 添加此行
}
```

在分组选择器中使用 `groups` prop (约第769-777行):

```typescript
<div>
    <label className="block text-sm font-medium mb-1.5">分组</label>
    <select
        value={editingMetric.group}
        onChange={(e) => updateField('group', e.target.value)}
        className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm"
    >
        {groups.map((g: string) => <option key={g} value={g}>{g}</option>)}
    </select>
</div>
```

---

## 验证清单

完成后请验证以下功能:

- [ ] 点击"管理分组"按钮能打开模态框
- [ ] 可以添加新的指标分组  
- [ ] 可以编辑分组名称
- [ ] 可以删除没有指标的空分组
- [ ] 尝试删除有指标的分组时显示警告
- [ ] 新建/编辑指标时,分组下拉框显示更新后的分组列表
- [ ] 保存分组更改后,模态框关闭

---

## 完整的 GroupManagerModal 组件代码

```typescript
// Group Manager Modal Component (for Metrics)
interface GroupManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    groups: string[];
    onUpdateGroups: (groups: string[]) => void;
    metrics: Metric[];  // 注意:这里是 Metric 类型
}

function GroupManagerModal({ isOpen, onClose, groups, onUpdateGroups, metrics }: GroupManagerModalProps) {
    const [localGroups, setLocalGroups] = useState<string[]>(groups);
    const [newGroupName, setNewGroupName] = useState('');
    const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
    const [editingGroupName, setEditingGroupName] = useState('');

    React.useEffect(() => {
        setLocalGroups(groups);
    }, [groups, isOpen]);

    // 计算每个分组的指标数量
    const getGroupMetricCount = (group: string) => {
        return metrics.filter(m => m.group === group).length;
    };

    // 添加新分组
    const handleAddGroup = () => {
        const trimmed = newGroupName.trim();
        if (!trimmed) return;
        if (localGroups.includes(trimmed)) {
            alert('分组名称已存在');
            return;
        }
        setLocalGroups([...localGroups, trimmed]);
        setNewGroupName('');
    };

    // 删除分组
    const handleDeleteGroup = (group: string) => {
        const count = getGroupMetricCount(group);
        if (count > 0) {
            alert(`无法删除分组"${group}"，因为还有 ${count} 个指标使用此分组`);
            return;
        }
        if (window.confirm(`确定要删除分组"${group}"吗？`)) {
            setLocalGroups(localGroups.filter(g => g !== group));
        }
    };

    // 开始编辑分组
    const handleStartEdit = (group: string) => {
        setEditingGroupId(group);
        setEditingGroupName(group);
    };

    // 保存编辑
    const handleSaveEdit = () => {
        const trimmed = editingGroupName.trim();
        if (!trimmed) return;
        if (trimmed !== editingGroupId && localGroups.includes(trimmed)) {
            alert('分组名称已存在');
            return;
        }
        const newGroups = localGroups.map(g => g === editingGroupId ? trimmed : g);
        setLocalGroups(newGroups);
        setEditingGroupId(null);
        setEditingGroupName('');
    };

    // 保存所有更改
    const handleSave = () => {
        onUpdateGroups(localGroups);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-card border border-border rounded-2xl shadow-2xl w-[600px] max-h-[80vh] overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
                            <Layers size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">管理指标分组</h3>
                            <p className="text-xs text-muted-foreground">
                                创建、编辑或删除指标分组
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {/* 添加新分组 */}
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
                        <label className="text-sm font-medium mb-2 block">添加新分组</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newGroupName}
                                onChange={(e) => setNewGroupName(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleAddGroup()}
                                placeholder="输入分组名称..."
                                className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm"
                            />
                            <button
                                onClick={handleAddGroup}
                                disabled={!newGroupName.trim()}
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                            >
                                <Plus size={16} />
                                添加
                            </button>
                        </div>
                    </div>

                    {/* 分组列表 */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">现有分组 ({localGroups.length})</label>
                        {localGroups.map(group => {
                            const count = getGroupMetricCount(group);
                            const isEditing = editingGroupId === group;

                            return (
                                <div
                                    key={group}
                                    className="flex items-center justify-between p-3 bg-secondary/50 border border-border rounded-lg group hover:bg-secondary transition-colors"
                                >
                                    {isEditing ? (
                                        <div className="flex-1 flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={editingGroupName}
                                                onChange={(e) => setEditingGroupName(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
                                                className="flex-1 px-2 py-1 bg-background border border-border rounded text-sm"
                                                autoFocus
                                            />
                                            <button
                                                onClick={handleSaveEdit}
                                                className="p-1 text-green-600 hover:bg-green-500/10 rounded"
                                            >
                                                <Check size={16} />
                                            </button>
                                            <button
                                                onClick={() => setEditingGroupId(null)}
                                                className="p-1 text-muted-foreground hover:bg-muted rounded"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-3">
                                                <span className="font-medium">{group}</span>
                                                <span className="px-2 py-0.5 bg-blue-500/10 text-blue-600 rounded text-xs font-medium">
                                                    {count} 个指标
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleStartEdit(group)}
                                                    className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                                                    title="编辑"
                                                >
                                                    <Edit3 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteGroup(group)}
                                                    className="p-1.5 hover:bg-red-500/10 rounded text-muted-foreground hover:text-red-600"
                                                    title="删除"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-border flex justify-between items-center bg-muted/30">
                    <div className="text-xs text-muted-foreground">
                        💡 删除分组前需确保没有指标使用该分组
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                        >
                            取消
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-6 py-2 text-sm font-bold bg-primary text-primary-foreground rounded-lg transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
                        >
                            <Check size={16} />
                            保存更改
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
```

---

## 注意事项

1. **类型差异**: 指标使用 `Metric` 类型,维度使用 `Dimension` 类型
2. **图标颜色**: 指标分组使用蓝色主题,维度分组使用紫色主题
3. **状态检查**: 如果代码中已存在 `groups` 和 `isGroupManagerOpen` 状态,不要重复添加
4. **导入检查**: 确保 `Layers` 图标已从 `lucide-react` 导入

