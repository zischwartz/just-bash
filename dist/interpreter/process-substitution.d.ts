/**
 * Process Substitution
 *
 * Implements bash's `<(cmd)` and `>(cmd)`.
 *
 * Real bash runs `cmd` asynchronously connected to a pipe and substitutes the
 * pipe's path (`/dev/fd/N`, or a FIFO on systems without `/dev/fd`). There are
 * no processes or pipes here, so the construct is modelled with the same
 * building blocks the rest of the interpreter uses for fds: a backing file in
 * the VFS under `/dev/fd/`, whose contents are produced (or consumed) by
 * running the body as a subshell.
 *
 * - `<(cmd)` runs `cmd` eagerly during word expansion, writes its stdout to
 *   the backing file, and substitutes that path. Because the body is fully
 *   buffered, a body that never terminates on its own (e.g. `yes`) is bounded
 *   by the ordinary execution limits rather than by the reader closing the
 *   pipe.
 * - `>(cmd)` substitutes an empty writable backing file. Once the command that
 *   consumed the path has finished, whatever was written to the file is fed to
 *   `cmd` as stdin and `cmd`'s output is appended to the result — the closest
 *   deterministic analogue of bash's asynchronous writer.
 *
 * Backing files live only for the duration of the command whose expansion
 * created them: {@link markProcessSubstitutions} / {@link releaseProcessSubstitutions}
 * bracket every command execution, so fd numbers are reused (63, 62, … just
 * like bash) and nothing accumulates in the VFS across commands.
 */
import type { ProcessSubstitutionPart, ScriptNode } from "../ast/types.js";
import type { InterpreterContext } from "./types.js";
/** A process substitution whose backing file is still live. */
export interface ProcessSubstitutionEntry {
    /** Synthetic descriptor number (63, 62, …). */
    fd: number;
    /** Backing file path handed to the outer command. */
    path: string;
    /** `<(...)` or `>(...)`. */
    direction: "input" | "output";
    /** Body to run with the written bytes as stdin (output substitutions only). */
    body: ScriptNode;
}
/**
 * Expand a process substitution to the path the outer command should use.
 */
export declare function openProcessSubstitution(ctx: InterpreterContext, part: ProcessSubstitutionPart): Promise<string>;
/**
 * Remember how many process substitutions were live before a command ran.
 */
export declare function markProcessSubstitutions(ctx: InterpreterContext): number;
/** Output produced by `>(cmd)` writers drained at the end of a command. */
export interface ProcessSubstitutionWriterOutput {
    stdout: string;
    stderr: string;
}
/**
 * Tear down every process substitution opened since `mark`, newest first.
 *
 * Input substitutions just drop their backing file. Output substitutions first
 * feed everything the outer command wrote into their body; the body's output is
 * returned so the caller can append it to the command's own, the way bash's
 * asynchronous writer shares the shell's stdout and stderr.
 */
export declare function releaseProcessSubstitutions(ctx: InterpreterContext, mark: number): Promise<ProcessSubstitutionWriterOutput>;
