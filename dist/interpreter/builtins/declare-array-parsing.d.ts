/**
 * Array Parsing Functions for declare/typeset
 *
 * Handles parsing of array literal syntax for the declare builtin.
 */
export interface ArrayParseLimits {
    maxElements: number;
    maxStringBytes: number;
}
/**
 * Parse array elements from content like "1 2 3" or "'a b' c d"
 */
export declare function parseArrayElements(content: string, limits?: ArrayParseLimits): string[];
/**
 * Parse associative array literal content like "['foo']=bar ['spam']=42"
 * Returns array of [key, value] pairs
 */
export declare function parseAssocArrayLiteral(content: string, limits?: ArrayParseLimits): [string, string][];
