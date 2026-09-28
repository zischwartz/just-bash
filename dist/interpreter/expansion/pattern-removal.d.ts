/**
 * Pattern Removal Helpers
 *
 * Functions for ${var#pattern}, ${var%pattern}, ${!prefix*} etc.
 */
import type { InterpreterContext } from "../types.js";
/**
 * Apply pattern removal (prefix or suffix strip) to a single value.
 * Used by both scalar and vectorized array operations.
 */
export declare function applyPatternRemoval(ctx: InterpreterContext, value: string, regexStr: string, side: "prefix" | "suffix", greedy: boolean): string;
/**
 * Get variable names that match a given prefix.
 * Used for ${!prefix*} and ${!prefix@} expansions.
 * Includes names from both the scalar and structured-array namespaces.
 */
export declare function getVarNamesWithPrefix(ctx: InterpreterContext, prefix: string): string[];
