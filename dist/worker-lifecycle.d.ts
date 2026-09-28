type CancelReason = "abort" | "timeout";
interface WorkerLifecycleOptions {
    timeoutMs: number;
    signal?: AbortSignal;
}
/** Shared deadline, cancellation, and termination lifecycle for Node and browser workers. */
export declare class WorkerLifecycle {
    private readonly lifecycleOptions;
    readonly deadline: number;
    private readonly cleanups;
    private cancelHandler;
    private canceledReason;
    private closed;
    constructor(lifecycleOptions: WorkerLifecycleOptions);
    /** Arm cancellation before the caller makes the request visible in a queue. */
    arm(onCancel: (reason: CancelReason) => void): void;
    get isCanceled(): boolean;
    remainingTimeMs(): number;
    timeoutMessage(noun?: string): string;
    abortMessage(): string;
    terminate(worker: {
        terminate(): unknown;
    } | null | undefined): Promise<boolean>;
    close(): void;
    private cancel;
}
export {};
