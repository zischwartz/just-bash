/**
 * Aggregation commands: agg, groupby, frequency, stats
 */
import type { ExecResult, RuntimeCommandContext } from "../../types.js";
export declare function cmdAgg(args: string[], ctx: RuntimeCommandContext): Promise<ExecResult>;
export declare function cmdGroupby(args: string[], ctx: RuntimeCommandContext): Promise<ExecResult>;
export declare function cmdFrequency(args: string[], ctx: RuntimeCommandContext): Promise<ExecResult>;
export declare function cmdStats(args: string[], ctx: RuntimeCommandContext): Promise<ExecResult>;
