import { WorkerLifecycle } from "../worker-lifecycle.js";
export interface WorkerRequestControllerOptions {
    commandName: string;
    timeoutMs: number;
    signal?: AbortSignal;
    maxMessageBytes: number;
}
/** Node worker request lifecycle with protocol authentication and message limits. */
export declare class WorkerRequestController extends WorkerLifecycle {
    private readonly options;
    readonly protocolToken: string;
    constructor(options: WorkerRequestControllerOptions);
    assertMessageSize(value: unknown, direction: "request" | "response"): void;
}
/** Conservative, allocation-free estimate for structured-clone payloads. */
export declare function estimateMessageBytes(value: unknown, stopAfter: number): number;
