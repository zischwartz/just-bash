/**
 * CSV parsing and formatting utilities for xan command
 */
import type { ExecResult, RuntimeCommandContext } from "../../types.js";
export interface CsvRow {
    [key: string]: string | number | boolean | null;
}
export type CsvData = CsvRow[];
export type CsvCells = Array<Array<string | number | boolean | null>>;
export interface CsvParseLimits {
    maxStringLength?: number;
    maxArrayElements?: number;
    maxRows?: number;
    maxCells?: number;
}
/** RuntimeCommand-wide prospective accounting for attacker-amplified CSV results. */
export declare class DerivedCsvBudget {
    private readonly ctx;
    private readonly site;
    private rows;
    private cells;
    constructor(ctx: RuntimeCommandContext, site: string);
    consumeWork(units?: number): void;
    addRow(cellCount: number): void;
    /** Reserve a known result cardinality before constructing any result rows. */
    addRows(rowCount: number, cellCount: number): void;
}
/**
 * Create a null-prototype CsvRow to prevent prototype pollution.
 * User-controlled CSV column names could match dangerous keys like
 * __proto__, constructor, or prototype. Using a null-prototype object
 * ensures these don't access the prototype chain.
 */
export declare function createSafeRow(): CsvRow;
/**
 * Set a property on a CsvRow.
 * Since CsvRow uses null-prototype, this is safe from prototype pollution.
 */
export declare function safeSetRow(row: CsvRow, key: string, value: string | number | boolean | null): void;
/**
 * Convert a plain object row to a safe null-prototype row.
 */
export declare function toSafeRow(plainRow: Record<string, unknown>): CsvRow;
/** Parse CSV input string to array of row objects */
export declare function parseCsv(input: string, limits?: CsvParseLimits): {
    headers: string[];
    data: CsvData;
};
/** Parse headerless/ragged CSV incrementally while enforcing aggregate limits. */
export declare function parseCsvRows(input: string, limits?: CsvParseLimits): CsvCells;
/** Format array of row objects back to CSV string */
export declare function formatCsv(headers: string[], data: CsvData, ctx?: RuntimeCommandContext): string;
/** Format object rows in header order, omitting the header record itself. */
export declare function formatCsvWithoutHeaders(headers: string[], data: CsvData, ctx: RuntimeCommandContext): string;
/** Format already-materialized cells without Papa.unparse's unbounded copy. */
export declare function formatCsvRows(data: readonly (readonly unknown[])[], ctx?: RuntimeCommandContext, headers?: readonly unknown[]): string;
/** Read CSV input from file or stdin */
export declare function readCsvInput(args: string[], ctx: RuntimeCommandContext): Promise<{
    headers: string[];
    data: CsvData;
    error?: ExecResult;
}>;
