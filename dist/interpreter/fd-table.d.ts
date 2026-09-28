/**
 * File Descriptor Table
 *
 * One typed view over `ctx.state.fileDescriptors`, the shell's descriptor
 * table. The table itself stays a `Map<number, string>` because it is part
 * of the public `CommandContext` surface — extensions read fd values as
 * content — so this module owns the string encoding instead.
 *
 * Entry kinds:
 * - `input`      readable content (`N< file`, `N<<EOF`, `N<<<word`). Reading
 *                is destructive: the remaining content is written back, so
 *                successive `read -u N` calls advance a shared position.
 * - `output`     a file opened for writing (`N> file`, `N>> file`).
 * - `readwrite`  `N<> file` — content plus an explicit read position.
 * - `dup-out`    fd duplicated from stdout/stderr (`N>&1`).
 * - `dup-in`     fd duplicated from stdin (`N<&0`).
 *
 * An `input` entry is stored verbatim, so its content can look exactly like
 * one of the marker encodings (a file whose first line is `__file__:/x`).
 * `inputFds` records which descriptors hold content, so the markers are
 * never guessed at for a descriptor this module opened; the prefix sniffing
 * in {@link decodeFdEntry} is only a fallback for descriptors written by
 * older code paths.
 */
import type { InterpreterContext } from "./types.js";
/** Lowest descriptor a script may open by number. 0/1/2 are the std streams. */
export declare const FIRST_USER_FD = 3;
export type FdEntry = {
    kind: "input";
    content: string;
} | {
    kind: "output";
    path: string;
    append: boolean;
} | {
    kind: "readwrite";
    path: string;
    position: number;
    content: string;
} | {
    kind: "dup-out";
    sourceFd: number;
} | {
    kind: "dup-in";
    sourceFd: number;
} | {
    kind: "closed";
};
/**
 * A descriptor's raw value, whether it is known to hold content, and which
 * other descriptors shared its open file description.
 */
interface FdSnapshotEntry {
    raw: string | undefined;
    isInput: boolean;
    aliases: number[];
}
/** Descriptor state captured by {@link rememberFd}, replayed by
 * {@link restoreFds}. */
export type FdSnapshot = Map<number, FdSnapshotEntry>;
/**
 * Decode a raw table value into a typed entry.
 * Callers that know the descriptor holds content should go through
 * {@link getFdEntry}, which consults `inputFds` first and never guesses.
 */
export declare function decodeFdEntry(raw: string): FdEntry;
/** Encode a typed entry back into its raw table value. */
export declare function encodeFdEntry(entry: FdEntry): string;
export declare function getFdAliasMembers(ctx: InterpreterContext, fd: number): number[];
/** Raw table value for `fd`, or undefined when the fd is not open. */
export declare function getRawFd(ctx: InterpreterContext, fd: number): string | undefined;
/** Typed entry for `fd`, or undefined when the fd is not open. */
export declare function getFdEntry(ctx: InterpreterContext, fd: number): FdEntry | undefined;
export declare function isFdOpen(ctx: InterpreterContext, fd: number): boolean;
/**
 * Store a raw value, charging the descriptor limit for newly opened fds.
 * Opening a descriptor gives it a NEW open file description, so it stops
 * sharing an offset with anything it was previously duplicated from —
 * `exec 4<&3; exec 4< other` leaves fd 3 alone.
 */
export declare function setRawFd(ctx: InterpreterContext, fd: number, raw: string, isInput?: boolean): void;
export declare function setFdEntry(ctx: InterpreterContext, fd: number, entry: FdEntry): void;
export declare function closeFd(ctx: InterpreterContext, fd: number): void;
/**
 * Point `fd` at whatever `sourceFd` refers to, the way `dup2()` does: the raw
 * value and its content/marker classification are copied, and the two
 * descriptors join one alias group so they share a read offset from here on.
 * Returns false when `sourceFd` is not open.
 */
export declare function dupFd(ctx: InterpreterContext, fd: number, sourceFd: number): boolean;
export declare function moveFd(ctx: InterpreterContext, fd: number, sourceFd: number): boolean;
/**
 * Readable bytes remaining on `fd`.
 * Returns a reason instead of content when the fd cannot be read from, so
 * callers can pick the diagnostic bash uses for their context.
 */
export declare function readFd(ctx: InterpreterContext, fd: number): {
    content: string;
} | {
    error: "not-open" | "write-only";
};
/**
 * Advance the read position of `fd` by `count` characters.
 * `input` entries keep only the unread remainder, matching bash's single
 * shared file offset: every later read continues where this one stopped —
 * including reads through a descriptor duplicated from this one, which
 * shares the same open file description.
 */
export declare function advanceFd(ctx: InterpreterContext, fd: number, count: number): void;
export declare function writeFdEntry(ctx: InterpreterContext, entry: FdEntry, descriptors: number[], content: string, encoding: "binary" | "utf8"): Promise<boolean>;
/**
 * Record `fd`'s current state into `snapshot`, unless it is already there —
 * the FIRST value seen is the one a later {@link restoreFds} puts back.
 * A `raw` of `undefined` records "was not open".
 */
export declare function rememberFd(ctx: InterpreterContext, snapshot: FdSnapshot, fd: number): void;
/**
 * Snapshot the given descriptors so a scoped redirection can put the table
 * back the way it found it.
 */
export declare function snapshotFds(ctx: InterpreterContext, fds: Iterable<number>): FdSnapshot;
/**
 * Undo the descriptor changes recorded by {@link rememberFd}.
 *
 * Only the descriptor is restored, never the file offset behind it: a
 * command that read through `4<&3` has moved the shared description, and
 * bash leaves fd 3 where that read left it once fd 4 is taken back down.
 */
export declare function restoreFds(ctx: InterpreterContext, snapshot: FdSnapshot): void;
export {};
