/**
 * 补丁3: DimensionManagementPage - 实现分组管理功能
 * 文件: src/DimensionManagementPage.tsx
 * 
 * 修改说明:
 * 1. 添加"管理分组"模态框组件
 * 2. 支持创建、编辑、删除分组
 * 3. 删除时检查是否有维度关联
 * 4. 在维度编辑器中支持内联创建新分组
 */

// ========== 新增组件: GroupManagerModal ==========
// 【在文件开头，DimensionEditor 组件之前添加】

// Group Manager Modal Component
interface GroupManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    groups: string[];
    onUpdateGroups: (groups: string[]) => void;
    dimensions: Dimension[];
}

function GroupManagerModal({ isOpen, onClose, groups, onUpdateGroups, dimensions }: GroupManagerModalProps) {
    const [localGroups, setLocalGroups] = useState<string[]>(groups);
    const [newGroupName, setNewGroupName] = useState('');
    const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
    const [editingGroupName, setEditingGroupName] = useState('');

    React.useEffect(() => {
        setLocalGroups(groups);
    }, [groups, isOpen]);

    // 计算每个分组的维度数量
    const getGroupDimensionCount = (group: string) => {
        return dimensions.filter(d => d.group === group).length;
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
        const count = getGroupDimensionCount(group);
        if (count > 0) {
            alert(`无法删除分组"${group}"，因为还有 ${count} 个维度使用此分组`);
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
                        <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600">
                            <Layers size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">管理维度分组</h3>
                            <p className="text-xs text-muted-foreground">
                                创建、编辑或删除维度分组
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
                            const count = getGroupDimensionCount(group);
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
                                                <span className="px-2 py-0.5 bg-purple-500/10 text-purple-600 rounded text-xs font-medium">
                                                    {count} 个维度
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
                        💡 删除分组前需确保没有维度使用该分组
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

// ========== 修改点 1: 添加状态管理 ==========
// 【在 DimensionManagementPage 组件内，现有 state 之后添加】

    // Group management state
    const [groups, setGroups] = useState<string[]>(DIMENSION_GROUPS);
    const [isGroupManagerOpen, setIsGroupManagerOpen] = useState(false);

// ========== 修改点 2: 添加"管理分组"按钮 ==========
// 【在 Toolbar 部分，"新建维度"按钮之前添加】
// 定位到第 622-628 行附近

                                    <button
                                        onClick={() => setIsGroupManagerOpen(true)}
                                        className="px-3 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2"
                                    >
                                        <Layers size={16} />
                                        管理分组
                                    </button>

                                    <button
                                        onClick={handleCreateDimension}
                                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                                    >
                                        <Plus size={16} />
                                        新建维度
                                    </button>

// ========== 修改点 3: 在 DimensionEditor 中使用动态分组 ==========
// 【修改 DimensionEditor 组件的 props，添加 groups】

interface DimensionEditorProps {
    dimension: Dimension | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (dimension: Dimension) => void;
    existingIds: string[];
    groups: string[];  // 🆕 添加此行
}

function DimensionEditor({ dimension, isOpen, onClose, onSave, existingIds, groups }: DimensionEditorProps) {
    // ... 组件内容保持不变，但在分组下拉框中使用 groups prop

    // 找到分组选择器部分(约第195-205行)，替换为：
                        <div>
                            <label className="block text-sm font-medium mb-1.5">维度分组</label>
                            <select
                                value={editingDimension.group}
                                onChange={(e) => updateField('group', e.target.value)}
                                className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm"
                            >
                                {groups.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>

// ========== 修改点 4: 在 return 语句末尾添加模态框 ==========
// 【在组件 return 的最后，</div> 之前添加】

            {/* Group Manager Modal */}
            <AnimatePresence>
                {isGroupManagerOpen && (
                    <GroupManagerModal
                        isOpen={isGroupManagerOpen}
                        onClose={() => setIsGroupManagerOpen(false)}
                        groups={groups}
                        onUpdateGroups={setGroups}
                        dimensions={localDimensions}
                    />
                )}
            </AnimatePresence>

// ========== 修改点 5: 传递 groups prop 到 DimensionEditor ==========
// 【修改 DimensionEditor 调用处，添加 groups prop】
// 约在第785-791行

                    <DimensionEditor
                        dimension={editingDimension}
                        isOpen={editorOpen}
                        onClose={() => setEditorOpen(false)}
                        onSave={handleSaveDimension}
                        existingIds={localDimensions.map(d => d.id)}
                        groups={groups}  // 🆕 添加此行
                    />

// ========== 需要导入的图标 ==========
// 【在文件顶部的 import 语句中添加缺失的图标】

import {
    // ... 现有导入
    Layers,  // 🆕 如果还没有导入
} from 'lucide-react';

/**
 * 应用方法:
 * 1. 按照上述修改点顺序，逐一修改 src/DimensionManagementPage.tsx
 * 2. 确保新增的 GroupManagerModal 组件放在 DimensionEditor 之前
 * 3. 保存文件
 * 
 * 验证:
 * 1. 打开维度管理页面
 * 2. 点击"管理分组"按钮，应该打开分组管理模态框
 * 3. 测试添加新分组
 * 4. 测试编辑分组名称
 * 5. 测试删除空分组
 * 6. 测试删除有维度的分组（应该显示警告）
 * 7. 在新建/编辑维度时，分组下拉框应显示更新后的分组列表
 */
