/**
 * Loop Error Handling Helpers
 *
 * Consolidates the repeated error handling logic used in all loop constructs
 * (for, c-style for, while, until).
 */
import type { InterpreterContext } from "../types.js";
export type LoopAction = "break" | "continue" | "rethrow" | "error";
export interface LoopErrorResult {
    action: LoopAction;
    stdout: string;
    stderr: string;
    /**
     * Status the loop should adopt as "last command executed".
     *
     * For "break"/"continue" this is 0: bash's `break` and `continue` are
     * builtins that return 0, and they are the last command the body ran, so
     * the loop must not report the status of whatever failed before them.
     * For "error" it is the failure status.
     */
    exitCode?: number;
    error?: unknown;
}
/**
 * Exit status of the `break`/`continue` builtins themselves.
 *
 * A loop left via `break`/`continue` reports this, not the status of the
 * last command that ran before it:
 *
 *   while :; do false; break; done; echo $?   # 0, not 1
 */
export declare const BREAK_CONTINUE_STATUS = 0;
/**
 * Adopt `status` as the loop's "last command executed" and publish it to `$?`.
 *
 * The loop tracks its own exit code for the value it finally returns, but `$?`
 * has to move with it. A `for` loop runs nothing between the `continue` and
 * the next iteration's first command, so leaving `$?` behind lets the failed
 * command before the `continue` show up there:
 *
 *   for i in 1 2; do echo "$?"; false; continue; done   # 0 0, not 0 1
 *
 * `while`/`until` happen to hide this because their condition runs in between
 * and resets `$?` - they are synchronised here all the same.
 */
export declare function adoptLoopStatus(ctx: InterpreterContext, status: number): number;
/**
 * Handle errors thrown during loop body execution.
 *
 * @param error - The caught error
 * @param stdout - Current accumulated stdout
 * @param stderr - Current accumulated stderr
 * @param loopDepth - Current loop nesting depth from ctx.state.loopDepth
 * @returns Result indicating what action the loop should take
 */
export declare function handleLoopError(error: unknown, stdout: string, stderr: string, loopDepth: number): LoopErrorResult;
