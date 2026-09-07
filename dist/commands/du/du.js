import { traverseFileTree } from "../../fs/traversal.js";
import { ExecutionAbortedError, ExecutionLimitError, } from "../../interpreter/errors.js";
import { parseArgs } from "../../utils/args.js";
import { hasHelpFlag, showHelp } from "../help.js";
const duHelp = {
    name: "du",
    summary: "estimate file space usage",
    usage: "du [OPTION]... [FILE]...",
    options: [
        "-a          write counts for all files, not just directories",
        "-h          print sizes in human readable format",
        "-s          display only a total for each argument",
        "-c          produce a grand total",
        "--max-depth=N  print total for directory only if N or fewer levels deep",
        "    --help  display this help and exit",
    ],
};
const argDefs = {
    allFiles: { short: "a", type: "boolean" },
    humanReadable: { short: "h", type: "boolean" },
    summarize: { short: "s", type: "boolean" },
    grandTotal: { short: "c", type: "boolean" },
    maxDepth: { long: "max-depth", type: "number" },
};
export const duCommand = {
    name: "du",
    async execute(args, ctx) {
        if (hasHelpFlag(args)) {
            return showHelp(duHelp);
        }
        const parsed = parseArgs("du", args, argDefs);
        if (!parsed.ok)
            return parsed.error;
        const options = {
            allFiles: parsed.result.flags.allFiles,
            humanReadable: parsed.result.flags.humanReadable,
            summarize: parsed.result.flags.summarize,
            grandTotal: parsed.result.flags.grandTotal,
            maxDepth: parsed.result.flags.maxDepth ?? null,
        };
        const targets = parsed.result.positional;
        // Default to current directory
        if (targets.length === 0) {
            targets.push(".");
        }
        let stdout = "";
        let stderr = "";
        let grandTotal = 0;
        for (const target of targets) {
            const fullPath = ctx.fs.resolvePath(ctx.cwd, target);
            try {
                // Check if path exists first
                await ctx.fs.stat(fullPath);
                const result = await calculateSize(ctx, fullPath, target, options, 0);
                stdout += result.output;
                grandTotal += result.totalSize;
                stderr += result.stderr;
            }
            catch (error) {
                if (error instanceof ExecutionLimitError ||
                    error instanceof ExecutionAbortedError) {
                    throw error;
                }
                stderr += `du: cannot access '${target}': No such file or directory\n`;
            }
        }
        if (options.grandTotal && targets.length > 0) {
            stdout += `${formatSize(grandTotal, options.humanReadable)}\ttotal\n`;
        }
        return { stdout, stderr, exitCode: stderr ? 1 : 0 };
    },
};
async function calculateSize(ctx, fullPath, displayPath, options, depth) {
    const result = { output: "", totalSize: 0, stderr: "" };
    const directorySizes = new Map();
    await traverseFileTree({
        fs: ctx.fs,
        root: fullPath,
        limits: ctx.limits,
        signal: ctx.signal,
        executionScope: ctx.executionScope,
        site: "du",
        symlinks: "never",
        includeLeave: true,
    }, (entry) => {
        const relative = entry.path.slice(fullPath.length).replace(/^\//, "");
        const shown = relative
            ? displayPath === "."
                ? relative
                : `${displayPath}/${relative}`
            : displayPath;
        const parent = entry.path === "/"
            ? "/"
            : entry.path.slice(0, entry.path.lastIndexOf("/")) || "/";
        if (entry.phase === "enter") {
            if (entry.stat.isDirectory) {
                directorySizes.set(entry.path, 0);
                return;
            }
            directorySizes.set(parent, (directorySizes.get(parent) ?? 0) + entry.stat.size);
            if ((options.allFiles || entry.depth === depth) && !options.summarize) {
                result.output += `${formatSize(entry.stat.size, options.humanReadable)}\t${shown}\n`;
            }
            if (entry.depth === depth)
                result.totalSize = entry.stat.size;
            return;
        }
        const size = directorySizes.get(entry.path) ?? 0;
        if (entry.depth > depth) {
            directorySizes.set(parent, (directorySizes.get(parent) ?? 0) + size);
        }
        else {
            result.totalSize = size;
        }
        const relativeDepth = entry.depth - depth;
        if ((options.summarize && relativeDepth === 0) ||
            (!options.summarize &&
                (options.maxDepth === null || relativeDepth <= options.maxDepth))) {
            result.output += `${formatSize(size, options.humanReadable)}\t${shown}\n`;
        }
    });
    return result;
}
function formatSize(bytes, humanReadable) {
    if (!humanReadable) {
        // Return size in 1K blocks
        return String(Math.ceil(bytes / 1024) || 1);
    }
    if (bytes < 1024) {
        return `${bytes}`;
    }
    else if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)}K`;
    }
    else if (bytes < 1024 * 1024 * 1024) {
        return `${(bytes / (1024 * 1024)).toFixed(1)}M`;
    }
    else {
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)}G`;
    }
}
export const flagsForFuzzing = {
    name: "du",
    flags: [
        { flag: "-a", type: "boolean" },
        { flag: "-h", type: "boolean" },
        { flag: "-s", type: "boolean" },
        { flag: "-c", type: "boolean" },
        { flag: "--max-depth", type: "value", valueHint: "number" },
    ],
    needsFiles: true,
};
