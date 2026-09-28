/**
 * Subshell, Group, and Script Execution
 *
 * Handles execution of subshells (...), groups { ...; }, and user scripts
 */
import type { GroupNode, ScriptNode, StatementNode, SubshellNode } from "../ast/types.js";
import type { ExecResult } from "../types.js";
import type { InterpreterContext } from "./types.js";
/**
 * Type for executeStatement callback
 */
export type ExecuteStatementFn = (stmt: StatementNode) => Promise<ExecResult>;
/**
 * Execute a subshell node (...).
 * Creates an isolated execution environment that doesn't affect the parent.
 */
export declare function executeSubshell(ctx: InterpreterContext, node: SubshellNode, stdin: string, executeStatement: ExecuteStatementFn, 
/** See `executeGroup`: empty content can still be an owned, empty fd 0. */
stdinOwned?: boolean): Promise<ExecResult>;
/**
 * Execute a group node { ...; }.
 * Runs commands in the current execution environment.
 */
export declare function executeGroup(ctx: InterpreterContext, node: GroupNode, stdin: string, executeStatement: ExecuteStatementFn, 
/**
 * The caller already gave this group its own fd 0 — a function body whose
 * definition or call was redirected. Needed because an empty `stdin` cannot
 * say whether it came from `< empty-file` or from no redirection at all.
 */
stdinOwned?: boolean): Promise<ExecResult>;
/**
 * Type for executeScript callback
 */
export type ExecuteScriptFn = (node: ScriptNode) => Promise<ExecResult>;
/**
 * Execute a user script file found in PATH.
 * This handles executable files that don't have registered command handlers.
 * The script runs in a subshell-like environment with its own positional parameters.
 */
export declare function executeUserScript(ctx: InterpreterContext, scriptPath: string, args: string[], stdin: string, executeScript: ExecuteScriptFn): Promise<ExecResult>;
