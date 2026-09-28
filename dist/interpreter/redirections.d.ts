/**
 * Redirection Handling
 *
 * Handles output redirections:
 * - > : Write stdout to file
 * - >> : Append stdout to file
 * - 2> : Write stderr to file
 * - &> : Write both stdout and stderr to file
 * - >& : Redirect fd to another fd
 * - {fd}>file : Allocate FD and store in variable
 */
import type { RedirectionNode } from "../ast/types.js";
import type { ExecResult } from "../types.js";
import { ControlFlowError, ExecutionLimitError, ExitError } from "./errors.js";
import { type FdEntry } from "./fd-table.js";
import type { InterpreterContext } from "./types.js";
/** Expanded targets keyed by their position in the original redirection list. */
export type ExpandedRedirectTargets = Map<number, string>;
type PreparedDupSource = {
    kind: "standard";
    fd: number;
} | {
    kind: "entry";
    entry: FdEntry;
    descriptors: number[];
};
export type PreparedDupSources = Map<number, PreparedDupSource>;
export type PreparedRedirections = {
    targets: ExpandedRedirectTargets;
    dupSources: PreparedDupSources;
    standardRoutes: Map<number, FdEntry>;
    stdin: string | undefined;
    stdinSourceFd: number;
    error: ExecResult | null;
    errorCause?: ExitError | ExecutionLimitError;
};
export type RedirectionPolicy = "scoped" | "bare" | "persistent";
export declare const SIMPLE_REDIRECTION_POLICY: RedirectionPolicy;
export declare const BARE_REDIRECTION_POLICY: RedirectionPolicy;
export declare const EXEC_REDIRECTION_POLICY: RedirectionPolicy;
export type RedirectionTransaction = {
    prepare: (inheritedStdin?: string) => Promise<PreparedRedirections>;
    finish: () => void;
};
export declare function createRedirectionTransaction(ctx: InterpreterContext, redirections: RedirectionNode[], policy: RedirectionPolicy): RedirectionTransaction;
export declare function preparedRedirectionError(prepared: PreparedRedirections): ExecResult;
export declare function routeControlFlowError(ctx: InterpreterContext, error: ControlFlowError, redirections: RedirectionNode[], prepared: PreparedRedirections): Promise<void>;
export declare function withPreparedRedirections(ctx: InterpreterContext, redirections: RedirectionNode[], inheritedStdin: string, run: (prepared: PreparedRedirections) => Promise<ExecResult>): Promise<ExecResult>;
export declare function applyRedirections(ctx: InterpreterContext, result: ExecResult, redirections: RedirectionNode[], targets: ExpandedRedirectTargets, dupSources?: PreparedDupSources, standardRoutes?: Map<number, FdEntry>, writeErrorCommand?: string, omitShellPrefix?: boolean): Promise<ExecResult>;
export {};
