import { utf8ByteLength } from "./encoding.js";
import { ExecutionLimitError } from "./interpreter/errors.js";
function assertBoundedCount(count, label) {
    if (!Number.isSafeInteger(count) || count < 0) {
        throw new ExecutionLimitError(`${label}: invalid bounded allocation count`, "array_elements");
    }
}
function allocationError(label) {
    return new ExecutionLimitError(`${label}: invalid bounded allocation count`, "array_elements");
}
/** Add allocation counts without permitting unsafe-integer wraparound. */
export function checkedAdd(left, right, label) {
    assertBoundedCount(left, label);
    assertBoundedCount(right, label);
    const result = left + right;
    if (!Number.isSafeInteger(result))
        throw allocationError(label);
    return result;
}
/** Multiply allocation counts without permitting overflow or invalid inputs. */
export function checkedMultiply(left, right, label) {
    assertBoundedCount(left, label);
    assertBoundedCount(right, label);
    if (left !== 0 && right > Math.floor(Number.MAX_SAFE_INTEGER / left)) {
        throw allocationError(label);
    }
    return left * right;
}
/** Repeat only after proving that the resulting UTF-8 byte size is bounded. */
export function boundedRepeat(value, count, maxBytes, label) {
    const builder = new BoundedStringBuilder(maxBytes, label);
    builder.repeat(value, count);
    return builder.build();
}
/** Join only after charging every value and separator before construction. */
export function boundedJoin(values, separator, maxBytes, label) {
    const builder = new BoundedStringBuilder(maxBytes, label);
    for (let index = 0; index < values.length; index++) {
        if (index > 0)
            builder.append(separator);
        builder.append(values[index]);
    }
    return builder.build();
}
export class BoundedStringBuilder {
    maxBytes;
    label;
    createLimitError;
    reservedBytes;
    chunks = [];
    usedBytes = 0;
    constructor(maxBytes, label, createLimitError = undefined, reservedBytes = 0) {
        this.maxBytes = maxBytes;
        this.label = label;
        this.createLimitError = createLimitError;
        this.reservedBytes = reservedBytes;
        assertBoundedCount(maxBytes, label);
        assertBoundedCount(reservedBytes, label);
        if (reservedBytes > maxBytes)
            this.fail();
    }
    fail() {
        throw (this.createLimitError?.() ??
            new ExecutionLimitError(`${this.label}: output size limit exceeded (${this.maxBytes} bytes)`, "output_size"));
    }
    get byteLength() {
        return this.usedBytes;
    }
    get remainingBytes() {
        return this.maxBytes - this.reservedBytes - this.usedBytes;
    }
    reserve(bytes) {
        assertBoundedCount(bytes, this.label);
        if (bytes > this.remainingBytes) {
            this.fail();
        }
    }
    append(value) {
        const bytes = utf8ByteLength(value);
        this.reserve(bytes);
        if (value)
            this.chunks.push(value);
        this.usedBytes += bytes;
        return this;
    }
    repeat(value, count) {
        assertBoundedCount(count, this.label);
        const unitBytes = utf8ByteLength(value);
        if (unitBytes !== 0 &&
            count > Math.floor(this.remainingBytes / unitBytes)) {
            this.fail();
        }
        return this.append(value.repeat(count));
    }
    reset() {
        this.chunks.length = 0;
        this.usedBytes = 0;
    }
    build() {
        return this.chunks.join("");
    }
}
export class BoundedByteBuilder {
    maxBytes;
    label;
    chunks = [];
    usedBytes = 0;
    constructor(maxBytes, label) {
        this.maxBytes = maxBytes;
        this.label = label;
        assertBoundedCount(maxBytes, label);
    }
    get byteLength() {
        return this.usedBytes;
    }
    get remainingBytes() {
        return this.maxBytes - this.usedBytes;
    }
    append(value) {
        if (value.byteLength > this.remainingBytes) {
            throw new ExecutionLimitError(`${this.label}: byte size limit exceeded (${this.maxBytes} bytes)`, "string_length");
        }
        if (value.byteLength > 0)
            this.chunks.push(value);
        this.usedBytes += value.byteLength;
        return this;
    }
    build() {
        const output = new Uint8Array(this.usedBytes);
        let offset = 0;
        for (const chunk of this.chunks) {
            output.set(chunk, offset);
            offset += chunk.byteLength;
        }
        return output;
    }
}
