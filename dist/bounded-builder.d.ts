import { ExecutionLimitError } from "./interpreter/errors.js";
/** Add allocation counts without permitting unsafe-integer wraparound. */
export declare function checkedAdd(left: number, right: number, label: string): number;
/** Multiply allocation counts without permitting overflow or invalid inputs. */
export declare function checkedMultiply(left: number, right: number, label: string): number;
/** Repeat only after proving that the resulting UTF-8 byte size is bounded. */
export declare function boundedRepeat(value: string, count: number, maxBytes: number, label: string): string;
/** Join only after charging every value and separator before construction. */
export declare function boundedJoin(values: readonly string[], separator: string, maxBytes: number, label: string): string;
export declare class BoundedStringBuilder {
    private readonly maxBytes;
    private readonly label;
    private readonly createLimitError;
    private readonly reservedBytes;
    private readonly chunks;
    private usedBytes;
    constructor(maxBytes: number, label: string, createLimitError?: (() => ExecutionLimitError) | undefined, reservedBytes?: number);
    private fail;
    get byteLength(): number;
    get remainingBytes(): number;
    reserve(bytes: number): void;
    append(value: string): this;
    repeat(value: string, count: number): this;
    reset(): void;
    build(): string;
}
export declare class BoundedByteBuilder {
    private readonly maxBytes;
    private readonly label;
    private readonly chunks;
    private usedBytes;
    constructor(maxBytes: number, label: string);
    get byteLength(): number;
    get remainingBytes(): number;
    append(value: Uint8Array): this;
    build(): Uint8Array;
}
