/**
 * Tar archive utilities using modern-tar
 *
 * Provides helpers for creating and extracting tar archives
 * with optional gzip, bzip2, and xz compression.
 */
import { type ParsedTarEntryWithData, type TarEntry, type TarHeader } from "modern-tar";
import type { CommandExecutionBudget } from "../../execution-scope.js";
export type { TarEntry, TarHeader, ParsedTarEntryWithData };
export interface ArchiveCreationLimits {
    maxArchiveSize?: number;
    maxEntries?: number;
    maxEntrySize?: number;
    maxCompressedSize?: number;
    maxExpansionRatio?: number;
    signal?: AbortSignal;
    /** Shared live-memory owner supplied by the tar command integration. */
    executionScope?: CommandExecutionBudget;
    /** Set false to disable native whole-buffer codecs. */
    allowTrustedWholeBufferCodecs?: boolean;
}
/**
 * Entry for creating a tar archive
 */
export interface TarCreateEntry {
    name: string;
    content?: Uint8Array | string;
    mode?: number;
    mtime?: Date;
    isDirectory?: boolean;
    isSymlink?: boolean;
    linkTarget?: string;
    uid?: number;
    gid?: number;
}
/**
 * Create a tar archive from entries
 */
export declare function createArchive(entries: TarCreateEntry[], options?: ArchiveCreationLimits): Promise<Uint8Array>;
/**
 * Create a gzip-compressed tar archive from entries
 */
export declare function createCompressedArchive(entries: TarCreateEntry[], options?: ArchiveCreationLimits): Promise<Uint8Array>;
/**
 * Parsed tar entry for extraction
 */
export interface ParsedEntry {
    name: string;
    mode: number;
    uid: number;
    gid: number;
    size: number;
    mtime: Date;
    type: "file" | "directory" | "symlink" | "hardlink" | "other";
    linkTarget?: string;
    content: Uint8Array;
}
/**
 * Parse a tar archive and return entries
 */
export declare function parseArchive(data: Uint8Array, options?: ArchiveCreationLimits): Promise<{
    entries: ParsedEntry[];
    error?: string;
}>;
/**
 * Parse a gzip-compressed tar archive
 */
export declare function parseCompressedArchive(data: Uint8Array, options?: ArchiveCreationLimits): Promise<{
    entries: ParsedEntry[];
    error?: string;
}>;
/**
 * Check if data is gzip compressed (magic bytes 0x1f 0x8b)
 */
export declare function isGzipCompressed(data: Uint8Array): boolean;
/**
 * Check if data is bzip2 compressed (magic bytes "BZh")
 */
export declare function isBzip2Compressed(data: Uint8Array): boolean;
/**
 * Check if data is xz compressed (magic bytes 0xFD 0x37 0x7A 0x58 0x5A 0x00)
 */
export declare function isXzCompressed(data: Uint8Array): boolean;
/**
 * Create a bzip2-compressed tar archive from entries
 */
export declare function createBzip2CompressedArchive(entries: TarCreateEntry[], options?: ArchiveCreationLimits): Promise<Uint8Array>;
/**
 * Create an xz-compressed tar archive from entries.
 *
 * @param entries - Archive entries to include
 * @param options - Options controlling compression behavior
 * @param options.allowNativeCodecs - Set false to reject xz compression
 *   to avoid passing attacker-controlled bytes to native addons (node-liblzma).
 */
export declare function createXzCompressedArchive(entries: TarCreateEntry[], options?: ArchiveCreationLimits & {
    allowNativeCodecs?: boolean;
}): Promise<Uint8Array>;
/**
 * Parse a bzip2-compressed tar archive
 */
export declare function parseBzip2CompressedArchive(data: Uint8Array, options?: ArchiveCreationLimits & {
    maxDecompressedSize?: number;
}): Promise<{
    entries: ParsedEntry[];
    error?: string;
}>;
/**
 * Parse an xz-compressed tar archive.
 *
 * @param data - Raw archive bytes
 * @param options - Options controlling decompression behavior
 * @param options.allowNativeCodecs - Set false to reject xz decompression
 *   to avoid passing untrusted bytes to native addons (node-liblzma).
 */
export declare function parseXzCompressedArchive(data: Uint8Array, options?: ArchiveCreationLimits & {
    allowNativeCodecs?: boolean;
}): Promise<{
    entries: ParsedEntry[];
    error?: string;
}>;
/**
 * Check if data is zstd compressed (magic number 0x28 0xB5 0x2F 0xFD)
 */
export declare function isZstdCompressed(data: Uint8Array): boolean;
/**
 * Create a zstd-compressed tar archive from entries.
 *
 * @param entries - Archive entries to include
 * @param options - Options controlling compression behavior
 * @param options.allowNativeCodecs - Set false to reject zstd compression
 *   to avoid passing attacker-controlled bytes to native addons (@mongodb-js/zstd).
 */
export declare function createZstdCompressedArchive(entries: TarCreateEntry[], options?: ArchiveCreationLimits & {
    allowNativeCodecs?: boolean;
}): Promise<Uint8Array>;
/**
 * Parse a zstd-compressed tar archive.
 *
 * @param data - Raw archive bytes
 * @param options - Options controlling decompression behavior
 * @param options.allowNativeCodecs - Set false to reject zstd decompression
 *   to avoid passing untrusted bytes to native addons (@mongodb-js/zstd).
 */
export declare function parseZstdCompressedArchive(data: Uint8Array, options?: ArchiveCreationLimits & {
    allowNativeCodecs?: boolean;
}): Promise<{
    entries: ParsedEntry[];
    error?: string;
}>;
