/**
 * 补丁1: UnifiedConfigPage - 调整标签页顺序
 * 文件: src/UnifiedConfigPage.tsx
 * 
 * 修改说明:
 * 1. 调整 TABS 数组顺序为: 表模型 → 指标 → 维度
 * 2. 修改默认 activeTab 为 'tables'
 * 3. 调整 TabContent 渲染顺序
 */

// ========== 修改点 1: TABS 数组 (第34-56行) ==========
// 【替换内容】找到 const TABS: ... 数组定义，替换为：

const TABS: { id: ConfigTab; label: string; icon: React.ElementType; description: string; color: string }[] = [
    {
        id: 'tables',
        label: '表模型管理',
        icon: Table2,
        description: '导入物理表结构',
        color: 'text-green-600 bg-green-500/10'
    },
    {
        id: 'metrics',
        label: '指标管理',
        icon: BarChart3,
        description: '定义和配置业务指标',
        color: 'text-blue-600 bg-blue-500/10'
    },
    {
        id: 'dimensions',
        label: '维度管理',
        icon: Hash,
        description: '管理分析维度属性',
        color: 'text-purple-600 bg-purple-500/10'
    },
];

// ========== 修改点 2: 默认 activeTab (第69行) ==========
// 【替换内容】找到 useState<ConfigTab>，替换为：

    const [activeTab, setActiveTab] = useState<ConfigTab>('tables');

// ========== 修改点 3: TabContent 渲染顺序 (第132-188行) ==========
// 【替换内容】找到 {/* Tab Content */} 的 main 标签，替换为：

            {/* Tab Content */}
            <main className="flex-1">
                <AnimatePresence mode="wait">
                    {activeTab === 'tables' && (
                        <motion.div
                            key="tables"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <TableManagementPage
                                onBack={() => {}} // Hide back button in embedded mode
                                onImportMetrics={onImportMetrics}
                                onImportDimensions={onImportDimensions}
                                existingMetricIds={existingMetricIds}
                                existingDimensionIds={existingDimensionIds}
                                embedded={true}
                            />
                        </motion.div>
                    )}

                    {activeTab === 'metrics' && (
                        <motion.div
                            key="metrics"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <MetricConfigPage
                                metrics={metrics}
                                onUpdateMetrics={onUpdateMetrics}
                                onBack={() => {}} // Hide back button in embedded mode
                                embedded={true}
                            />
                        </motion.div>
                    )}

                    {activeTab === 'dimensions' && (
                        <motion.div
                            key="dimensions"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <DimensionManagementPage
                                dimensions={dimensions}
                                onUpdateDimensions={onUpdateDimensions}
                                onBack={() => {}} // Hide back button in embedded mode
                                embedded={true}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

/**
 * 应用方法:
 * 1. 打开 src/UnifiedConfigPage.tsx
 * 2. 按照上述三个修改点，分别替换对应的代码块
 * 3. 保存文件
 * 
 * 验证:
 * - 打开元数据配置页面，默认显示"表模型管理"标签
 * - 标签顺序为: 表模型管理 → 指标管理 → 维度管理
 */
