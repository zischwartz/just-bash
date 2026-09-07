/**
 * Execution Limits Configuration
 *
 * Centralized configuration for all execution limits to prevent runaway compute.
 * These limits can be overridden when creating a BashEnv instance.
 */
/**
 * Configuration for execution limits.
 * All limits are optional - undefined values use defaults.
 */
export interface ExecutionLimits {
    /** Maximum shell source bytes accepted before parsing (normal default: 64 MiB) */
    maxSourceBytes?: number;
    /** Maximum nested interpreter executions through ctx.exec (default: 64) */
    maxExecDepth?: number;
    /** Maximum function call/recursion depth (normal default: 100) */
    maxCallDepth?: number;
    /** Maximum number of commands to execute (normal default: 100000) */
    maxCommandCount?: number;
    /** Maximum loop iterations for bash while/for/until loops (normal default: 100000) */
    maxLoopIterations?: number;
    /** Maximum loop iterations for AWK while/for loops (normal default: 100000) */
    maxAwkIterations?: number;
    /** Maximum command iterations for SED branch loops (normal default: 100000) */
    maxSedIterations?: number;
    /** Maximum iterations for jq loops (normal default: 100000) */
    maxJqIterations?: number;
    /** Maximum jq/yq parser tokens (default: 100000) */
    maxQueryTokens?: number;
    /** Maximum jq/yq object/query traversal depth (default: 1000) */
    maxQueryDepth?: number;
    /** Maximum jq/yq result elements (default: 1000000) */
    maxQueryElements?: number;
    /** Maximum AWK parser tokens (default: 100000) */
    maxAwkParserTokens?: number;
    /** Maximum AWK parser nesting depth (default: 256) */
    maxAwkParserDepth?: number;
    /** Maximum AWK parser operations (default: 1000000) */
    maxAwkParserOperations?: number;
    /** Maximum parsed CSV rows (default: 1000000) */
    maxCsvRows?: number;
    /** Maximum parsed CSV cells (default: 10000000) */
    maxCsvCells?: number;
    /** Aggregate execution work units shared across nested execution (default: 1000000) */
    maxWorkUnits?: number;
    /** Maximum filesystem entries visited by one traversal (default: 1000000) */
    maxTraversalEntries?: number;
    /** Maximum filesystem traversal nesting depth (default: 1000) */
    maxTraversalDepth?: number;
    /** Maximum filesystem traversal operations (default: 1000000) */
    maxTraversalWork?: number;
    /** Maximum reserved live/intermediate bytes (default: 512 MiB) */
    maxLiveBytes?: number;
    /** Maximum aggregate input bytes (default: 512 MiB) */
    maxInputBytes?: number;
    /** Maximum bytes retained by Bash's default in-memory filesystem (default: 1 GiB) */
    maxFileSystemBytes?: number;
    /** Maximum SQLite database image bytes (default: 1 GiB) */
    maxDatabaseBytes?: number;
    /** Maximum SQLite result bytes before output formatting (default: 256 MiB) */
    maxDatabaseResultBytes?: number;
    /** Maximum aggregate expanded archive bytes (default: 1 GiB) */
    maxArchiveBytes?: number;
    /** Maximum compressed archive input bytes (default: 512 MiB) */
    maxArchiveCompressedBytes?: number;
    /** Maximum bytes in one archive entry (default: 512 MiB) */
    maxArchiveEntryBytes?: number;
    /** Maximum archive entries (default: 1000000) */
    maxArchiveEntries?: number;
    /** Maximum worker request or response payload bytes (default: 64 MiB) */
    maxWorkerMessageBytes?: number;
    /** Maximum top-level execution wall time in milliseconds (default: 1 hour) */
    maxExecutionTimeMs?: number;
    /**
     * Maximum time to let an aborted command acknowledge cancellation before its
     * execution context is revoked (normal default: 100ms).
     */
    maxExtensionCleanupTimeMs?: number;
    /** Maximum sqlite3 query execution time in milliseconds (normal default: 30000) */
    maxSqliteTimeoutMs?: number;
    /** Maximum Python execution time in milliseconds (normal default: 30000) */
    maxPythonTimeoutMs?: number;
    /** Maximum JavaScript execution time in milliseconds (normal default: 30000) */
    maxJsTimeoutMs?: number;
    /** Maximum JavaScript host-bridge operations (normal default: 1000000) */
    maxJsBridgeRequests?: number;
    /** Maximum glob filesystem operations (normal default: 1000000) */
    maxGlobOperations?: number;
    /** Maximum string length in bytes (normal default: 64 MiB) */
    maxStringLength?: number;
    /** Maximum array elements (normal default: 1000000) */
    maxArrayElements?: number;
    /** Maximum heredoc size in bytes (normal default: 64 MiB) */
    maxHeredocSize?: number;
    /** Maximum command substitution nesting depth (default: 50) */
    maxSubstitutionDepth?: number;
    /** Maximum brace expansion results (normal default: 100000) */
    maxBraceExpansionResults?: number;
    /** Maximum total output size in bytes (normal default: 256 MiB) */
    maxOutputSize?: number;
    /** Maximum number of open file descriptors (normal default: 4096) */
    maxFileDescriptors?: number;
    /** Maximum source/. nesting depth (default: 100) */
    maxSourceDepth?: number;
}
/** Named limit presets. `normal` favors compatibility; `hardened` is opt-in. */
export type ExecutionLimitProfile = "normal" | "hardened";
/** Liberal default shared by shell and standalone transform entry points. */
export declare const DEFAULT_MAX_SOURCE_BYTES: number;
/**
 * Resolve execution limits by merging user-provided limits with defaults.
 */
export declare function resolveLimits(userLimits?: ExecutionLimits, profile?: ExecutionLimitProfile): Required<ExecutionLimits>;
