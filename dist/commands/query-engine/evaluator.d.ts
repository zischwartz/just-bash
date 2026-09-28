/**
 * Query expression evaluator
 *
 * Evaluates a parsed query AST against any value.
 * Used by jq, yq, and other query-based commands.
 */
import type { FeatureCoverageWriter } from "../../types.js";
import type { AstNode } from "./parser.js";
import { type QueryValue } from "./value-operations.js";
export type { QueryValue } from "./value-operations.js";
export interface QueryExecutionLimits {
    maxIterations?: number;
    maxDepth?: number;
    maxStringLength?: number;
    maxOutputSize?: number;
    maxArrayElements?: number;
}
export type ResolvedQueryExecutionLimits = Required<QueryExecutionLimits>;
export interface EvalContext {
    vars: Map<string, QueryValue>;
    limits: ResolvedQueryExecutionLimits;
    env?: Map<string, string>;
    /** Named arguments (bare names) exposed via $ARGS.named */
    namedArgs?: Map<string, QueryValue>;
    /** Positional arguments (in order) exposed via $ARGS.positional */
    positionalArgs?: QueryValue[];
    requireDefenseContext?: boolean;
    defenseContextChecked?: boolean;
    /** Original document root for parent/root navigation */
    root?: QueryValue;
    /** Current path from root for parent navigation */
    currentPath?: (string | number)[];
    funcs?: Map<string, {
        params: string[];
        body: AstNode;
        closure?: Map<string, unknown>;
    }>;
    labels?: Set<string>;
    /** Feature coverage writer for fuzzing instrumentation */
    coverage?: FeatureCoverageWriter;
    /** Shared across every recursive evaluation and builtin invocation. */
    budget: QueryEvaluationBudget;
}
export interface QueryEvaluationBudget {
    operations: number;
    callDepth: number;
}
export declare function chargeQueryWork(ctx: EvalContext, count?: number): void;
export declare function assertQueryResultCapacity(ctx: EvalContext, current: number, additional?: number): void;
export interface EvaluateOptions {
    limits?: QueryExecutionLimits;
    env?: Map<string, string>;
    /** Named arguments (bare names) bound to $NAME and exposed via $ARGS.named */
    namedArgs?: Map<string, QueryValue>;
    /** Positional arguments (in order) exposed via $ARGS.positional */
    positionalArgs?: QueryValue[];
    coverage?: FeatureCoverageWriter;
    requireDefenseContext?: boolean;
    /** Reuse across multiple input documents to enforce one command budget. */
    budget?: QueryEvaluationBudget;
}
export declare function evaluate(value: QueryValue, ast: AstNode, ctxOrOptions?: EvalContext | EvaluateOptions): QueryValue[];
