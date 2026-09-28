import { ExecutionAbortedError } from "./interpreter/errors.js";
import type { ExecutionLimits } from "./limits.js";
import type { ExecResult } from "./types.js";
export interface ResourceLease {
    release(): void;
}
/**
 * Accounting capability exposed to commands. Administrative lifecycle and
 * result-accounting operations intentionally remain on ExecutionScope only.
 */
export interface CommandExecutionBudget {
    readonly remainingLiveBytes: number;
    consumeWork(units?: number, site?: string): number;
    consumeLimited(kind: string, count: number, maximum: number, site?: string): number;
    consumeInput(bytes: number, site?: string): number;
    reserveBytes(bytes: number, site?: string): ResourceLease;
    reserveBytes(kind: string, bytes: number, site?: string): ResourceLease;
    enterDepth(kind: string, site?: string): ResourceLease;
    enterDepth(kind: string, maximum: number, site?: string): ResourceLease;
    throwIfAborted(site?: string): void;
    remainingTimeMs(): number;
    registerCleanup(cleanup: Cleanup): () => void;
}
type Cleanup = () => void | Promise<void>;
/**
 * Security-sensitive accounting shared by every interpreter descended from a
 * single public Bash.exec() call. This object is never accepted from callers;
 * nested exec functions capture it in a closure instead.
 *
 * Keep reservations centralized here so future output/byte/filesystem budgets
 * cannot accidentally be refreshed by starting a child interpreter.
 */
export declare class ExecutionScope {
    private readonly limits;
    private readonly signal;
    private commandCount;
    private workUnits;
    private liveBytes;
    private inputBytes;
    private outputBytes;
    private readonly countersByKind;
    private readonly bytesByKind;
    private readonly depthByKind;
    private readonly cleanupCallbacks;
    private poisoned;
    private closed;
    private readonly startedAt;
    /** Bytes still available for prospective intermediate allocations. */
    get remainingLiveBytes(): number;
    /** Snapshot used to prove accounting inherited from a nested execution. */
    get outputBytesUsed(): number;
    constructor(limits: Required<ExecutionLimits>, signal?: AbortSignal | undefined);
    private fail;
    /** Permanently reject later work after an extension misses cancellation. */
    poisonAfterAbort(error: ExecutionAbortedError): void;
    private assertUsable;
    chargeCommand(): number;
    consumeWork(units?: number, site?: string): number;
    /** Charge both the aggregate work budget and a narrower operation budget. */
    consumeLimited(kind: string, count: number, maximum: number, site?: string): number;
    consumeInput(bytes: number, site?: string): number;
    consume(kind: string, count?: number, site?: string): number;
    reserveBytes(bytes: number, site?: string): ResourceLease;
    reserveBytes(kind: string, bytes: number, site?: string): ResourceLease;
    appendOutput(stream: "stdout" | "stderr", chunk: string, site?: string, alreadyAccountedBytes?: number, kind?: "text" | "bytes"): number;
    accountResult(result: ExecResult, site?: string, maximumPriorBytes?: number): ExecResult;
    /**
     * Relinquish bytes that were charged while a result was retained but have
     * since become a transient pipeline input. This is deliberately limited to
     * bytes carried by internal accounting metadata; callers must not use it to
     * refund arbitrary output.
     */
    /** @internal Use relinquishPipelineOutput; the authority prevents extensions
     * that receive an ExecutionScope from refunding their own output. */
    relinquishOutput(bytes: number, site: string, authority: object): void;
    enterDepth(kind: string, site?: string): ResourceLease;
    enterDepth(kind: string, maximum: number, site?: string): ResourceLease;
    throwIfAborted(site?: string): void;
    remainingTimeMs(): number;
    registerCleanup(cleanup: Cleanup): () => void;
    close(): Promise<void>;
    assertExecDepth(depth: number): void;
}
/** Build a least-authority view for command implementations. */
export declare function createCommandExecutionBudget(scope: ExecutionScope): CommandExecutionBudget;
/** Release a checked pipeline intermediate without exposing refund authority
 * through the ExecutionScope capability supplied to custom commands. */
export declare function relinquishPipelineOutput(scope: ExecutionScope, bytes: number, site?: string): void;
export {};
