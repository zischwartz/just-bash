import { normalizePath, validatePath } from "../../fs/path-utils.js";
import { serializeWord } from "../serialize.js";
export class TeePlugin {
    name = "tee";
    options;
    counter = 0;
    constructor(options) {
        this.options = options;
    }
    transform(context) {
        const teeFiles = [];
        const timestamp = this.options.timestamp ?? new Date();
        const ast = this.transformScript(context.ast, teeFiles, timestamp);
        return { ast, metadata: { teeFiles } };
    }
    formatTimestamp(date) {
        return date.toISOString().replace(/:/g, "-");
    }
    generateStdoutPath(index, commandName, timestamp) {
        const ts = this.formatTimestamp(timestamp);
        const idx = String(index).padStart(3, "0");
        validatePath(this.options.outputDir, "create tee output");
        if (!this.options.outputDir.startsWith("/") ||
            this.options.outputDir.split("/").includes("..")) {
            throw new Error("tee output directory must be an absolute safe path");
        }
        const dir = normalizePath(this.options.outputDir);
        const encodedCommandName = this.encodeCommandName(commandName);
        const candidate = normalizePath(`${dir}/${ts}-${idx}-${encodedCommandName}.stdout.txt`);
        if (dir !== "/" && !candidate.startsWith(`${dir}/`)) {
            throw new Error("tee output path escapes configured output directory");
        }
        return candidate;
    }
    encodeCommandName(commandName) {
        if (/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(commandName)) {
            return commandName;
        }
        // FNV-1a gives unsafe or very long names a deterministic collision-resistant
        // suffix without importing Node-only crypto into the browser build.
        let hash = 0x811c9dc5;
        for (let i = 0; i < commandName.length; i++) {
            hash ^= commandName.charCodeAt(i);
            hash = Math.imul(hash, 0x01000193) >>> 0;
        }
        const slug = commandName
            .replace(/[^A-Za-z0-9_-]/g, "_")
            .replace(/^_+|_+$/g, "")
            .slice(0, 32) || "command";
        return `${slug}-${hash.toString(16).padStart(8, "0")}`;
    }
    transformScript(node, teeFiles, timestamp) {
        return {
            ...node,
            statements: node.statements.map((s) => this.transformStatement(s, teeFiles, timestamp)),
        };
    }
    transformStatement(node, teeFiles, timestamp) {
        const newPipelines = [];
        const newOperators = [];
        for (let i = 0; i < node.pipelines.length; i++) {
            const pipeline = node.pipelines[i];
            // Preserve original operator connecting this pipeline
            if (i > 0) {
                newOperators.push(node.operators[i - 1]);
            }
            const result = this.transformPipeline(pipeline, teeFiles, timestamp);
            newPipelines.push(result.pipeline);
            if (result.origCmdNewIndices !== null) {
                // The restore builtin receives expansions from one PIPESTATUS
                // snapshot, returns the original pipeline status, and asks the
                // interpreter to publish those statuses without shell temp vars.
                newOperators.push(";");
                newPipelines.push(this.makePipestatusRestore(result.origCmdNewIndices, result.negated));
            }
        }
        return {
            ...node,
            pipelines: newPipelines,
            operators: newOperators,
        };
    }
    transformPipeline(node, teeFiles, timestamp) {
        // Only wrap commands in existing pipelines (2+ commands).
        // Standalone commands are never wrapped — this avoids breaking
        // state-modifying builtins (read, cd, export, eval, etc.) that
        // lose their side effects when moved into a subshell pipeline.
        if (node.commands.length <= 1) {
            return { pipeline: node, origCmdNewIndices: null, negated: false };
        }
        const newCommands = [];
        const newPipeStderr = [];
        const origCmdNewIndices = [];
        let anyWrapped = false;
        for (let i = 0; i < node.commands.length; i++) {
            const cmd = node.commands[i];
            const isLast = i === node.commands.length - 1;
            // Skip non-SimpleCommand, assignment-only, and non-targeted commands
            if (cmd.type !== "SimpleCommand" ||
                !cmd.name ||
                !this.shouldTarget(cmd)) {
                origCmdNewIndices.push(newCommands.length);
                newCommands.push(cmd);
                if (!isLast) {
                    newPipeStderr.push(node.pipeStderr?.[i] ?? false);
                }
                continue;
            }
            const commandName = this.getCommandName(cmd.name) ?? "unknown";
            const idx = this.counter++;
            const stdoutFile = this.generateStdoutPath(idx, commandName, timestamp);
            const teeCmd = this.makeTeeCommand(stdoutFile);
            const command = this.serializeCommand(cmd);
            teeFiles.push({
                commandIndex: idx,
                commandName,
                command,
                stdoutFile,
            });
            origCmdNewIndices.push(newCommands.length);
            newCommands.push(cmd);
            // cmd→tee: use original outgoing pipe type (preserves |& so tee
            // captures stderr too when the original pipe was |&)
            newPipeStderr.push(node.pipeStderr?.[i] ?? false);
            newCommands.push(teeCmd);
            if (!isLast) {
                // tee→next: always regular pipe (tee produces no stderr)
                newPipeStderr.push(false);
            }
            anyWrapped = true;
        }
        if (!anyWrapped) {
            return { pipeline: node, origCmdNewIndices: null, negated: false };
        }
        return {
            pipeline: {
                ...node,
                negated: false, // strip negation; applied to restore pipeline instead
                commands: newCommands,
                pipeStderr: newPipeStderr.length > 0 ? newPipeStderr : undefined,
            },
            origCmdNewIndices,
            negated: node.negated,
        };
    }
    /**
     * Restore PIPESTATUS and exit code without user-visible variables.
     * Produces: `builtin __just_bash_tee_restore ${PIPESTATUS[i]} ...`
     */
    makePipestatusRestore(indices, negated) {
        return {
            type: "Pipeline",
            commands: [
                {
                    type: "SimpleCommand",
                    assignments: [],
                    name: {
                        type: "Word",
                        parts: [{ type: "Literal", value: "builtin" }],
                    },
                    args: [
                        {
                            type: "Word",
                            parts: [{ type: "Literal", value: "__just_bash_tee_restore" }],
                        },
                        ...indices.map((index) => ({
                            type: "Word",
                            parts: [
                                {
                                    type: "ParameterExpansion",
                                    parameter: `PIPESTATUS[${index}]`,
                                    operation: null,
                                },
                            ],
                        })),
                    ],
                    redirections: [],
                },
            ],
            negated,
        };
    }
    shouldTarget(cmd) {
        if (!this.options.targetCommandPattern) {
            return true;
        }
        const name = this.getCommandName(cmd.name);
        return name !== null && this.options.targetCommandPattern.test(name);
    }
    getCommandName(word) {
        if (!word)
            return null;
        if (word.parts.length === 1 && word.parts[0].type === "Literal") {
            return word.parts[0].value;
        }
        return null;
    }
    serializeCommand(cmd) {
        const parts = [];
        if (cmd.name) {
            parts.push(serializeWord(cmd.name));
        }
        for (const arg of cmd.args) {
            parts.push(serializeWord(arg));
        }
        return parts.join(" ");
    }
    makeTeeCommand(outputFile) {
        return {
            type: "SimpleCommand",
            assignments: [],
            name: { type: "Word", parts: [{ type: "Literal", value: "tee" }] },
            args: [
                {
                    type: "Word",
                    parts: [{ type: "Literal", value: outputFile }],
                },
            ],
            redirections: [],
        };
    }
}
