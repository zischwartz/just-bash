/**
 * Execution Limits Configuration
 *
 * Centralized configuration for all execution limits to prevent runaway compute.
 * These limits can be overridden when creating a BashEnv instance.
 */
/** Liberal default shared by shell and standalone transform entry points. */
export const DEFAULT_MAX_SOURCE_BYTES = 64 * 1024 * 1024;
/**
 * Default execution limits.
 * These liberal compatibility defaults remain bounded. Select the hardened
 * profile for tighter untrusted-workload policy.
 */
const DEFAULT_LIMITS = {
    maxSourceBytes: DEFAULT_MAX_SOURCE_BYTES,
    maxExecDepth: 64,
    maxCallDepth: 100,
    maxCommandCount: 100000,
    maxLoopIterations: 100000,
    maxAwkIterations: 100000,
    maxSedIterations: 100000,
    // Core query evaluation now shares one aggregate work counter. Keep the
    // normal profile liberal enough for large, ordinary data transforms.
    maxJqIterations: 10_000_000,
    maxQueryTokens: 100000,
    maxQueryDepth: 1000,
    maxQueryElements: 1000000,
    maxAwkParserTokens: 100000,
    maxAwkParserDepth: 256,
    maxAwkParserOperations: 1000000,
    maxCsvRows: 1000000,
    maxCsvCells: 10000000,
    // Aggregate across an entire exec(), including large CSV/query transforms.
    // Keep normal mode comfortably above the per-resource row/element limits;
    // hardened mode below provides the tighter untrusted-workload ceiling.
    maxWorkUnits: 100_000_000,
    maxTraversalEntries: 1_000_000,
    maxTraversalDepth: 1_000,
    maxTraversalWork: 1_000_000,
    maxLiveBytes: 512 * 1024 * 1024,
    maxInputBytes: 512 * 1024 * 1024,
    maxFileSystemBytes: 1024 * 1024 * 1024,
    maxDatabaseBytes: 1024 * 1024 * 1024,
    maxDatabaseResultBytes: 256 * 1024 * 1024,
    maxArchiveBytes: 1024 * 1024 * 1024,
    maxArchiveCompressedBytes: 512 * 1024 * 1024,
    maxArchiveEntryBytes: 512 * 1024 * 1024,
    maxArchiveEntries: 1000000,
    maxWorkerMessageBytes: 64 * 1024 * 1024,
    // Prior releases had no top-level deadline. Keep normal compatibility-safe
    // for long real workloads while retaining a finite defense-in-depth bound.
    maxExecutionTimeMs: 60 * 60 * 1000,
    maxExtensionCleanupTimeMs: 100,
    maxSqliteTimeoutMs: 30000,
    maxPythonTimeoutMs: 30000,
    maxJsTimeoutMs: 30000,
    maxJsBridgeRequests: 1_000_000,
    maxGlobOperations: 1000000,
    maxStringLength: 64 * 1024 * 1024,
    maxArrayElements: 1000000,
    maxHeredocSize: 64 * 1024 * 1024,
    maxSubstitutionDepth: 50,
    maxBraceExpansionResults: 100000,
    maxOutputSize: 256 * 1024 * 1024,
    maxFileDescriptors: 4096,
    maxSourceDepth: 100,
};
const HARDENED_LIMITS = {
    ...DEFAULT_LIMITS,
    maxSourceBytes: 8 * 1024 * 1024,
    maxCommandCount: 10_000,
    maxLoopIterations: 10_000,
    maxAwkIterations: 10_000,
    maxSedIterations: 10_000,
    maxJqIterations: 10_000,
    maxSqliteTimeoutMs: 5_000,
    maxPythonTimeoutMs: 10_000,
    maxJsTimeoutMs: 10_000,
    maxJsBridgeRequests: 100_000,
    maxExtensionCleanupTimeMs: 25,
    maxGlobOperations: 100_000,
    maxStringLength: 10 * 1024 * 1024,
    maxArrayElements: 100_000,
    maxHeredocSize: 10 * 1024 * 1024,
    maxBraceExpansionResults: 10_000,
    maxOutputSize: 10 * 1024 * 1024,
    maxFileDescriptors: 1_024,
    maxQueryTokens: 25_000,
    maxQueryDepth: 256,
    maxQueryElements: 100_000,
    maxAwkParserTokens: 25_000,
    maxAwkParserDepth: 128,
    maxAwkParserOperations: 100_000,
    maxCsvRows: 100_000,
    maxCsvCells: 1_000_000,
    maxWorkUnits: 100_000,
    maxTraversalEntries: 100_000,
    maxTraversalDepth: 256,
    maxTraversalWork: 100_000,
    maxLiveBytes: 64 * 1024 * 1024,
    maxInputBytes: 32 * 1024 * 1024,
    maxFileSystemBytes: 128 * 1024 * 1024,
    maxDatabaseBytes: 64 * 1024 * 1024,
    maxDatabaseResultBytes: 16 * 1024 * 1024,
    maxArchiveBytes: 128 * 1024 * 1024,
    maxArchiveCompressedBytes: 64 * 1024 * 1024,
    maxArchiveEntryBytes: 64 * 1024 * 1024,
    maxArchiveEntries: 100_000,
    maxWorkerMessageBytes: 16 * 1024 * 1024,
    maxExecutionTimeMs: 30_000,
};
/**
 * Resolve execution limits by merging user-provided limits with defaults.
 */
export function resolveLimits(userLimits, profile = "normal") {
    if (profile !== "normal" && profile !== "hardened") {
        throw new RangeError(`executionLimitProfile must be "normal" or "hardened"`);
    }
    const defaults = profile === "hardened" ? HARDENED_LIMITS : DEFAULT_LIMITS;
    if (!userLimits) {
        return { ...defaults };
    }
    const resolved = {
        maxSourceBytes: userLimits.maxSourceBytes ?? defaults.maxSourceBytes,
        maxExecDepth: userLimits.maxExecDepth ?? defaults.maxExecDepth,
        maxCallDepth: userLimits.maxCallDepth ?? defaults.maxCallDepth,
        maxCommandCount: userLimits.maxCommandCount ?? defaults.maxCommandCount,
        maxLoopIterations: userLimits.maxLoopIterations ?? defaults.maxLoopIterations,
        maxAwkIterations: userLimits.maxAwkIterations ?? defaults.maxAwkIterations,
        maxSedIterations: userLimits.maxSedIterations ?? defaults.maxSedIterations,
        maxJqIterations: userLimits.maxJqIterations ?? defaults.maxJqIterations,
        maxQueryTokens: userLimits.maxQueryTokens ?? defaults.maxQueryTokens,
        maxQueryDepth: userLimits.maxQueryDepth ?? defaults.maxQueryDepth,
        maxQueryElements: userLimits.maxQueryElements ?? defaults.maxQueryElements,
        maxAwkParserTokens: userLimits.maxAwkParserTokens ?? defaults.maxAwkParserTokens,
        maxAwkParserDepth: userLimits.maxAwkParserDepth ?? defaults.maxAwkParserDepth,
        maxAwkParserOperations: userLimits.maxAwkParserOperations ?? defaults.maxAwkParserOperations,
        maxCsvRows: userLimits.maxCsvRows ?? defaults.maxCsvRows,
        maxCsvCells: userLimits.maxCsvCells ?? defaults.maxCsvCells,
        maxWorkUnits: userLimits.maxWorkUnits ?? defaults.maxWorkUnits,
        maxTraversalEntries: userLimits.maxTraversalEntries ?? defaults.maxTraversalEntries,
        maxTraversalDepth: userLimits.maxTraversalDepth ?? defaults.maxTraversalDepth,
        maxTraversalWork: userLimits.maxTraversalWork ?? defaults.maxTraversalWork,
        maxLiveBytes: userLimits.maxLiveBytes ?? defaults.maxLiveBytes,
        maxInputBytes: userLimits.maxInputBytes ?? defaults.maxInputBytes,
        maxFileSystemBytes: userLimits.maxFileSystemBytes ?? defaults.maxFileSystemBytes,
        maxDatabaseBytes: userLimits.maxDatabaseBytes ?? defaults.maxDatabaseBytes,
        maxDatabaseResultBytes: userLimits.maxDatabaseResultBytes ?? defaults.maxDatabaseResultBytes,
        maxArchiveBytes: userLimits.maxArchiveBytes ?? defaults.maxArchiveBytes,
        maxArchiveCompressedBytes: userLimits.maxArchiveCompressedBytes ??
            defaults.maxArchiveCompressedBytes,
        maxArchiveEntryBytes: userLimits.maxArchiveEntryBytes ?? defaults.maxArchiveEntryBytes,
        maxArchiveEntries: userLimits.maxArchiveEntries ?? defaults.maxArchiveEntries,
        maxWorkerMessageBytes: userLimits.maxWorkerMessageBytes ?? defaults.maxWorkerMessageBytes,
        maxExecutionTimeMs: userLimits.maxExecutionTimeMs ?? defaults.maxExecutionTimeMs,
        maxExtensionCleanupTimeMs: userLimits.maxExtensionCleanupTimeMs ??
            defaults.maxExtensionCleanupTimeMs,
        maxSqliteTimeoutMs: userLimits.maxSqliteTimeoutMs ?? defaults.maxSqliteTimeoutMs,
        maxPythonTimeoutMs: userLimits.maxPythonTimeoutMs ?? defaults.maxPythonTimeoutMs,
        maxJsTimeoutMs: userLimits.maxJsTimeoutMs ?? defaults.maxJsTimeoutMs,
        maxJsBridgeRequests: userLimits.maxJsBridgeRequests ?? defaults.maxJsBridgeRequests,
        maxGlobOperations: userLimits.maxGlobOperations ?? defaults.maxGlobOperations,
        maxStringLength: userLimits.maxStringLength ?? defaults.maxStringLength,
        maxArrayElements: userLimits.maxArrayElements ?? defaults.maxArrayElements,
        maxHeredocSize: userLimits.maxHeredocSize ?? defaults.maxHeredocSize,
        maxSubstitutionDepth: userLimits.maxSubstitutionDepth ?? defaults.maxSubstitutionDepth,
        maxBraceExpansionResults: userLimits.maxBraceExpansionResults ?? defaults.maxBraceExpansionResults,
        maxOutputSize: userLimits.maxOutputSize ?? defaults.maxOutputSize,
        maxFileDescriptors: userLimits.maxFileDescriptors ?? defaults.maxFileDescriptors,
        maxSourceDepth: userLimits.maxSourceDepth ?? defaults.maxSourceDepth,
    };
    for (const key of Object.keys(resolved)) {
        const value = resolved[key];
        if (value === Number.POSITIVE_INFINITY) {
            continue;
        }
        if (!Number.isSafeInteger(value) || value < 0) {
            throw new RangeError(`${key} must be a non-negative safe integer or positive Infinity`);
        }
    }
    return resolved;
}
