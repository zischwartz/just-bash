/**
 * Output formatters for diff.
 *
 * The three formats GNU diff can produce: POSIX normal format (the default),
 * unified format (-u) and context format (-c). Layout was derived by running
 * GNU diffutils 3.12 and matching the bytes it emits.
 *
 * Two intentional deviations from GNU:
 *
 * - The -u/-c file header carries no timestamp. GNU appends a tab and the
 *   file's mtime; inside a virtual filesystem that is often synthetic or
 *   absent, and it would make output non-reproducible. Patch consumers ignore
 *   the field.
 * - When several minimal edit scripts exist for the same pair of files, which
 *   one comes out is arbitrary, and this picks a different one than GNU on
 *   some inputs. Hunks are still minimal and the formats are exact; only the
 *   grouping of ambiguous changes can differ.
 */
/** Number of context lines GNU shows around a change for -u and -c. */
export declare const DEFAULT_CONTEXT = 3;
export interface FileLines {
    /** Lines with their trailing newline stripped. */
    lines: string[];
    /** True when the last line is not newline-terminated. */
    noEol: boolean;
}
/**
 * A run of adjacent deleted and/or inserted lines. Starts are 0-based indices
 * into the corresponding `FileLines.lines`.
 */
export interface Change {
    oldStart: number;
    oldCount: number;
    newStart: number;
    newCount: number;
}
/** Splits file content into lines, remembering a missing final newline. */
export declare function splitLines(content: string): FileLines;
/** Computes the runs of deleted and/or inserted lines between two files. */
export declare function computeChanges(oldFile: FileLines, newFile: FileLines, ignoreCase: boolean): Change[];
/** POSIX normal format: `2c2` / `< old` / `---` / `> new`. */
export declare function formatNormal(oldFile: FileLines, newFile: FileLines, changes: Change[]): string;
/** Unified format (-u): `--- old`, `+++ new`, `@@` hunks. */
export declare function formatUnified(oldName: string, newName: string, oldFile: FileLines, newFile: FileLines, changes: Change[], context: number): string;
/** Context format (-c): `*** old`, `--- new`, `***************` hunks. */
export declare function formatContext(oldName: string, newName: string, oldFile: FileLines, newFile: FileLines, changes: Change[], context: number): string;
