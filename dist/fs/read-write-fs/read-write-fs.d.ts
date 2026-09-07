/**
 * ReadWriteFs - Direct wrapper around the real filesystem
 *
 * All operations go directly to the underlying Node.js filesystem.
 * Paths are relative to the configured root directory.
 *
 * Security: Symlinks are blocked by default (allowSymlinks: false).
 * All real-FS access goes through resolveAndValidate() / validateParent()
 * gates which detect symlink traversal via path comparison. When symlinks
 * are allowed, targets are validated and transformed to stay within root.
 * New methods must use these gates — never access the real FS directly.
 */
import { type ByteString } from "../../encoding.js";
import { type FileContent } from "../encoding.js";
import type { CpOptions, DirentEntry, FsStat, IFileSystem, MkdirOptions, ReadFileOptions, RmOptions, WriteFileOptions } from "../interface.js";
export interface ReadWriteFsOptions {
    /**
     * The root directory on the real filesystem.
     * All paths are relative to this root.
     */
    root: string;
    /**
     * Maximum file size in bytes that can be read.
     * Files larger than this will throw an EFBIG error.
     * Defaults to 10MB (10485760).
     */
    maxFileReadSize?: number;
    /**
     * Maximum file size in bytes that metadata operations and append may copy
     * when isolating a multiply-linked regular file. Defaults to 100MB.
     * Set to 0 to disable this limit.
     */
    maxCopyOnWriteSize?: number;
    /**
     * Maximum regular file size in bytes that cp may copy. Defaults to 0
     * (unlimited) for compatibility with normal filesystem copy behavior.
     */
    maxCopySize?: number;
    /**
     * Whether to allow following and creating symlinks.
     * When false (default), any path traversing a symlink is rejected
     * and symlink() throws EPERM.
     */
    allowSymlinks?: boolean;
}
export declare class ReadWriteFs implements IFileSystem {
    private static activeMutationRoots;
    private static pendingMutations;
    private readonly root;
    private readonly canonicalRoot;
    private readonly maxFileReadSize;
    private readonly maxCopyOnWriteSize;
    private readonly maxCopySize;
    private readonly allowSymlinks;
    constructor(options: ReadWriteFsOptions);
    /**
     * Validate that a resolved real path stays within the sandbox root and
     * return the canonical (symlink-resolved) path for use in subsequent I/O.
     * This closes the TOCTOU gap where the original path could be swapped
     * between validation and use.
     * Throws EACCES if the path escapes the root.
     */
    private resolveAndValidate;
    /**
     * Validate the parent directory of a path (for operations like lstat/readlink
     * that should not follow the final component's symlink).
     * Returns the canonical parent joined with the original basename.
     */
    private validateParent;
    /**
     * Convert a virtual path to a real filesystem path.
     */
    private toRealPath;
    readFile(path: string, options?: ReadFileOptions | BufferEncoding): Promise<string>;
    readFileBytes(path: string): Promise<ByteString>;
    readFileBuffer(path: string): Promise<Uint8Array>;
    writeFile(path: string, content: FileContent, options?: WriteFileOptions | BufferEncoding): Promise<void>;
    private writeFileUnlocked;
    appendFile(path: string, content: FileContent, options?: WriteFileOptions | BufferEncoding): Promise<void>;
    private appendFileUnlocked;
    private withFilesystemMutation;
    private static drainMutationQueue;
    private assertCopyOnWriteSize;
    private assertCopySize;
    private randomTransactionToken;
    /** Open a bounded copy source, avoiding atime updates where permitted. */
    private openCopySource;
    /**
     * Commit file contents by replacing a directory entry, never by mutating
     * its existing inode. This prevents writes through host-planted hard links
     * from changing files outside the sandbox.
     */
    private replaceFile;
    exists(path: string): Promise<boolean>;
    stat(path: string): Promise<FsStat>;
    lstat(path: string): Promise<FsStat>;
    mkdir(path: string, options?: MkdirOptions): Promise<void>;
    private mkdirUnlocked;
    readdir(path: string): Promise<string[]>;
    readdirWithFileTypes(path: string): Promise<DirentEntry[]>;
    rm(path: string, options?: RmOptions): Promise<void>;
    private rmUnlocked;
    cp(src: string, dest: string, options?: CpOptions): Promise<void>;
    private cpUnlocked;
    private copyTreeEntry;
    private assertCopyDestinationWritable;
    private replaceSymlink;
    private toVirtualAbsoluteSymlinkTarget;
    private preflightCopyTree;
    mv(src: string, dest: string): Promise<void>;
    private mvUnlocked;
    /** Compare canonical path identity, not user-visible lexical spelling. */
    private isSameOrDescendantIdentity;
    private uniqueTransactionPath;
    /**
     * Transactional EXDEV fallback. The destination is assembled under a hidden
     * sibling, then committed by rename. Source removal is also staged by rename,
     * so failures can restore both visible names without claiming atomicity.
     */
    private moveAcrossDevices;
    resolvePath(base: string, path: string): string;
    getAllPaths(): string[];
    private sanitizeError;
    /**
     * Recursively scan a directory for symlinks whose targets escape the sandbox.
     * Returns an array of paths (real OS paths) for any escaping symlinks found.
     */
    private findEscapingSymlinks;
    private scanDir;
    chmod(path: string, mode: number): Promise<void>;
    private chmodUnlocked;
    symlink(target: string, linkPath: string): Promise<void>;
    private symlinkUnlocked;
    link(existingPath: string, newPath: string): Promise<void>;
    private linkUnlocked;
    readlink(path: string): Promise<string>;
    /**
     * Resolve all symlinks in a path to get the canonical physical path.
     * This is equivalent to POSIX realpath().
     */
    realpath(path: string): Promise<string>;
    /**
     * Set access and modification times of a file
     * @param path - The file path
     * @param atime - Access time
     * @param mtime - Modification time
     */
    utimes(path: string, atime: Date, mtime: Date): Promise<void>;
    private utimesUnlocked;
}
