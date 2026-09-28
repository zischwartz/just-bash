/**
 * Custom Commands API
 *
 * Provides types and utilities for registering user-provided TypeScript commands.
 */
import { type ByteString } from "./encoding.js";
import type { IFileSystem } from "./fs/interface.js";
import { type ExecutionLimitProfile, type ExecutionLimits } from "./limits.js";
import type { Command, CommandContext, ExecResult, ResolvedCommandContext, RuntimeCommandContext } from "./types.js";
/**
 * A custom command - either a Command object or a lazy loader.
 */
export type CustomCommand = Command | LazyCommand;
/**
 * Lazy-loaded custom command (for code-splitting).
 */
export interface LazyCommand {
    name: string;
    /**
     * Set false to run through the restricted extension boundary. Commands are
     * trusted by default for compatibility with existing host integrations.
     */
    trusted?: boolean;
    load: () => Promise<Command>;
}
/** Inputs for a complete standalone command context, primarily for tests. */
export interface CommandContextOptions extends Omit<Partial<CommandContext>, "fs" | "limits" | "stdin"> {
    fs: IFileSystem;
    stdin?: ByteString;
    executionLimits?: ExecutionLimits;
    executionLimitProfile?: ExecutionLimitProfile;
}
/**
 * Build the same resolved public context shape that the interpreter gives a
 * custom command. This avoids hand-maintained test objects drifting whenever
 * an internal execution limit is added.
 */
export declare function createCommandContext(options: CommandContextOptions): RuntimeCommandContext;
/**
 * Type guard to check if a custom command is lazy-loaded.
 */
export declare function isLazyCommand(cmd: CustomCommand): cmd is LazyCommand;
/**
 * Define a TypeScript command with type inference.
 * Convenience wrapper - you can also just use the Command interface directly.
 *
 * @example
 * ```ts
 * const hello = defineCommand("hello", async (args, ctx) => {
 *   const name = args[0] || "world";
 *   return { stdout: `Hello, ${name}!\n`, stderr: "", exitCode: 0 };
 * });
 *
 * const bash = new Bash({ customCommands: [hello] });
 * await bash.exec("hello Alice"); // "Hello, Alice!\n"
 * ```
 */
export declare function defineCommand(name: string, execute: (args: string[], ctx: ResolvedCommandContext) => Promise<ExecResult>, options?: {
    trusted?: boolean;
}): Command;
/**
 * Create a lazy-loaded wrapper for a custom command.
 * The command is only loaded when first executed.
 */
export declare function createLazyCustomCommand(lazy: LazyCommand): Command;
