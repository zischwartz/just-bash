import type { QueryValue } from "./value-operations.js";
export interface JsonOutputOptions {
    compact?: boolean;
    raw?: boolean;
    sortKeys?: boolean;
    indent?: number;
    useTab?: boolean;
    limitKind?: "output_size" | "string_length";
}
/** Serialize query values directly into a bounded builder. */
export declare function formatJsonValue(value: QueryValue, maxBytes: number, options?: JsonOutputOptions): string;
