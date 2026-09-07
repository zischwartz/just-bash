import type { IFileSystem } from "./interface.js";
/**
 * Return an inert identity token for a filesystem. The token deliberately has
 * no prototype or reference back to the filesystem: consumers may safely use
 * it as a WeakMap key without acquiring filesystem authority.
 */
export declare function getFileSystemIdentity(fs: IFileSystem): object;
/** True only for inert tokens created by getFileSystemIdentity(). */
export declare function isFileSystemIdentity(value: object): boolean;
