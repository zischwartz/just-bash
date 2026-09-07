import { randomBytes } from "node:crypto";
import { _clearFiniteTimeout, _setTimeoutIfFinite } from "../timers.js";
/**
 * Execution-owned lifecycle for a single worker request.  Queue implementations
 * remain command-specific, but cancellation is armed before enqueueing and all
 * request-owned listeners/timers are removed exactly once.
 */
export class WorkerRequestController {
    options;
    protocolToken = randomBytes(16).toString("hex");
    deadline;
    cleanups = [];
    cancelHandler;
    canceledReason;
    closed = false;
    constructor(options) {
        this.options = options;
        this.deadline = Date.now() + options.timeoutMs;
    }
    /** Arm cancellation before the caller makes the request visible in a queue. */
    arm(onCancel) {
        if (this.cancelHandler)
            throw new Error("worker request is already armed");
        this.cancelHandler = onCancel;
        const signal = this.options.signal;
        if (signal) {
            const abort = () => this.cancel("abort");
            signal.addEventListener("abort", abort, { once: true });
            this.cleanups.push(() => signal.removeEventListener("abort", abort));
            if (signal.aborted)
                this.cancel("abort");
        }
        if (!this.canceledReason) {
            const timer = _setTimeoutIfFinite(() => this.cancel("timeout"), Math.max(0, this.options.timeoutMs));
            if (timer !== undefined) {
                this.cleanups.push(() => _clearFiniteTimeout(timer));
            }
        }
    }
    get isCanceled() {
        return this.canceledReason !== undefined;
    }
    remainingTimeMs() {
        return Math.max(0, this.deadline - Date.now());
    }
    timeoutMessage(noun = "Execution") {
        return `${noun} timeout: exceeded ${this.options.timeoutMs}ms limit`;
    }
    abortMessage() {
        return "Execution aborted";
    }
    assertMessageSize(value, direction) {
        const bytes = estimateMessageBytes(value, this.options.maxMessageBytes);
        if (bytes > this.options.maxMessageBytes) {
            throw new Error(`${this.options.commandName}: worker ${direction} exceeds ${this.options.maxMessageBytes} byte limit`);
        }
    }
    async terminate(worker) {
        if (!worker)
            return true;
        try {
            await worker.terminate();
            return true;
        }
        catch {
            // Rejection is not an acknowledgement that stale worker authority ended.
            return false;
        }
    }
    close() {
        if (this.closed)
            return;
        this.closed = true;
        for (let index = this.cleanups.length - 1; index >= 0; index--) {
            this.cleanups[index]();
        }
        this.cleanups.length = 0;
        this.cancelHandler = undefined;
    }
    cancel(reason) {
        if (this.closed || this.canceledReason)
            return;
        this.canceledReason = reason;
        this.cancelHandler?.(reason);
    }
}
/** Conservative, allocation-free estimate for structured-clone payloads. */
export function estimateMessageBytes(value, stopAfter) {
    const ownEntries = function* (object) {
        for (const key in object) {
            if (Object.hasOwn(object, key))
                yield [key, object[key]];
        }
    };
    const pending = [{ kind: "value", value }];
    const seen = new WeakSet();
    let bytes = 0;
    while (pending.length > 0 && bytes <= stopAfter) {
        const work = pending.pop();
        if (!work)
            break;
        if (work.kind === "array") {
            if (work.index < work.value.length) {
                pending.push({ ...work, index: work.index + 1 });
                pending.push({ kind: "value", value: work.value[work.index] });
            }
            continue;
        }
        if (work.kind === "object") {
            const next = work.iterator.next();
            if (!next.done) {
                bytes += 8 + Buffer.byteLength(next.value[0], "utf8");
                pending.push(work);
                pending.push({ kind: "value", value: next.value[1] });
            }
            continue;
        }
        const item = work.value;
        if (item === null || item === undefined) {
            bytes += 4;
        }
        else if (typeof item === "string") {
            bytes += Buffer.byteLength(item, "utf8");
        }
        else if (typeof item === "number" || typeof item === "bigint") {
            bytes += 8;
        }
        else if (typeof item === "boolean") {
            bytes += 1;
        }
        else if (typeof item === "object") {
            if (seen.has(item))
                continue;
            seen.add(item);
            if (ArrayBuffer.isView(item)) {
                bytes += item.byteLength;
            }
            else if (item instanceof ArrayBuffer ||
                item instanceof SharedArrayBuffer) {
                bytes += item.byteLength;
            }
            else if (Array.isArray(item)) {
                // Account clone metadata before traversing, and reject without growing
                // the host work stack when the array alone cannot fit.
                if (item.length > Math.floor((stopAfter - bytes) / 8)) {
                    return stopAfter + 1;
                }
                bytes += item.length * 8;
                pending.push({ kind: "array", value: item, index: 0 });
            }
            else {
                pending.push({
                    kind: "object",
                    iterator: ownEntries(item),
                });
            }
        }
    }
    return bytes;
}
