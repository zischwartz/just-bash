import type { ExecResult, RuntimeCommandContext } from "../../types.js";
interface RunJsOptions {
    source: string;
    scriptPath: string;
    scriptArgs: string[];
    bootstrapCode?: string;
    isModule: boolean;
}
export declare function executeWithRun(options: RunJsOptions, ctx: RuntimeCommandContext): Promise<ExecResult>;
export {};
