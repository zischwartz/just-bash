/**
 * Custom Commands API
 *
 * Provides types and utilities for registering user-provided TypeScript commands.
 */
import { EMPTY_BYTES } from "./encoding.js";
import { getFileSystemIdentity } from "./fs/identity.js";
import { resolveLimits, } from "./limits.js";
/**
 * Build the same resolved public context shape that the interpreter gives a
 * custom command. This avoids hand-maintained test objects drifting whenever
 * an internal execution limit is added.
 */
export function createCommandContext(options) {
    const { executionLimits, executionLimitProfile, fs, stdin = EMPTY_BYTES, ...overrides } = options;
    return {
        fs,
        fsIdentity: overrides.fsIdentity ?? getFileSystemIdentity(fs),
        cwd: "/",
        env: new Map(),
        stdin,
        limits: resolveLimits(executionLimits, executionLimitProfile),
        ...overrides,
    };
}
/**
 * Type guard to check if a custom command is lazy-loaded.
 */
export function isLazyCommand(cmd) {
    return "load" in cmd && typeof cmd.load === "function";
}
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
export function defineCommand(name, execute, options = {}) {
    return { name, trusted: options.trusted !== false, execute };
}
/**
 * Create a lazy-loaded wrapper for a custom command.
 * The command is only loaded when first executed.
 */
export function createLazyCustomCommand(lazy) {
    let cached = null;
    let loading = null;
    return {
        name: lazy.name,
        trusted: lazy.trusted !== false,
        async execute(args, ctx) {
            if (!cached) {
                let currentLoading = loading;
                if (!currentLoading) {
                    currentLoading = lazy.load().then((command) => {
                        cached = command;
                        return command;
                    });
                    loading = currentLoading;
                }
                try {
                    cached = await currentLoading;
                }
                catch (error) {
                    // A failed dynamic import may be transient. Permit a later explicit
                    // invocation to retry while still single-flighting concurrent calls.
                    if (loading === currentLoading)
                        loading = null;
                    throw error;
                }
            }
            const command = cached;
            if (!command)
                throw new Error(`Failed to load command: ${lazy.name}`);
            return command.execute(args, ctx);
        },
    };
}
