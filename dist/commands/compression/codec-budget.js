/**
 * A codec must call `acceptInput` before decoding and `acceptOutput` before
 * retaining every output chunk. This makes the safety check prospective: the
 * allocation/side effect does not happen when the reservation fails.
 */
export class CodecBudget {
    options;
    inputBytes = 0;
    outputBytes = 0;
    workBytes = 0;
    label;
    constructor(options) {
        this.options = options;
        this.label = options.label ?? "codec";
        for (const [name, value] of [
            ["maxInputBytes", options.maxInputBytes],
            ["maxOutputBytes", options.maxOutputBytes],
            ["maxExpansionRatio", options.maxExpansionRatio],
            ["ratioGraceBytes", options.ratioGraceBytes],
            ["maxWorkBytes", options.maxWorkBytes],
        ]) {
            if (value !== undefined && (!Number.isSafeInteger(value) || value < 0)) {
                throw new Error(`${this.label}: invalid ${name}`);
            }
        }
    }
    checkpoint() {
        if (this.options.signal?.aborted) {
            throw new Error(`${this.label}: operation aborted`);
        }
    }
    acceptInput(bytes) {
        this.checkpoint();
        this.inputBytes = this.addWithinLimit(this.inputBytes, bytes, this.options.maxInputBytes, "input");
        this.chargeWork(bytes);
    }
    acceptOutput(bytes) {
        this.checkpoint();
        const nextOutput = this.addWithinLimit(this.outputBytes, bytes, this.options.maxOutputBytes, "output");
        const grace = this.options.ratioGraceBytes ?? 1024 * 1024;
        const ratio = this.options.maxExpansionRatio;
        if (ratio !== undefined &&
            nextOutput > grace &&
            (this.inputBytes === 0 || nextOutput > this.inputBytes * ratio)) {
            throw new Error(`${this.label}: expansion ratio exceeds limit (${ratio}:1)`);
        }
        this.outputBytes = nextOutput;
        this.chargeWork(bytes);
    }
    get inputLength() {
        return this.inputBytes;
    }
    get outputLength() {
        return this.outputBytes;
    }
    chargeWork(bytes) {
        const maximum = this.options.maxWorkBytes ??
            this.options.maxInputBytes + this.options.maxOutputBytes;
        this.workBytes = this.addWithinLimit(this.workBytes, bytes, maximum, "work");
    }
    addWithinLimit(current, bytes, maximum, resource) {
        if (!Number.isSafeInteger(bytes) ||
            bytes < 0 ||
            bytes > maximum - current) {
            throw new Error(`${this.label}: ${resource} exceeds limit (${maximum} bytes)`);
        }
        return current + bytes;
    }
}
