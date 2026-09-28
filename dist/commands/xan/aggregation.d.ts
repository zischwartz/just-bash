/**
 * Aggregation functions for xan command
 */
import { type EvaluateOptions } from "../query-engine/index.js";
import { type CsvData, type CsvRow } from "./csv.js";
export interface AggregationLimits {
    maxArrayElements?: number;
    maxStringLength?: number;
    maxIterations?: number;
    maxDepth?: number;
    /** Charge command-wide work before performing attacker-sized operations. */
    consumeWork?: (units?: number) => void;
}
/** Conservative comparison work to reserve before allocating a sorted copy. */
export declare function estimateSortingWork(length: number): number;
/** Aggregation specification from parsed expression */
export interface AggSpec {
    func: string;
    expr: string;
    alias: string;
}
/**
 * Parse aggregation expression: "func(expr) as alias" or "func(expr)"
 * Handles nested parentheses in expressions like sum(add(a, b))
 */
export declare function parseAggExpr(expr: string, limits?: AggregationLimits): AggSpec[];
/** Compute aggregation on data */
export declare function computeAgg(data: CsvData, spec: AggSpec, evalOptions?: EvaluateOptions, limits?: AggregationLimits): number | string | boolean | null;
/** Build aggregation result row */
export declare function buildAggRow(data: CsvData, specs: AggSpec[], evalOptions?: EvaluateOptions, limits?: AggregationLimits): CsvRow;
