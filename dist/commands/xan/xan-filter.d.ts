/**
 * Filter and sort commands: filter, sort, dedup, top
 */
import type { ExecResult, RuntimeCommandContext } from "../../types.js";
export declare function cmdFilter(args: string[], ctx: RuntimeCommandContext): Promise<ExecResult>;
export declare function cmdSort(args: string[], ctx: RuntimeCommandContext): Promise<ExecResult>;
export declare function cmdDedup(args: string[], ctx: RuntimeCommandContext): Promise<ExecResult>;
export declare function cmdTop(args: string[], ctx: RuntimeCommandContext): Promise<ExecResult>;
