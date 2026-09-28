/**
 * eval - Execute arguments as a shell command
 *
 * Concatenates all arguments and executes them as a shell command
 * in the current environment (variables persist after eval).
 */
import type { ExecResult } from "../../types.js";
import type { InterpreterContext } from "../types.js";
export declare function handleEval(ctx: InterpreterContext, args: string[], stdin?: string, 
/**
 * A redirection gave this `eval` its own fd 0. Empty content is still
 * ownership: `eval '…' < empty-file` means EOF inside, where an
 * unredirected `eval` shares the shell's stdin.
 */
stdinRedirected?: boolean): Promise<ExecResult>;
