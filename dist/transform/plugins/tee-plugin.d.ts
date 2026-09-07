import type { TransformContext, TransformPlugin, TransformResult } from "../types.js";
export interface TeePluginOptions {
    outputDir: string;
    targetCommandPattern?: {
        test(input: string): boolean;
    };
    timestamp?: Date;
}
export interface TeeFileInfo {
    commandIndex: number;
    commandName: string;
    /** The full command string (name + arguments) before tee wrapping */
    command: string;
    stdoutFile: string;
}
export interface TeePluginMetadata {
    teeFiles: TeeFileInfo[];
}
export declare class TeePlugin implements TransformPlugin<TeePluginMetadata> {
    readonly name = "tee";
    private options;
    private counter;
    constructor(options: TeePluginOptions);
    transform(context: TransformContext): TransformResult<TeePluginMetadata>;
    private formatTimestamp;
    private generateStdoutPath;
    private encodeCommandName;
    private transformScript;
    private transformStatement;
    private transformPipeline;
    /**
     * Restore PIPESTATUS and exit code without user-visible variables.
     * Produces: `builtin __just_bash_tee_restore ${PIPESTATUS[i]} ...`
     */
    private makePipestatusRestore;
    private shouldTarget;
    private getCommandName;
    private serializeCommand;
    private makeTeeCommand;
}
