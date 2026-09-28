import type { InterpreterState } from "./types.js";
/**
 * Install an isolated copy of mutable shell namespace state and return an
 * idempotent rollback. Process-wide accounting and PID allocation deliberately
 * remain shared with the parent execution.
 */
export declare function beginIsolatedShellState(state: InterpreterState): () => void;
