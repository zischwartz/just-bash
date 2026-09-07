/**
 * Utility functions for curl command
 */
/**
 * Status line + headers + trailing blank line, matching `-i` / `-D` layout.
 */
export declare function formatHeaderBlock(status: number, statusText: string, headers: Record<string, string>): string;
/**
 * Extract filename from URL for -O option
 */
export declare function extractFilename(url: string): string;
/**
 * Apply write-out format string replacements
 */
export declare function applyWriteOut(format: string, result: {
    status: number;
    headers: Record<string, string>;
    url: string;
    bodyLength: number;
}): string;
