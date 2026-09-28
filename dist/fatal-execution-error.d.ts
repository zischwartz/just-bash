/**
 * Rethrow errors that command-level recovery must never turn into ordinary
 * command failures. Call this first in broad catch blocks.
 */
export declare function rethrowFatalExecutionError(error: unknown): void;
