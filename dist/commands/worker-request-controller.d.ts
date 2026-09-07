import type { Worker } from "node:worker_threads";
type CancelReason = "abort" | "timeout";
export interface WorkerRequestControllerOptions {
    commandName: string;
    timeoutMs: number;
    signal?: AbortSignal;
    maxMessageBytes: number;
}
/**
 * Execution-owned lifecycle for a single worker request.  Queue implementations
 * remain command-specific, but cancellation is armed before enqueueing and all
 * request-owned listeners/timers are removed exactly once.
 */
export declare class WorkerRequestController {
    private readonly options;
    readonly protocolToken: string;
    readonly deadline: number;
    private readonly cleanups;
    private cancelHandler;
    private canceledReason;
    private closed;
    constructor(options: WorkerRequestControllerOptions);
    /** Arm cancellation before the caller makes the request visible in a queue. */
    arm(onCancel: (reason: CancelReason) => void): void;
    get isCanceled(): boolean;
    remainingTimeMs(): number;
    timeoutMessage(noun?: string): string;
    abortMessage(): string;
    assertMessageSize(value: unknown, direction: "request" | "response"): void;
    terminate(worker: Worker | null | undefined): Promise<boolean>;
    close(): void;
    private cancel;
}
/** Conservative, allocation-free estimate for structured-clone payloads. */
export declare function estimateMessageBytes(value: unknown, stopAfter: number): number;
export {};
