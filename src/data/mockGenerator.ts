/**
 * Mock Data Generator Module
 * Generates realistic mock data for demo purposes
 * 
 * Enhanced to support:
 * - Hour-level data (0-23)
 * - City × Service Type combinations
 * - 120 days for comparison period support
 */

import { format, subDays } from 'date-fns';

// Core dimension values for structured data generation
const CITIES = ['北京市', '广州市', '宿迁市'];
const SERVICE_TYPES = ['普通出行', '接送机', '接送站'];

/**
 * Mock data row interface with hour support
 */
export interface MockDataRow {
    dt: string;
    hour: number;  // 0-23
    city: string;
    supplier: string;
    product_type: string;
    service_type: string;
    jkc_type: string;
    cancel_type: string;
    cancel_stage: string;
    vehicle_usage: string;
    asset_type: string;
    // Order metrics
    call_qty: number;
    call_qty_mom: string;
    call_qty_yoy: string;
    resp_qty: number;
    resp_qty_mom: string;
    resp_qty_yoy: string;
    pickup_qty: number;
    pickup_qty_mom: string;
    pickup_qty_yoy: string;
    board_qty: number;
    board_qty_mom: string;
    board_qty_yoy: string;
    depart_qty: number;
    depart_qty_mom: string;
    depart_qty_yoy: string;
    comp_qty: number;
    comp_qty_mom: string;
    comp_qty_yoy: string;
    pay_qty: number;
    pay_qty_mom: string;
    pay_qty_yoy: string;
    cancel_qty: number;
    cancel_qty_mom: string;
    cancel_qty_yoy: string;
    // User metrics
    call_user_cnt: number;
    call_user_cnt_mom: string;
    call_user_cnt_yoy: string;
    comp_user_cnt: number;
    comp_user_cnt_mom: string;
    comp_user_cnt_yoy: string;
    // Rate metrics
    resp_rate: string;
    resp_rate_mom: string;
    resp_rate_yoy: string;
    comp_rate: string;
    comp_rate_mom: string;
    comp_rate_yoy: string;
    cancel_rate: string;
    cancel_rate_mom: string;
    cancel_rate_yoy: string;
    pickup_rate: string;
    pickup_rate_mom: string;
    pickup_rate_yoy: string;
    // Duration metrics
    avg_resp_time: number;
    avg_resp_time_mom: string;
    avg_resp_time_yoy: string;
    avg_pickup_time: number;
    avg_pickup_time_mom: string;
    avg_pickup_time_yoy: string;
    extreme_good_rate: string;
    extreme_good_rate_mom: string;
    extreme_good_rate_yoy: string;
    // Vehicle metrics
    vehicle_cnt: number;
    vehicle_cnt_mom: string;
    vehicle_cnt_yoy: string;
    vehicle_online_hours: number;
    vehicle_online_hours_mom: string;
    vehicle_online_hours_yoy: string;
}

/**
 * Get random element from array
 */
function getRandomElement<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generate hourly traffic weight (simulates realistic traffic patterns)
 * Peak hours: 8-10, 17-19
 */
function getHourlyWeight(hour: number): number {
    if (hour >= 7 && hour <= 9) return 1.5;   // Morning peak
    if (hour >= 17 && hour <= 19) return 1.8; // Evening peak
    if (hour >= 0 && hour <= 5) return 0.2;   // Night
    if (hour >= 22 && hour <= 23) return 0.4; // Late night
    return 1.0; // Normal hours
}

/**
 * Generate city base multiplier
 */
function getCityMultiplier(city: string): number {
    switch (city) {
        case '北京市': return 1.5;
        case '广州市': return 1.2;
        case '宿迁市': return 0.5;
        default: return 1.0;
    }
}

/**
 * Generate mock data with hour-level granularity
 * @param days - Number of days to generate data for
 * @returns Array of mock data rows
 */
export function generateMockData(days: number = 120): MockDataRow[] {
    const rows: MockDataRow[] = [];

    for (let d = 0; d < days; d++) {
        const dateStr = format(subDays(new Date(), days - d), 'yyyy-MM-dd');

        // Generate data for each hour
        for (let hour = 0; hour < 24; hour++) {
            const hourWeight = getHourlyWeight(hour);

            // Generate data for key dimension combinations
            for (const city of CITIES) {
                for (const service of SERVICE_TYPES) {
                    const cityMultiplier = getCityMultiplier(city);

                    // Base values with realistic patterns
                    const baseCall = Math.floor(10 * hourWeight * cityMultiplier * (0.8 + Math.random() * 0.4));
                    const call_qty = Math.max(1, baseCall);
                    const resp_qty = Math.floor(call_qty * (0.75 + Math.random() * 0.15));
                    const pickup_qty = Math.floor(resp_qty * (0.95 + Math.random() * 0.05));
                    const board_qty = Math.floor(pickup_qty * (0.98 + Math.random() * 0.02));
                    const depart_qty = Math.floor(board_qty * (0.99 + Math.random() * 0.01));
                    const comp_qty = Math.floor(depart_qty * (0.98 + Math.random() * 0.02));
                    const pay_qty = Math.floor(comp_qty * (0.99 + Math.random() * 0.01));
                    const cancel_qty = Math.max(0, call_qty - comp_qty);

                    rows.push({
                        dt: dateStr,
                        hour: hour,
                        city: city,
                        service_type: service,
                        // Other dimensions - random for variety
                        supplier: getRandomElement(['小马', '文远']),
                        product_type: getRandomElement(['五座商务车', '四座商务车', '三座商务车']),
                        jkc_type: getRandomElement(['内部员工', '外部员工']),
                        cancel_type: getRandomElement(['用户取消', '司机取消', '系统取消']),
                        cancel_stage: getRandomElement(['应答前', '接驾中', '上车后']),
                        vehicle_usage: getRandomElement(['商业运营', '测试用车', '展示用车']),
                        asset_type: getRandomElement(['自有资产', '租赁资产', '合作方资产']),

                        // Order metrics
                        call_qty,
                        call_qty_mom: (Math.random() * 20 - 10).toFixed(1),
                        call_qty_yoy: (Math.random() * 30 - 15).toFixed(1),
                        resp_qty,
                        resp_qty_mom: (Math.random() * 20 - 10).toFixed(1),
                        resp_qty_yoy: (Math.random() * 30 - 15).toFixed(1),
                        pickup_qty,
                        pickup_qty_mom: (Math.random() * 20 - 10).toFixed(1),
                        pickup_qty_yoy: (Math.random() * 30 - 15).toFixed(1),
                        board_qty,
                        board_qty_mom: (Math.random() * 20 - 10).toFixed(1),
                        board_qty_yoy: (Math.random() * 30 - 15).toFixed(1),
                        depart_qty,
                        depart_qty_mom: (Math.random() * 20 - 10).toFixed(1),
                        depart_qty_yoy: (Math.random() * 30 - 15).toFixed(1),
                        comp_qty,
                        comp_qty_mom: (Math.random() * 20 - 10).toFixed(1),
                        comp_qty_yoy: (Math.random() * 30 - 15).toFixed(1),
                        pay_qty,
                        pay_qty_mom: (Math.random() * 20 - 10).toFixed(1),
                        pay_qty_yoy: (Math.random() * 30 - 15).toFixed(1),
                        cancel_qty,
                        cancel_qty_mom: (Math.random() * 40 - 20).toFixed(1),
                        cancel_qty_yoy: (Math.random() * 50 - 25).toFixed(1),

                        // User metrics
                        call_user_cnt: Math.floor(call_qty * 0.85),
                        call_user_cnt_mom: (Math.random() * 20 - 10).toFixed(1),
                        call_user_cnt_yoy: (Math.random() * 30 - 15).toFixed(1),
                        comp_user_cnt: Math.floor(comp_qty * 0.9),
                        comp_user_cnt_mom: (Math.random() * 20 - 10).toFixed(1),
                        comp_user_cnt_yoy: (Math.random() * 30 - 15).toFixed(1),

                        // Rate metrics
                        resp_rate: call_qty > 0 ? ((resp_qty / call_qty) * 100).toFixed(1) : '0.0',
                        resp_rate_mom: (Math.random() * 5 - 2.5).toFixed(1),
                        resp_rate_yoy: (Math.random() * 8 - 4).toFixed(1),
                        comp_rate: call_qty > 0 ? ((comp_qty / call_qty) * 100).toFixed(1) : '0.0',
                        comp_rate_mom: (Math.random() * 5 - 2.5).toFixed(1),
                        comp_rate_yoy: (Math.random() * 8 - 4).toFixed(1),
                        cancel_rate: call_qty > 0 ? ((cancel_qty / call_qty) * 100).toFixed(1) : '0.0',
                        cancel_rate_mom: (Math.random() * 5 - 2.5).toFixed(1),
                        cancel_rate_yoy: (Math.random() * 8 - 4).toFixed(1),
                        pickup_rate: resp_qty > 0 ? ((pickup_qty / resp_qty) * 100).toFixed(1) : '0.0',
                        pickup_rate_mom: (Math.random() * 5 - 2.5).toFixed(1),
                        pickup_rate_yoy: (Math.random() * 8 - 4).toFixed(1),

                        // Duration metrics
                        avg_resp_time: Math.floor(Math.random() * 60) + 30,
                        avg_resp_time_mom: (Math.random() * 10 - 5).toFixed(1),
                        avg_resp_time_yoy: (Math.random() * 15 - 7.5).toFixed(1),
                        avg_pickup_time: Math.floor(Math.random() * 300) + 180,
                        avg_pickup_time_mom: (Math.random() * 20 - 10).toFixed(1),
                        avg_pickup_time_yoy: (Math.random() * 30 - 15).toFixed(1),
                        extreme_good_rate: (80 + Math.random() * 19).toFixed(1),
                        extreme_good_rate_mom: (Math.random() * 4 - 2).toFixed(1),
                        extreme_good_rate_yoy: (Math.random() * 6 - 3).toFixed(1),

                        // Vehicle metrics
                        vehicle_cnt: Math.floor(Math.random() * 10) + 5,
                        vehicle_cnt_mom: (Math.random() * 10 - 5).toFixed(1),
                        vehicle_cnt_yoy: (Math.random() * 15 - 7.5).toFixed(1),
                        vehicle_online_hours: Math.floor(Math.random() * 50) + 20,
                        vehicle_online_hours_mom: (Math.random() * 20 - 10).toFixed(1),
                        vehicle_online_hours_yoy: (Math.random() * 30 - 15).toFixed(1),
                    });
                }
            }
        }
    }

    return rows;
}

/**
 * Pre-generated mock data
 * 120 days × 24 hours × 3 cities × 3 services = 25,920 rows
 */
export const MOCK_DATA = generateMockData(120);

// Re-export dimension values for compatibility
export const DIMENSION_VALUES = {
    city: CITIES,
    supplier: ['小马', '文远'],
    product_type: ['五座商务车', '四座商务车', '三座商务车'],
    service_type: SERVICE_TYPES,
    jkc_type: ['内部员工', '外部员工'],
    cancel_type: ['用户取消', '司机取消', '系统取消'],
    cancel_stage: ['应答前', '接驾中', '上车后'],
    vehicle_usage: ['商业运营', '测试用车', '展示用车'],
    asset_type: ['自有资产', '租赁资产', '合作方资产'],
};
