import { utf8ByteLength } from "./encoding.js";
import { ControlFlowError } from "./interpreter/errors.js";
/**
 * Chunked interpreter-output sink backed by the one top-level execution
 * budget. Accounting metadata follows bytes as compound commands relay child
 * results, avoiding both budget refreshes and double charging.
 */
export class ExecutionOutputAccumulator {
    scope;
    site;
    stdoutChunks = [];
    stderrChunks = [];
    stdoutBytes = 0;
    stderrBytes = 0;
    attachedErrors = new WeakSet();
    constructor(scope, site) {
        this.scope = scope;
        this.site = site;
    }
    append(stream, chunk, alreadyAccountedBytes = 0, kind = "text") {
        let bytes;
        try {
            bytes = this.scope.appendOutput(stream, chunk, this.site, alreadyAccountedBytes, kind);
        }
        catch (error) {
            this.prependTo(error);
            throw error;
        }
        if (chunk) {
            (stream === "stdout" ? this.stdoutChunks : this.stderrChunks).push(chunk);
        }
        if (stream === "stdout")
            this.stdoutBytes += bytes;
        else
            this.stderrBytes += bytes;
    }
    /**
     * Attach output retained before a fatal/control-flow error exactly once for
     * this accumulator. The bytes have already been charged by the shared scope,
     * so propagation updates accounting metadata without charging them again.
     */
    prependTo(error) {
        if (!(error instanceof ControlFlowError))
            return;
        if (this.attachedErrors.has(error))
            return;
        this.attachedErrors.add(error);
        error.prependOutput(this.stdout, this.stderr);
    }
    appendResult(result, stdout = result.stdout) {
        const stdoutKind = result.stdoutKind === "bytes" || result.stdoutEncoding === "binary"
            ? "bytes"
            : "text";
        const stdoutBytes = stdoutKind === "bytes" ? stdout.length : utf8ByteLength(stdout);
        this.append("stdout", stdout, Math.min(result.internalOutputAccounting?.stdout ?? 0, stdoutBytes), stdoutKind);
        this.append("stderr", result.stderr, result.internalOutputAccounting?.stderr ?? 0);
    }
    build(exitCode, extra) {
        return {
            stdout: this.stdoutChunks.join(""),
            stderr: this.stderrChunks.join(""),
            exitCode,
            ...extra,
            internalOutputAccounting: {
                stdout: this.stdoutBytes,
                stderr: this.stderrBytes,
            },
        };
    }
    get stdout() {
        return this.stdoutChunks.join("");
    }
    get stderr() {
        return this.stderrChunks.join("");
    }
}
