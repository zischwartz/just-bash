/**
 * Array helper functions for the interpreter.
 */
import type { WordNode } from "../../ast/types.js";
import type { InterpreterContext, ShellArray } from "../types.js";
export declare function cloneArray(array: ShellArray): ShellArray;
export declare function cloneArrays(arrays: Map<string, ShellArray> | undefined): Map<string, ShellArray>;
export declare function getArray(ctx: InterpreterContext, arrayName: string): ShellArray | undefined;
export declare function ensureArray(ctx: InterpreterContext, arrayName: string, kind?: "indexed" | "associative"): ShellArray;
export declare function setArrayKind(ctx: InterpreterContext, arrayName: string, kind: "indexed" | "associative"): ShellArray;
export declare function hasArray(ctx: InterpreterContext, arrayName: string): boolean;
export declare function getArrayElement(ctx: InterpreterContext, arrayName: string, key: string | number): string | undefined;
export declare function hasArrayElement(ctx: InterpreterContext, arrayName: string, key: string | number): boolean;
export declare function setArrayElement(ctx: InterpreterContext, arrayName: string, key: string | number, value: string, kind?: "indexed" | "associative"): void;
/** Prove a batch of distinct keys fits before any persistent mutation. */
export declare function assertArrayKeysFit(ctx: InterpreterContext, arrayName: string, keys: Iterable<string | number>, replace?: boolean): void;
export declare function deleteArrayElement(ctx: InterpreterContext, arrayName: string, key: string | number): boolean;
export declare function deleteArray(ctx: InterpreterContext, arrayName: string): void;
/**
 * Get all indices of an array, sorted in ascending order.
 * Indexed arrays are held in dedicated structured interpreter state.
 */
export declare function getArrayIndices(ctx: InterpreterContext, arrayName: string): number[];
/**
 * Clear all elements of an array from the environment.
 */
export declare function clearArray(ctx: InterpreterContext, arrayName: string): void;
/**
 * Get all keys of an associative array.
 * Associative keys are retained exactly in the array element map.
 */
export declare function getAssocArrayKeys(ctx: InterpreterContext, arrayName: string): string[];
/**
 * Remove surrounding quotes from a key string.
 * Handles 'key' and "key" → key
 */
export declare function unquoteKey(key: string): string;
/**
 * Parse a keyed array element from an AST WordNode like [key]=value or [key]+=value.
 * Returns { key, valueParts, append } where valueParts are the AST parts for the value.
 * Returns null if not a keyed element pattern.
 *
 * This is used to properly expand variables in the value part of keyed elements.
 */
export interface ParsedKeyedElement {
    key: string;
    valueParts: WordNode["parts"];
    append: boolean;
}
export declare function parseKeyedElementFromWord(word: WordNode): ParsedKeyedElement | null;
/**
 * Extract literal string content from a Word node (without expansion).
 * This is used for parsing associative array element syntax like [key]=value
 * where the [key] part may be parsed as a Glob.
 */
export declare function wordToLiteralString(word: WordNode): string;
