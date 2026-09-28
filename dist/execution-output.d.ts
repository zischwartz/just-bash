import type { ExecutionScope } from "./execution-scope.js";
import type { ExecResult } from "./types.js";
/**
 * Chunked interpreter-output sink backed by the one top-level execution
 * budget. Accounting metadata follows bytes as compound commands relay child
 * results, avoiding both budget refreshes and double charging.
 */
export declare class ExecutionOutputAccumulator {
    private readonly scope;
    private readonly site;
    private readonly stdoutChunks;
    private readonly stderrChunks;
    private stdoutBytes;
    private stderrBytes;
    private readonly attachedErrors;
    constructor(scope: ExecutionScope, site: string);
    append(stream: "stdout" | "stderr", chunk: string, alreadyAccountedBytes?: number, kind?: "text" | "bytes"): void;
    /**
     * Attach output retained before a fatal/control-flow error exactly once for
     * this accumulator. The bytes have already been charged by the shared scope,
     * so propagation updates accounting metadata without charging them again.
     */
    prependTo(error: unknown): void;
    appendResult(result: ExecResult, stdout?: string): void;
    build(exitCode: number, extra?: Partial<ExecResult>): ExecResult;
    get stdout(): string;
    get stderr(): string;
}
