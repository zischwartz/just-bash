/** Shared prospective accounting for compression and archive codecs. */
export interface CodecBudgetOptions {
    /** Maximum bytes accepted from the compressed/input side of the codec. */
    maxInputBytes: number;
    /** Maximum bytes a codec may produce. Must be enforced while producing. */
    maxOutputBytes: number;
    /** Optional expansion-ratio guard, applied after `ratioGraceBytes`. */
    maxExpansionRatio?: number;
    /** Avoid ratio false positives for tiny, intentionally repetitive inputs. */
    ratioGraceBytes?: number;
    /** Maximum bytes of codec work charged across input and output. */
    maxWorkBytes?: number;
    signal?: AbortSignal;
    label?: string;
}
/**
 * A codec must call `acceptInput` before decoding and `acceptOutput` before
 * retaining every output chunk. This makes the safety check prospective: the
 * allocation/side effect does not happen when the reservation fails.
 */
export declare class CodecBudget {
    private readonly options;
    private inputBytes;
    private outputBytes;
    private workBytes;
    private readonly label;
    constructor(options: CodecBudgetOptions);
    checkpoint(): void;
    acceptInput(bytes: number): void;
    acceptOutput(bytes: number): void;
    get inputLength(): number;
    get outputLength(): number;
    private chargeWork;
    private addWithinLimit;
}
