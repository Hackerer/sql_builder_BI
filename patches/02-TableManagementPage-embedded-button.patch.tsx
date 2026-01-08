/**
 * 补丁2: TableManagementPage - 嵌入模式下添加"导入新表"按钮
 * 文件: src/TableManagementPage.tsx
 * 
 * 修改说明:
 * 在 LIST 视图的工具栏(Toolbar)中，当 embedded=true 时显示"导入新表"按钮
 * 
 * 问题: 当前嵌入模式下，header 被隐藏，导致"导入新表"按钮不可见
 * 解决: 在 Toolbar 区域添加条件渲染的按钮
 */

// ========== 修改点: Toolbar 区域 (第401-417行) ==========
// 【替换内容】找到 {/* Toolbar */} 部分，替换为：

                    {/* Toolbar */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="relative w-80">
                            <Search size={16} className="absolute left-3 top-2.5 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="搜索表名或备注..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-sm text-muted-foreground">
                                共 {filteredTables.length} 个表模型
                            </div>
                            {/* 🆕 嵌入模式下显示"导入新表"按钮 */}
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

/**
 * 应用方法:
 * 1. 打开 src/TableManagementPage.tsx
 * 2. 定位到第 401-417 行的 Toolbar 部分
 * 3. 替换整个 <div className="flex items-center justify-between mb-6"> ... </div> 块
 * 4. 保存文件
 * 
 * 验证:
 * 1. 打开元数据配置 → 表模型管理标签
 * 2. 确认工具栏右侧显示"导入新表"按钮
 * 3. 点击按钮应该能够打开导入向导
 * 
 * 注意:
 * - 确保 handleAddNewTable 函数存在(第326-333行)
 * - Plus 图标已导入(第12行)
 */
