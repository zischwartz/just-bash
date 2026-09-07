import type { CommandExecutionBudget } from "../execution-scope.js";
import type { ExecutionLimits } from "../limits.js";
import type { FsStat, IFileSystem } from "./interface.js";
declare const canonicalPathBrand: unique symbol;
/** A canonical virtual path proven to be inside a particular validation root. */
export type CanonicalPath<Policy extends string = string> = string & {
    readonly [canonicalPathBrand]: Policy;
};
export interface CanonicalPathPolicy<Policy extends string> {
    readonly name: Policy;
    readonly root: string;
}
export declare function canonicalizePath<Policy extends string>(fs: IFileSystem, path: string, policy: CanonicalPathPolicy<Policy>): Promise<CanonicalPath<Policy>>;
export declare class FileSystemPolicyError extends Error {
    readonly operation: string;
    readonly virtualPath: string;
    readonly name = "FileSystemPolicyError";
    constructor(operation: string, virtualPath: string, message: string);
}
export type SameFileResult = "same" | "different" | "unknown";
export type PathContainmentResult = "inside" | "outside" | "unknown";
export type ResolvedFileIdentity = {
    readonly existence: "existing";
    readonly canonicalPath?: string;
    readonly stableIdentity?: string;
} | {
    readonly existence: "missing";
    /** Canonical nearest-existing parent plus every missing path component. */
    readonly canonicalPath?: string;
} | {
    readonly existence: "unknown";
};
/**
 * Resolve an existing path to both its canonical spelling and, where the
 * backend supports it, an alias-resistant identity. For a path that does not
 * exist, canonicalize the nearest existing parent and append all missing
 * components. Other failures remain unknown rather than being treated as
 * non-existence.
 */
export declare function resolveFileIdentity(fs: IFileSystem, path: string, budget?: FileTraversalBudget): Promise<ResolvedFileIdentity>;
/**
 * Conservatively compare two paths. `unknown` forces destructive callers to
 * stage work instead of treating an inability to prove identity as inequality.
 */
export declare function compareFileIdentity(fs: IFileSystem, left: string, right: string): Promise<SameFileResult>;
/**
 * Resolve an existing destination or its nearest existing parent before a
 * recursive copy/move. This closes lexical-prefix gaps created by directory
 * aliases while retaining `unknown` for backends that cannot prove it.
 */
export declare function compareCanonicalContainment(fs: IFileSystem, sourceDirectory: string, destination: string, budget?: FileTraversalBudget): Promise<PathContainmentResult>;
export type SymlinkTraversalPolicy = "never" | "follow";
export interface TraversalBudgetOptions {
    readonly limits: Required<ExecutionLimits>;
    readonly signal?: AbortSignal;
    readonly executionScope?: CommandExecutionBudget;
    readonly site: string;
    /** User-facing resource name for commands with established diagnostics. */
    readonly label?: string;
}
/** One shared, command-local view over the top-level execution work budget. */
export declare class FileTraversalBudget {
    private readonly options;
    private entries;
    private discoveredEntries;
    private work;
    constructor(options: TraversalBudgetOptions);
    checkpoint(work?: number): void;
    visit(depth: number): void;
    /**
     * Reserve directory children before retaining work items for them. A single
     * readdir can return far more entries than the traversal is allowed to
     * process, so waiting until each child is visited permits an oversized queue
     * allocation first.
     */
    discover(count: number): void;
}
export interface TraversalEntry {
    readonly path: string;
    readonly depth: number;
    readonly stat: FsStat;
    readonly isSymlink: boolean;
    readonly phase: "enter" | "leave";
}
export interface TraverseFileTreeOptions extends TraversalBudgetOptions {
    readonly fs: IFileSystem;
    readonly root: string;
    readonly symlinks?: SymlinkTraversalPolicy;
    readonly includeLeave?: boolean;
    readonly budget?: FileTraversalBudget;
}
/**
 * Iterative, deterministic DFS. Directory identities stay active until their
 * leave marker, detecting ancestor symlink cycles without suppressing valid
 * aliases in separate branches.
 */
export declare function traverseFileTree(options: TraverseFileTreeOptions, visitor: (entry: TraversalEntry) => void | Promise<void>): Promise<void>;
export {};
