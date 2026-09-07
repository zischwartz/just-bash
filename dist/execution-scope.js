import { utf8ByteLength } from "./encoding.js";
import { ExecutionAbortedError, ExecutionLimitError, } from "./interpreter/errors.js";
import { _clearFiniteTimeout, _setTimeoutIfFinite } from "./timers.js";
const OUTPUT_RELEASE_AUTHORITY = Object.freeze(Object.create(null));
/**
 * Security-sensitive accounting shared by every interpreter descended from a
 * single public Bash.exec() call. This object is never accepted from callers;
 * nested exec functions capture it in a closure instead.
 *
 * Keep reservations centralized here so future output/byte/filesystem budgets
 * cannot accidentally be refreshed by starting a child interpreter.
 */
export class ExecutionScope {
    limits;
    signal;
    commandCount = 0;
    workUnits = 0;
    liveBytes = 0;
    inputBytes = 0;
    outputBytes = 0;
    countersByKind = new Map();
    bytesByKind = new Map();
    depthByKind = new Map();
    cleanupCallbacks = [];
    poisoned;
    closed = false;
    startedAt = Date.now();
    /** Bytes still available for prospective intermediate allocations. */
    get remainingLiveBytes() {
        return Math.max(0, this.limits.maxLiveBytes - this.liveBytes);
    }
    /** Snapshot used to prove accounting inherited from a nested execution. */
    get outputBytesUsed() {
        return this.outputBytes;
    }
    constructor(limits, signal = undefined) {
        this.limits = limits;
        this.signal = signal;
    }
    fail(error) {
        this.poisoned ??= error;
        throw this.poisoned;
    }
    /** Permanently reject later work after an extension misses cancellation. */
    poisonAfterAbort(error) {
        this.poisoned ??= error;
    }
    assertUsable() {
        if (this.poisoned)
            throw this.poisoned;
        if (this.closed) {
            throw new Error("execution budget is already closed");
        }
        this.throwIfAborted();
    }
    chargeCommand() {
        return this.consume("commands", 1, "execution");
    }
    consumeWork(units = 1, site = "execution") {
        return this.consume("work", units, site);
    }
    /** Charge both the aggregate work budget and a narrower operation budget. */
    consumeLimited(kind, count, maximum, site = kind) {
        this.assertUsable();
        const current = this.countersByKind.get(kind) ?? 0;
        if (!Number.isSafeInteger(count) ||
            count < 0 ||
            !Number.isSafeInteger(maximum) ||
            maximum < 0 ||
            count > maximum - current) {
            this.fail(new ExecutionLimitError(`${site}: ${kind} work limit exceeded (${maximum})`, "iterations"));
        }
        if (count > this.limits.maxWorkUnits - this.workUnits) {
            this.fail(new ExecutionLimitError(`${site}: aggregate work limit exceeded (${this.limits.maxWorkUnits})`, "iterations"));
        }
        this.countersByKind.set(kind, current + count);
        this.workUnits += count;
        return current + count;
    }
    consumeInput(bytes, site = "execution") {
        this.assertUsable();
        if (!Number.isSafeInteger(bytes) ||
            bytes < 0 ||
            bytes > this.limits.maxInputBytes - this.inputBytes) {
            this.fail(new ExecutionLimitError(`${site}: aggregate input size limit exceeded (${this.limits.maxInputBytes} bytes)`, "string_length"));
        }
        this.inputBytes += bytes;
        return this.inputBytes;
    }
    consume(kind, count = 1, site = kind) {
        this.assertUsable();
        const kindCurrent = this.countersByKind.get(kind) ?? 0;
        const current = kind === "commands" ? this.commandCount : this.workUnits;
        const maximum = kind === "commands"
            ? this.limits.maxCommandCount
            : this.limits.maxWorkUnits;
        if (!Number.isSafeInteger(count) ||
            count < 0 ||
            count > maximum - current) {
            this.fail(new ExecutionLimitError(kind === "commands"
                ? `too many commands executed (>${maximum}), increase executionLimits.maxCommandCount`
                : `${site}: ${kind} work limit exceeded (${maximum})`, kind === "commands" ? "commands" : "iterations"));
        }
        const next = current + count;
        if (kind === "commands")
            this.commandCount = next;
        else
            this.workUnits = next;
        this.countersByKind.set(kind, kindCurrent + count);
        return next;
    }
    reserveBytes(kindOrBytes, bytesOrSite, maybeSite) {
        this.assertUsable();
        const kind = typeof kindOrBytes === "string" ? kindOrBytes : "live";
        const bytes = typeof kindOrBytes === "string" ? bytesOrSite : kindOrBytes;
        const site = typeof kindOrBytes === "string"
            ? (maybeSite ?? kind)
            : (bytesOrSite ?? "execution");
        if (!Number.isSafeInteger(bytes) ||
            bytes < 0 ||
            bytes > this.limits.maxLiveBytes - this.liveBytes) {
            this.fail(new ExecutionLimitError(`${site}: live byte limit exceeded (${this.limits.maxLiveBytes} bytes)`, "string_length"));
        }
        this.liveBytes += bytes;
        this.bytesByKind.set(kind, (this.bytesByKind.get(kind) ?? 0) + bytes);
        let released = false;
        return {
            release: () => {
                if (released)
                    return;
                released = true;
                this.liveBytes -= bytes;
                const next = (this.bytesByKind.get(kind) ?? bytes) - bytes;
                if (next <= 0)
                    this.bytesByKind.delete(kind);
                else
                    this.bytesByKind.set(kind, next);
            },
        };
    }
    appendOutput(stream, chunk, site = "execution", alreadyAccountedBytes = 0, kind = "text") {
        this.assertUsable();
        const bytes = kind === "bytes" ? chunk.length : utf8ByteLength(chunk);
        if (!Number.isSafeInteger(alreadyAccountedBytes) ||
            alreadyAccountedBytes < 0 ||
            alreadyAccountedBytes > bytes) {
            this.fail(new ExecutionLimitError(`${site}: invalid ${stream} accounting`, "output_size"));
        }
        const unaccounted = bytes - alreadyAccountedBytes;
        if (unaccounted > this.limits.maxOutputSize - this.outputBytes) {
            this.fail(new ExecutionLimitError(`${site}: total output size exceeded (>${this.limits.maxOutputSize} bytes), increase executionLimits.maxOutputSize`, "output_size"));
        }
        this.outputBytes += unaccounted;
        return bytes;
    }
    accountResult(result, site = "execution", maximumPriorBytes = Number.POSITIVE_INFINITY) {
        const prior = result.internalOutputAccounting;
        const creditedStdout = Math.min(prior?.stdout ?? 0, maximumPriorBytes);
        const creditedStderr = Math.min(prior?.stderr ?? 0, Math.max(0, maximumPriorBytes - creditedStdout));
        const stdout = this.appendOutput("stdout", result.stdout, site, creditedStdout, result.stdoutKind === "bytes" || result.stdoutEncoding === "binary"
            ? "bytes"
            : "text");
        const stderr = this.appendOutput("stderr", result.stderr, site, creditedStderr);
        if (Object.isExtensible(result)) {
            result.internalOutputAccounting = { stdout, stderr };
            return result;
        }
        if (stdout === 0 && stderr === 0)
            return result;
        return {
            ...result,
            internalOutputAccounting: { stdout, stderr },
        };
    }
    /**
     * Relinquish bytes that were charged while a result was retained but have
     * since become a transient pipeline input. This is deliberately limited to
     * bytes carried by internal accounting metadata; callers must not use it to
     * refund arbitrary output.
     */
    /** @internal Use relinquishPipelineOutput; the authority prevents extensions
     * that receive an ExecutionScope from refunding their own output. */
    relinquishOutput(bytes, site, authority) {
        this.assertUsable();
        if (authority !== OUTPUT_RELEASE_AUTHORITY) {
            this.fail(new ExecutionLimitError(`${site}: unauthorized output accounting release`, "output_size"));
        }
        if (!Number.isSafeInteger(bytes) || bytes < 0 || bytes > this.outputBytes) {
            this.fail(new ExecutionLimitError(`${site}: invalid output accounting release`, "output_size"));
        }
        this.outputBytes -= bytes;
    }
    enterDepth(kind, maximumOrSite = this.limits.maxCallDepth, maybeSite) {
        this.assertUsable();
        const maximum = typeof maximumOrSite === "number"
            ? maximumOrSite
            : this.limits.maxCallDepth;
        const site = typeof maximumOrSite === "string" ? maximumOrSite : (maybeSite ?? kind);
        const current = this.depthByKind.get(kind) ?? 0;
        if (current >= maximum) {
            this.fail(new ExecutionLimitError(`${site}: maximum depth (${maximum}) exceeded`, "recursion"));
        }
        this.depthByKind.set(kind, current + 1);
        let released = false;
        return {
            release: () => {
                if (released)
                    return;
                released = true;
                const next = (this.depthByKind.get(kind) ?? 1) - 1;
                if (next <= 0)
                    this.depthByKind.delete(kind);
                else
                    this.depthByKind.set(kind, next);
            },
        };
    }
    throwIfAborted(site = "execution") {
        if (this.signal?.aborted) {
            this.fail(new ExecutionAbortedError("", `bash: ${site} aborted\n`));
        }
        if (Date.now() - this.startedAt > this.limits.maxExecutionTimeMs) {
            this.fail(new ExecutionAbortedError("", `bash: ${site} exceeded execution deadline (${this.limits.maxExecutionTimeMs}ms)\n`));
        }
    }
    remainingTimeMs() {
        return Math.max(0, this.limits.maxExecutionTimeMs - (Date.now() - this.startedAt));
    }
    registerCleanup(cleanup) {
        this.assertUsable();
        this.cleanupCallbacks.push(cleanup);
        let active = true;
        return () => {
            if (!active)
                return;
            active = false;
            const index = this.cleanupCallbacks.indexOf(cleanup);
            if (index >= 0)
                this.cleanupCallbacks.splice(index, 1);
        };
    }
    async close() {
        if (this.closed)
            return;
        this.closed = true;
        const errors = [];
        const cleanupDeadline = Date.now() + this.limits.maxExtensionCleanupTimeMs;
        for (let index = this.cleanupCallbacks.length - 1; index >= 0; index--) {
            try {
                const remaining = cleanupDeadline - Date.now();
                if (remaining <= 0) {
                    errors.push(new Error("execution cleanup grace period exceeded"));
                    break;
                }
                let timer;
                const outcome = await Promise.race([
                    Promise.resolve()
                        .then(this.cleanupCallbacks[index])
                        .then(() => ({ ok: true }), (error) => ({ ok: false, error })),
                    new Promise((resolve) => {
                        timer = _setTimeoutIfFinite(() => resolve({
                            ok: false,
                            error: new Error("execution cleanup grace period exceeded"),
                        }), remaining);
                    }),
                ]);
                _clearFiniteTimeout(timer);
                if (!outcome.ok) {
                    errors.push(outcome.error);
                    if (Date.now() >= cleanupDeadline)
                        break;
                }
            }
            catch (error) {
                errors.push(error);
            }
        }
        this.cleanupCallbacks.length = 0;
        this.depthByKind.clear();
        this.bytesByKind.clear();
        this.liveBytes = 0;
        if (errors.length > 0) {
            throw new AggregateError(errors, "execution cleanup failed");
        }
    }
    assertExecDepth(depth) {
        this.assertUsable();
        if (depth > this.limits.maxExecDepth) {
            this.fail(new ExecutionLimitError(`maximum nested execution depth (${this.limits.maxExecDepth}) exceeded`, "recursion"));
        }
    }
}
/** Build a least-authority view for command implementations. */
export function createCommandExecutionBudget(scope) {
    const budget = Object.create(null);
    Object.defineProperties(budget, {
        remainingLiveBytes: {
            enumerable: true,
            get: () => scope.remainingLiveBytes,
        },
        consumeWork: { enumerable: true, value: scope.consumeWork.bind(scope) },
        consumeLimited: {
            enumerable: true,
            value: scope.consumeLimited.bind(scope),
        },
        consumeInput: { enumerable: true, value: scope.consumeInput.bind(scope) },
        reserveBytes: { enumerable: true, value: scope.reserveBytes.bind(scope) },
        enterDepth: { enumerable: true, value: scope.enterDepth.bind(scope) },
        throwIfAborted: {
            enumerable: true,
            value: scope.throwIfAborted.bind(scope),
        },
        remainingTimeMs: {
            enumerable: true,
            value: scope.remainingTimeMs.bind(scope),
        },
        registerCleanup: {
            enumerable: true,
            value: scope.registerCleanup.bind(scope),
        },
    });
    return Object.freeze(budget);
}
/** Release a checked pipeline intermediate without exposing refund authority
 * through the ExecutionScope capability supplied to custom commands. */
export function relinquishPipelineOutput(scope, bytes, site = "pipeline") {
    scope.relinquishOutput(bytes, site, OUTPUT_RELEASE_AUTHORITY);
}
