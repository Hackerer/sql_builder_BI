/**
 * Data Module - Unified Export
 * Single source of truth for all data
 */

// Metrics
export {
    INITIAL_METRICS,
    LABEL_GROUPS,
    AVAILABLE_TAGS,
    METRIC_GROUPS,
} from './metrics';

// Dimensions
export {
    METADATA_DIMS,
    DIMENSION_VALUES,
    DATE_PRESETS,
    TIME_GRANULARITIES,
    CHART_COLORS,
} from './dimensions';

// Mock Data
export {
    generateMockData,
    MOCK_DATA,
    type MockDataRow,
} from './mockGenerator';
