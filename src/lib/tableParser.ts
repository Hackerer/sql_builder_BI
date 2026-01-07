/**
 * Table Parser - SQL DDL Parsing Engine
 * Parses DESC table output and CREATE TABLE statements
 */

import type { ParsedField, ParseResult, FieldClassification } from '../types/table';

/**
 * Normalize SQL data type to a category
 */
function normalizeDataType(dataType: string): 'string' | 'numeric' | 'datetime' | 'boolean' | 'complex' {
    const type = dataType.toUpperCase().split('(')[0].trim();

    // Numeric types
    if (['INT', 'BIGINT', 'SMALLINT', 'TINYINT', 'DOUBLE', 'FLOAT', 'DECIMAL', 'NUMERIC', 'NUMBER', 'INTEGER'].includes(type)) {
        return 'numeric';
    }

    // DateTime types
    if (['DATE', 'DATETIME', 'TIMESTAMP', 'TIME'].includes(type)) {
        return 'datetime';
    }

    // Boolean types
    if (['BOOLEAN', 'BOOL'].includes(type)) {
        return 'boolean';
    }

    // Complex types
    if (['ARRAY', 'MAP', 'STRUCT', 'JSON'].includes(type)) {
        return 'complex';
    }

    // Default to string
    return 'string';
}

/**
 * Smart classification based on field name and data type
 */
function smartClassify(fieldName: string, dataType: string, comment: string): FieldClassification {
    const name = fieldName.toLowerCase();
    const typeCategory = normalizeDataType(dataType);
    const commentLower = comment.toLowerCase();

    // Common dimension patterns
    const dimensionPatterns = [
        /_id$/, /_code$/, /_type$/, /_name$/, /_key$/,
        /^dt$/, /^city/, /^province/, /^region/, /^country/,
        /^user_id/, /^driver_id/, /^order_id/, /^supplier/,
        /^is_/, /^has_/, /^flag_/
    ];

    // Common metric patterns
    const metricPatterns = [
        /_cnt$/, /_qty$/, /_num$/, /_count$/,
        /_amt$/, /_amount$/, /_sum$/, /_total$/,
        /_rate$/, /_ratio$/, /_pct$/, /_percent$/,
        /_avg$/, /_mean$/, /_duration$/, /_time$/,
        /^cnt_/, /^num_/, /^sum_/, /^total_/
    ];

    // Common hidden patterns
    const hiddenPatterns = [
        /^etl_/, /^dw_/, /^update_time$/, /^create_time$/,
        /^modified_at$/, /^created_at$/, /^_id$/, /^__/
    ];

    // Check hidden patterns first
    for (const pattern of hiddenPatterns) {
        if (pattern.test(name)) {
            return 'hidden';
        }
    }

    // Check comment for hints
    if (commentLower.includes('主键') || commentLower.includes('维度') || commentLower.includes('分区')) {
        return 'dimension';
    }
    if (commentLower.includes('指标') || commentLower.includes('数量') || commentLower.includes('金额')) {
        return 'metric';
    }

    // Check explicit patterns
    for (const pattern of metricPatterns) {
        if (pattern.test(name)) {
            return 'metric';
        }
    }

    for (const pattern of dimensionPatterns) {
        if (pattern.test(name)) {
            return 'dimension';
        }
    }

    // Type-based classification
    if (typeCategory === 'numeric') {
        // Numeric fields are likely metrics unless they look like IDs
        if (name.includes('id') || name.includes('code')) {
            return 'dimension';
        }
        return 'metric';
    }

    if (typeCategory === 'datetime') {
        return 'dimension';
    }

    if (typeCategory === 'string' || typeCategory === 'boolean') {
        return 'dimension';
    }

    // Default to hidden for complex types
    if (typeCategory === 'complex') {
        return 'hidden';
    }

    return 'dimension';
}

/**
 * Suggest aggregation function based on field characteristics
 */
function suggestAggregation(fieldName: string, dataType: string, comment: string): string {
    const name = fieldName.toLowerCase();
    const commentLower = comment.toLowerCase();

    // Count distinct for ID fields
    if (name.includes('user_id') || name.includes('driver_id') || name.includes('order_id')) {
        return 'COUNT_DISTINCT';
    }

    // Count for cnt/qty fields
    if (/_cnt$/.test(name) || /_qty$/.test(name) || /_num$/.test(name) || /_count$/.test(name)) {
        return 'SUM';
    }

    // AVG for rate/ratio fields
    if (/_rate$/.test(name) || /_ratio$/.test(name) || /_pct$/.test(name) || /_avg$/.test(name)) {
        return 'AVG';
    }

    // MAX/MIN for time duration
    if (/_duration$/.test(name) || /_time$/.test(name)) {
        return 'AVG';
    }

    // Check comment hints
    if (commentLower.includes('平均') || commentLower.includes('均值')) {
        return 'AVG';
    }
    if (commentLower.includes('去重') || commentLower.includes('唯一')) {
        return 'COUNT_DISTINCT';
    }
    if (commentLower.includes('最大')) {
        return 'MAX';
    }
    if (commentLower.includes('最小')) {
        return 'MIN';
    }

    // Default to SUM for numeric
    return 'SUM';
}

/**
 * Parse Hive DESC table output format
 * Format: field_name    data_type    comment
 */
export function parseDescOutput(input: string): ParseResult {
    const lines = input.trim().split('\n');
    const fields: ParsedField[] = [];
    const errors: string[] = [];

    let tableName = '';
    let inPartitionSection = false;
    let tableComment = '';

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Skip empty lines
        if (!line) continue;

        // Skip header separators
        if (line.startsWith('+-') || line.startsWith('|--') || line.startsWith('# ')) {
            continue;
        }

        // Detect partition section
        if (line.toLowerCase().includes('partition information') ||
            line.toLowerCase().includes('# partition') ||
            line.toLowerCase().startsWith('# col_name')) {
            inPartitionSection = true;
            continue;
        }

        // Extract table name from comments or specific lines
        const tableNameMatch = line.match(/(?:Table|table):\s*(\w+)/);
        if (tableNameMatch) {
            tableName = tableNameMatch[1];
            continue;
        }

        // Parse field line (tab or multiple space separated)
        // Common formats:
        // field_name    STRING    comment
        // | field_name | STRING | comment |
        let parts: string[];

        if (line.startsWith('|') && line.endsWith('|')) {
            // Pipe-separated format
            parts = line.split('|').filter(p => p.trim()).map(p => p.trim());
        } else {
            // Tab or space separated
            parts = line.split(/\t+|\s{2,}/).filter(p => p.trim()).map(p => p.trim());
        }

        if (parts.length >= 2) {
            const fieldName = parts[0].replace(/^`|`$/g, '').trim();
            const dataType = parts[1].toUpperCase().trim();
            const comment = parts.slice(2).join(' ').replace(/^'|'$/g, '').trim();

            // Skip if looks like header
            if (fieldName.toLowerCase() === 'col_name' ||
                fieldName.toLowerCase() === 'name' ||
                fieldName.toLowerCase() === 'field' ||
                dataType === 'DATA_TYPE' ||
                dataType === 'TYPE') {
                continue;
            }

            // Skip if looks like metadata
            if (fieldName.startsWith('#') || fieldName.startsWith('--')) {
                continue;
            }

            const classification = smartClassify(fieldName, dataType, comment);

            fields.push({
                id: crypto.randomUUID(),
                fieldName,
                dataType,
                dataTypeCategory: normalizeDataType(dataType),
                comment,
                nullable: true,
                isPartition: inPartitionSection,
                classification,
                displayName: comment || fieldName,
                suggestedAggr: classification === 'metric' ? suggestAggregation(fieldName, dataType, comment) : undefined,
            });
        }
    }

    if (fields.length === 0) {
        errors.push('未能解析出任何字段，请检查输入格式');
        return { success: false, errors };
    }

    return {
        success: true,
        tableName: tableName || 'unknown_table',
        fields,
        tableComment,
    };
}

/**
 * Parse CREATE TABLE statement
 */
export function parseCreateTable(input: string): ParseResult {
    const errors: string[] = [];
    const fields: ParsedField[] = [];

    // Extract table name
    const tableNameMatch = input.match(/CREATE\s+(?:EXTERNAL\s+)?TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:`?(\w+)`?\.)?`?(\w+)`?/i);
    if (!tableNameMatch) {
        errors.push('无法解析表名，请检查CREATE TABLE语句格式');
        return { success: false, errors };
    }

    const database = tableNameMatch[1];
    const tableName = tableNameMatch[2];

    // Extract table comment
    const tableCommentMatch = input.match(/COMMENT\s*=?\s*['"](.*?)['"](?:\s*$|\s*;|\s+(?:ROW|STORED|LOCATION|TBLPROPERTIES))/is);
    const tableComment = tableCommentMatch ? tableCommentMatch[1] : '';

    // Extract column definitions
    // Find content between first ( and corresponding )
    const columnsMatch = input.match(/\(\s*([\s\S]*?)\s*\)\s*(?:COMMENT|PARTITIONED|ROW|STORED|LOCATION|TBLPROPERTIES|;|$)/i);
    if (!columnsMatch) {
        errors.push('无法解析字段定义，请检查括号内容');
        return { success: false, errors };
    }

    const columnsSection = columnsMatch[1];

    // Check for partition definition
    const partitionMatch = input.match(/PARTITIONED\s+BY\s*\(\s*([\s\S]*?)\s*\)/i);
    const partitionFields = new Set<string>();

    if (partitionMatch) {
        const partitionContent = partitionMatch[1];
        const partitionDefs = partitionContent.split(',');
        for (const def of partitionDefs) {
            const fieldMatch = def.trim().match(/`?(\w+)`?/);
            if (fieldMatch) {
                partitionFields.add(fieldMatch[1].toLowerCase());
            }
        }
    }

    // Parse each column definition
    // Handle cases like: field_name TYPE COMMENT 'comment',
    const columnDefs = columnsSection.split(/,(?![^()]*\))/);

    for (const colDef of columnDefs) {
        const trimmed = colDef.trim();
        if (!trimmed) continue;

        // Parse: field_name TYPE [NOT NULL] [DEFAULT ...] [COMMENT 'comment']
        const colMatch = trimmed.match(/`?(\w+)`?\s+(\w+(?:\([^)]+\))?)\s*(?:NOT\s+NULL)?\s*(?:DEFAULT\s+[^\s,]+)?\s*(?:COMMENT\s*['"](.*?)['"])?/i);

        if (colMatch) {
            const fieldName = colMatch[1];
            const dataType = colMatch[2].toUpperCase();
            const comment = colMatch[3] || '';

            // Skip if looks like constraint
            if (['PRIMARY', 'FOREIGN', 'UNIQUE', 'CHECK', 'INDEX', 'KEY', 'CONSTRAINT'].includes(fieldName.toUpperCase())) {
                continue;
            }

            const isPartition = partitionFields.has(fieldName.toLowerCase());
            const classification = smartClassify(fieldName, dataType, comment);

            fields.push({
                id: crypto.randomUUID(),
                fieldName,
                dataType,
                dataTypeCategory: normalizeDataType(dataType),
                comment,
                nullable: !trimmed.toUpperCase().includes('NOT NULL'),
                isPartition,
                classification,
                displayName: comment || fieldName,
                suggestedAggr: classification === 'metric' ? suggestAggregation(fieldName, dataType, comment) : undefined,
            });
        }
    }

    // Also parse partition columns if not already in fields
    if (partitionMatch) {
        const partitionContent = partitionMatch[1];
        const partitionDefs = partitionContent.split(',');

        for (const def of partitionDefs) {
            const pMatch = def.trim().match(/`?(\w+)`?\s+(\w+(?:\([^)]+\))?)\s*(?:COMMENT\s*['"](.*?)['"])?/i);

            if (pMatch) {
                const fieldName = pMatch[1];
                const existingField = fields.find(f => f.fieldName.toLowerCase() === fieldName.toLowerCase());

                if (!existingField) {
                    const dataType = pMatch[2].toUpperCase();
                    const comment = pMatch[3] || '';

                    fields.push({
                        id: crypto.randomUUID(),
                        fieldName,
                        dataType,
                        dataTypeCategory: normalizeDataType(dataType),
                        comment,
                        nullable: true,
                        isPartition: true,
                        classification: 'dimension', // Partition columns are always dimensions
                        displayName: comment || fieldName,
                    });
                } else {
                    existingField.isPartition = true;
                    existingField.classification = 'dimension';
                }
            }
        }
    }

    if (fields.length === 0) {
        errors.push('未能解析出任何字段');
        return { success: false, errors };
    }

    return {
        success: true,
        tableName,
        database,
        fields,
        tableComment,
    };
}

/**
 * Auto-detect input format and parse accordingly
 */
export function parseTableDefinition(input: string): ParseResult {
    const trimmed = input.trim();

    // Detect CREATE TABLE statement
    if (/^\s*CREATE\s+(?:EXTERNAL\s+)?TABLE/i.test(trimmed)) {
        return parseCreateTable(trimmed);
    }

    // Otherwise assume DESC output
    return parseDescOutput(trimmed);
}

/**
 * Sample DESC output for testing
 */
export const SAMPLE_DESC_OUTPUT = `
col_name                        data_type                       comment
dt                              STRING                          日期分区
city_id                         BIGINT                          城市ID
city_name                       STRING                          城市名称
supplier_id                     BIGINT                          供应商ID
supplier_name                   STRING                          供应商名称
service_type                    STRING                          服务类型
call_qty                        BIGINT                          呼单量
resp_qty                        BIGINT                          应答单量
pickup_qty                      BIGINT                          接驾单量
board_qty                       BIGINT                          上车单量
comp_qty                        BIGINT                          完单量
cancel_qty                      BIGINT                          取消量
call_user_cnt                   BIGINT                          呼单用户数
resp_rate                       DOUBLE                          应答率
pickup_rate                     DOUBLE                          接驾率
cancel_rate                     DOUBLE                          取消率
avg_pickup_duration             DOUBLE                          平均接驾时长(秒)
avg_wait_duration               DOUBLE                          平均等待时长(秒)
etl_update_time                 TIMESTAMP                       ETL更新时间
`;

/**
 * Sample CREATE TABLE for testing
 */
export const SAMPLE_CREATE_TABLE = `
CREATE EXTERNAL TABLE IF NOT EXISTS dws.dws_order_day (
    city_id BIGINT COMMENT '城市ID',
    city_name STRING COMMENT '城市名称',
    supplier_id BIGINT COMMENT '供应商ID',
    supplier_name STRING COMMENT '供应商名称',
    service_type STRING COMMENT '服务类型',
    call_qty BIGINT COMMENT '呼单量',
    resp_qty BIGINT COMMENT '应答单量',
    pickup_qty BIGINT COMMENT '接驾单量',
    board_qty BIGINT COMMENT '上车单量',
    comp_qty BIGINT COMMENT '完单量',
    cancel_qty BIGINT COMMENT '取消量',
    call_user_cnt BIGINT COMMENT '呼单用户数(去重)',
    resp_rate DOUBLE COMMENT '应答率',
    pickup_rate DOUBLE COMMENT '接驾率',
    cancel_rate DOUBLE COMMENT '取消率',
    avg_pickup_duration DOUBLE COMMENT '平均接驾时长(秒)',
    avg_wait_duration DOUBLE COMMENT '平均等待时长(秒)',
    etl_update_time TIMESTAMP COMMENT 'ETL更新时间'
)
COMMENT '订单日汇总表'
PARTITIONED BY (dt STRING COMMENT '日期分区')
STORED AS ORC
LOCATION 'hdfs://cluster/warehouse/dws/dws_order_day'
`;
