/**
 * Dimension Management Page
 * Manage and browse dimension assets with cross-table aggregation
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
    ArrowLeft, Save, Search, Hash, Filter, Download, Edit3,
    CheckSquare, Square, Minus, X, Plus, RefreshCcw, Trash2,
    Check, ChevronDown, Table2, Layers, Database, Eye, MoreHorizontal,
    Tag, Settings2, AlertCircle
} from 'lucide-react';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import type { Dimension, DimensionDataType } from './types';

interface DimensionManagementPageProps {
    dimensions: Dimension[];
    onUpdateDimensions: (newDimensions: Dimension[]) => void;
    onBack: () => void;
    embedded?: boolean;  // When true, hide the page header (used in unified config page)
}

// Dimension groups
const DIMENSION_GROUPS = ['时间', '地域', '业务', '用户', '渠道', '产品', '供应商', '车辆'];
const DATA_TYPES: { value: DimensionDataType; label: string; color: string }[] = [
    { value: 'string', label: '字符串', color: 'text-green-600 bg-green-500/10' },
    { value: 'number', label: '数值', color: 'text-blue-600 bg-blue-500/10' },
    { value: 'date', label: '日期', color: 'text-orange-600 bg-orange-500/10' },
    { value: 'boolean', label: '布尔', color: 'text-purple-600 bg-purple-500/10' },
];

const BUSINESS_OWNERS = [
    '张明 (履约PM)', '李娜 (用户增长PM)', '王强 (体验PM)', '刘洋 (供应链PM)',
    '陈静 (营销PM)', '赵伟 (财务PM)', '周芳 (运营PM)', '吴磊 (战略PM)'
];
const DATA_OWNERS = [
    '孙浩 (履约数据)', '钱丽 (用户数据)', '郑凯 (体验数据)', '冯雪 (供应链数据)',
    '蒋涛 (营销数据)', '沈婷 (财务数据)', '韩冰 (运营数据)', '杨帆 (平台数据)'
];

// Create empty dimension
const createEmptyDimension = (): Dimension => ({
    id: '',
    name: '',
    group: '业务',
    description: '',
    isEnumerable: false,
    enumValues: [],
    dataType: 'string',
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
});

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

    // Calculate dimension count for each group
    const getGroupDimensionCount = (group: string) => {
        return dimensions.filter(d => d.group === group).length;
    };

    // Add new group
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

    // Delete group
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

    // Start editing group
    const handleStartEdit = (group: string) => {
        setEditingGroupId(group);
        setEditingGroupName(group);
    };

    // Save edit
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

    // Save all changes
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
                    {/* Add new group */}
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

                    {/* Group list */}
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

// Dimension Editor Modal
interface DimensionEditorProps {
    dimension: Dimension | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (dimension: Dimension) => void;
    existingIds: string[];
    groups: string[];
}

function DimensionEditor({ dimension, isOpen, onClose, onSave, existingIds, groups }: DimensionEditorProps) {
    const [editingDimension, setEditingDimension] = useState<Dimension>(dimension || createEmptyDimension());
    const [errors, setErrors] = useState<Record<string, string>>({});
    const isNew = !dimension;

    React.useEffect(() => {
        if (dimension) {
            setEditingDimension(dimension);
        } else {
            setEditingDimension(createEmptyDimension());
        }
        setErrors({});
    }, [dimension, isOpen]);

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!editingDimension.id.trim()) {
            newErrors.id = '维度编码不能为空';
        } else if (isNew && existingIds.includes(editingDimension.id)) {
            newErrors.id = '维度编码已存在';
        } else if (!/^[a-z][a-z0-9_]*$/.test(editingDimension.id)) {
            newErrors.id = '编码需以小写字母开头，只能包含小写字母、数字和下划线';
        }

        if (!editingDimension.name.trim()) {
            newErrors.name = '维度名称不能为空';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (validate()) {
            onSave({
                ...editingDimension,
                updatedAt: new Date().toISOString(),
            });
        }
    };

    const updateField = <K extends keyof Dimension>(field: K, value: Dimension[K]) => {
        setEditingDimension(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
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
                className="bg-card border border-border rounded-2xl shadow-2xl w-[600px] max-h-[90vh] overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600">
                            <Hash size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">
                                {isNew ? '新建维度' : '编辑维度'}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                维度用于数据分组与筛选
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1.5">
                                维度编码 (Code) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={editingDimension.id}
                                onChange={(e) => updateField('id', e.target.value.toLowerCase())}
                                disabled={!isNew}
                                placeholder="例如: city_id"
                                className={cn(
                                    "w-full px-3 py-2.5 bg-background border rounded-lg text-sm font-mono",
                                    errors.id ? "border-red-500" : "border-border",
                                    !isNew && "opacity-60 cursor-not-allowed"
                                )}
                            />
                            {errors.id && <p className="text-xs text-red-500 mt-1">{errors.id}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5">
                                维度名称 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={editingDimension.name}
                                onChange={(e) => updateField('name', e.target.value)}
                                placeholder="例如: 城市"
                                className={cn(
                                    "w-full px-3 py-2.5 bg-background border rounded-lg text-sm",
                                    errors.name ? "border-red-500" : "border-border"
                                )}
                            />
                            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
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
                        <div>
                            <label className="block text-sm font-medium mb-1.5">数据类型</label>
                            <select
                                value={editingDimension.dataType || 'string'}
                                onChange={(e) => updateField('dataType', e.target.value as DimensionDataType)}
                                className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm"
                            >
                                {DATA_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1.5">来源表</label>
                            <input
                                type="text"
                                value={editingDimension.sourceTable || ''}
                                onChange={(e) => updateField('sourceTable', e.target.value)}
                                placeholder="例如: dws_order_day"
                                className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm font-mono"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5">来源字段</label>
                            <input
                                type="text"
                                value={editingDimension.sourceField || ''}
                                onChange={(e) => updateField('sourceField', e.target.value)}
                                placeholder="例如: city_id"
                                className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm font-mono"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1.5">业务负责人</label>
                            <select
                                value={editingDimension.businessOwner || ''}
                                onChange={(e) => updateField('businessOwner', e.target.value)}
                                className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm"
                            >
                                <option value="">请选择</option>
                                {BUSINESS_OWNERS.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5">数据负责人</label>
                            <select
                                value={editingDimension.dataOwner || ''}
                                onChange={(e) => updateField('dataOwner', e.target.value)}
                                className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm"
                            >
                                <option value="">请选择</option>
                                {DATA_OWNERS.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1.5">业务描述</label>
                        <textarea
                            value={editingDimension.description}
                            onChange={(e) => updateField('description', e.target.value)}
                            placeholder="描述该维度的业务含义..."
                            rows={3}
                            className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm resize-none"
                        />
                    </div>

                    {/* Enumeration Options */}
                    <div className="space-y-4 p-4 bg-muted/30 rounded-xl border border-border">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    checked={editingDimension.isEnumerable || false}
                                    onChange={(e) => updateField('isEnumerable', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-muted rounded-full peer-checked:bg-primary transition-colors"></div>
                                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full peer-checked:translate-x-5 transition-transform"></div>
                            </div>
                            <div>
                                <span className="text-sm font-medium">可枚举维度</span>
                                <p className="text-xs text-muted-foreground">启用后可管理维度的有限值集</p>
                            </div>
                        </label>

                        {/* Enumeration Value Management */}
                        {editingDimension.isEnumerable && (
                            <div className="space-y-3 pt-3 border-t border-border">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium">枚举值管理</label>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            // Simulate one-click query for latest values
                                            const mockValues = [
                                                `值1_${editingDimension.id}`,
                                                `值2_${editingDimension.id}`,
                                                `值3_${editingDimension.id}`
                                            ];
                                            updateField('enumValues', mockValues);
                                            updateField('enumLastUpdated', new Date().toISOString());
                                        }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-600 bg-purple-500/10 hover:bg-purple-500/20 rounded-lg transition-colors"
                                    >
                                        <RefreshCcw size={12} />
                                        一键查询最新值
                                    </button>
                                </div>

                                {/* Enum Values Display */}
                                <div className="flex flex-wrap gap-2">
                                    {(editingDimension.enumValues || []).map((value, idx) => (
                                        <span
                                            key={idx}
                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-background border border-border rounded-lg text-sm group"
                                        >
                                            {value}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newValues = (editingDimension.enumValues || []).filter((_, i) => i !== idx);
                                                    updateField('enumValues', newValues);
                                                }}
                                                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                                            >
                                                <X size={12} />
                                            </button>
                                        </span>
                                    ))}
                                    {(editingDimension.enumValues || []).length === 0 && (
                                        <span className="text-xs text-muted-foreground italic">暂无枚举值，点击“一键查询最新值”获取</span>
                                    )}
                                </div>

                                {editingDimension.enumLastUpdated && (
                                    <div className="text-xs text-muted-foreground">
                                        最后更新: {new Date(editingDimension.enumLastUpdated).toLocaleString('zh-CN')}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-border flex justify-between items-center bg-muted/30">
                    <div className="text-xs text-muted-foreground">
                        {isNew ? '创建新维度' : `最后更新: ${new Date(editingDimension.updatedAt || '').toLocaleString('zh-CN')}`}
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
                            {isNew ? '创建维度' : '保存更改'}
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

export default function DimensionManagementPage({
    dimensions,
    onUpdateDimensions,
    onBack,
    embedded = false
}: DimensionManagementPageProps) {
    // Core state
    const [localDimensions, setLocalDimensions] = useState<Dimension[]>(JSON.parse(JSON.stringify(dimensions)));
    const [searchTerm, setSearchTerm] = useState('');
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Filter state
    const [filterGroup, setFilterGroup] = useState<string>('');
    const [filterDataType, setFilterDataType] = useState<string>('');
    const [showFilters, setShowFilters] = useState(false);

    // Selection state
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Editor state
    const [editorOpen, setEditorOpen] = useState(false);
    const [editingDimension, setEditingDimension] = useState<Dimension | null>(null);

    // Group management state
    const [groups, setGroups] = useState<string[]>(DIMENSION_GROUPS);
    const [isGroupManagerOpen, setIsGroupManagerOpen] = useState(false);

    // Computed values
    const filteredDimensions = useMemo(() => {
        return localDimensions.filter(d => {
            const matchesSearch =
                d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                d.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                d.description.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesGroup = !filterGroup || d.group === filterGroup;
            const matchesDataType = !filterDataType || d.dataType === filterDataType;

            return matchesSearch && matchesGroup && matchesDataType;
        });
    }, [localDimensions, searchTerm, filterGroup, filterDataType]);

    const uniqueGroups = useMemo(() => [...new Set(localDimensions.map(d => d.group))], [localDimensions]);

    const isAllSelected = filteredDimensions.length > 0 && filteredDimensions.every(d => selectedIds.has(d.id));
    const isSomeSelected = filteredDimensions.some(d => selectedIds.has(d.id));

    // Cross-table aggregation view
    const dimensionAggregations = useMemo(() => {
        const aggregations = new Map<string, { tables: string[]; count: number }>();

        localDimensions.forEach(d => {
            if (d.sourceTable) {
                const key = d.id;
                if (aggregations.has(key)) {
                    const existing = aggregations.get(key)!;
                    if (!existing.tables.includes(d.sourceTable)) {
                        existing.tables.push(d.sourceTable);
                        existing.count++;
                    }
                } else {
                    aggregations.set(key, { tables: [d.sourceTable], count: 1 });
                }
            }
        });

        return aggregations;
    }, [localDimensions]);

    // Handlers
    const handleSelectAll = useCallback(() => {
        if (isAllSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredDimensions.map(d => d.id)));
        }
    }, [isAllSelected, filteredDimensions]);

    const handleSelectOne = useCallback((id: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    }, []);

    const handleCreateDimension = () => {
        setEditingDimension(null);
        setEditorOpen(true);
    };

    const handleEditDimension = (dimension: Dimension) => {
        setEditingDimension(dimension);
        setEditorOpen(true);
    };

    const handleSaveDimension = (dimension: Dimension) => {
        setLocalDimensions(prev => {
            const existingIndex = prev.findIndex(d => d.id === dimension.id);
            if (existingIndex >= 0) {
                const newDimensions = [...prev];
                newDimensions[existingIndex] = dimension;
                return newDimensions;
            } else {
                return [...prev, dimension];
            }
        });
        setHasUnsavedChanges(true);
        setEditorOpen(false);
    };

    const handleDeleteSelected = () => {
        if (selectedIds.size === 0) return;
        if (window.confirm(`确定要删除选中的 ${selectedIds.size} 个维度吗？`)) {
            setLocalDimensions(prev => prev.filter(d => !selectedIds.has(d.id)));
            setSelectedIds(new Set());
            setHasUnsavedChanges(true);
        }
    };

    const saveChanges = useCallback(() => {
        onUpdateDimensions(localDimensions);
        setHasUnsavedChanges(false);
    }, [localDimensions, onUpdateDimensions]);

    const resetChanges = useCallback(() => {
        if (window.confirm('确定要放弃所有未保存的更改吗？')) {
            setLocalDimensions(JSON.parse(JSON.stringify(dimensions)));
            setHasUnsavedChanges(false);
            setSelectedIds(new Set());
        }
    }, [dimensions]);

    return (
        <div className="min-h-screen bg-[#f5f7fa] flex flex-col">
            {/* Header - hidden in embedded mode */}
            {!embedded && (
                <header className="border-b border-border bg-card shadow-sm sticky top-0 z-30">
                    <div className="max-w-[1800px] mx-auto px-6 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button onClick={onBack} className="p-2 hover:bg-muted rounded-full transition-colors">
                                <ArrowLeft size={20} />
                            </button>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-500/10 rounded-lg">
                                    <Hash className="text-purple-600" size={20} />
                                </div>
                                <div>
                                    <h1 className="text-lg font-bold">维度管理</h1>
                                    <p className="text-xs text-muted-foreground">
                                        管理 {localDimensions.length} 个维度
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {hasUnsavedChanges && (
                                <span className="text-xs text-amber-500 font-medium animate-pulse flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                                    有未保存的更改
                                </span>
                            )}
                            <button
                                onClick={resetChanges}
                                disabled={!hasUnsavedChanges}
                                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg disabled:opacity-50 transition-colors flex items-center gap-2"
                            >
                                <RefreshCcw size={16} /> 放弃
                            </button>
                            <button
                                onClick={saveChanges}
                                disabled={!hasUnsavedChanges}
                                className="px-5 py-2 text-sm font-bold bg-primary text-primary-foreground rounded-lg disabled:opacity-50 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                            >
                                <Save size={16} /> 保存
                            </button>
                        </div>
                    </div>
                </header>
            )}

            {/* Batch Action Bar */}
            <AnimatePresence>
                {selectedIds.size > 0 && (
                    <motion.div
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -50, opacity: 0 }}
                        className="sticky top-16 z-20 bg-purple-600 text-white shadow-lg"
                    >
                        <div className="max-w-[1800px] mx-auto px-6 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <span className="font-medium">已选择 {selectedIds.size} 个维度</span>
                                <button onClick={() => setSelectedIds(new Set())} className="text-sm underline opacity-80 hover:opacity-100">
                                    取消选择
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={handleDeleteSelected} className="px-3 py-1.5 bg-red-500/30 hover:bg-red-500/50 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5">
                                    <Trash2 size={14} /> 删除
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="flex-1 p-6 max-w-[1800px] mx-auto w-full space-y-6">
                {/* Toolbar */}
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="relative w-72">
                            <Search size={16} className="absolute left-3 top-2.5 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="搜索维度..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-muted/30 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>

                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={cn(
                                "px-3 py-2 border rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                                showFilters ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"
                            )}
                        >
                            <Filter size={16} />
                            筛选
                            {(filterGroup || filterDataType) && (
                                <span className="px-1.5 py-0.5 bg-primary text-primary-foreground rounded text-xs">
                                    {[filterGroup, filterDataType].filter(Boolean).length}
                                </span>
                            )}
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
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
                    </div>
                </div>

                {/* Filter Panel */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="p-4 bg-muted/30 rounded-lg border border-border flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <label className="text-sm text-muted-foreground">分组:</label>
                                    <select
                                        value={filterGroup}
                                        onChange={(e) => setFilterGroup(e.target.value)}
                                        className="px-3 py-1.5 bg-background border border-border rounded-md text-sm"
                                    >
                                        <option value="">全部</option>
                                        {uniqueGroups.map(g => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                </div>

                                <div className="flex items-center gap-2">
                                    <label className="text-sm text-muted-foreground">数据类型:</label>
                                    <select
                                        value={filterDataType}
                                        onChange={(e) => setFilterDataType(e.target.value)}
                                        className="px-3 py-1.5 bg-background border border-border rounded-md text-sm"
                                    >
                                        <option value="">全部</option>
                                        {DATA_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                </div>

                                {(filterGroup || filterDataType) && (
                                    <button
                                        onClick={() => {
                                            setFilterGroup('');
                                            setFilterDataType('');
                                        }}
                                        className="text-sm text-primary hover:underline"
                                    >
                                        清除筛选
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Table */}
                <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                                <tr>
                                    <th className="px-4 py-4 w-12">
                                        <button onClick={handleSelectAll} className="p-1 hover:bg-muted rounded transition-colors">
                                            {isAllSelected ? <CheckSquare size={18} className="text-purple-600" /> :
                                                isSomeSelected ? <Minus size={18} className="text-purple-600" /> :
                                                    <Square size={18} />}
                                        </button>
                                    </th>
                                    <th className="px-4 py-4 w-36 min-w-[140px]">维度 Code</th>
                                    <th className="px-4 py-4 w-32 min-w-[100px]">维度名称</th>
                                    <th className="px-4 py-4 w-24">分组</th>
                                    <th className="px-4 py-4 w-24">数据类型</th>
                                    <th className="px-4 py-4 w-40">来源表</th>
                                    <th className="px-4 py-4 w-24">可枚举</th>
                                    <th className="px-4 py-4">描述</th>
                                    <th className="px-4 py-4 w-20">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredDimensions.map(dimension => {
                                    const isSelected = selectedIds.has(dimension.id);
                                    const typeConfig = DATA_TYPES.find(t => t.value === dimension.dataType) || DATA_TYPES[0];

                                    return (
                                        <tr key={dimension.id} className={cn("hover:bg-muted/20 transition-colors", isSelected && "bg-purple-500/5")}>
                                            <td className="px-4 py-4">
                                                <button onClick={() => handleSelectOne(dimension.id)} className="p-1 hover:bg-muted rounded transition-colors">
                                                    {isSelected ? <CheckSquare size={18} className="text-purple-600" /> : <Square size={18} className="text-muted-foreground" />}
                                                </button>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="px-1.5 py-0.5 bg-purple-500/10 rounded">
                                                        <Hash size={12} className="text-purple-600" />
                                                    </span>
                                                    <code className="text-sm font-bold font-mono text-foreground/80">{dimension.id}</code>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 font-medium">{dimension.name}</td>
                                            <td className="px-4 py-4">
                                                <span className="px-2 py-1 bg-muted rounded text-xs">{dimension.group}</span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className={cn("px-2 py-1 rounded text-xs font-medium", typeConfig.color)}>
                                                    {typeConfig.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                {dimension.sourceTable ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <Table2 size={12} className="text-muted-foreground" />
                                                        <code className="text-xs font-mono text-muted-foreground">{dimension.sourceTable}</code>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4">
                                                {dimension.isEnumerable ? (
                                                    <span className="px-2 py-0.5 bg-green-500/10 text-green-600 rounded text-xs font-medium">
                                                        可枚举 ({(dimension.enumValues || []).length})
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground text-xs">-</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-muted-foreground text-xs max-w-[200px] truncate">
                                                {dimension.description || '-'}
                                            </td>
                                            <td className="px-4 py-4">
                                                <button
                                                    onClick={() => handleEditDimension(dimension)}
                                                    className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                                                >
                                                    <Edit3 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {filteredDimensions.length === 0 && (
                        <div className="py-16 text-center text-muted-foreground">
                            <Hash size={48} className="mx-auto mb-4 opacity-30" />
                            <p className="mb-4">没有找到匹配的维度</p>
                            <button onClick={handleCreateDimension} className="text-primary hover:underline">
                                创建新维度
                            </button>
                        </div>
                    )}
                </div>
            </main>

            {/* Dimension Editor Modal */}
            <AnimatePresence>
                {editorOpen && (
                    <DimensionEditor
                        dimension={editingDimension}
                        isOpen={editorOpen}
                        onClose={() => setEditorOpen(false)}
                        onSave={handleSaveDimension}
                        existingIds={localDimensions.map(d => d.id)}
                        groups={groups}
                    />
                )}
            </AnimatePresence>

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
        </div>
    );
}
