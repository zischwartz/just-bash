/**
 * Core xan commands: headers, count, head, tail, slice, reverse
 */
import type { ExecResult, RuntimeCommandContext } from "../../types.js";
export declare function cmdHeaders(args: string[], ctx: RuntimeCommandContext): Promise<ExecResult>;
export declare function cmdCount(args: string[], ctx: RuntimeCommandContext): Promise<ExecResult>;
export declare function cmdHead(args: string[], ctx: RuntimeCommandContext): Promise<ExecResult>;
export declare function cmdTail(args: string[], ctx: RuntimeCommandContext): Promise<ExecResult>;
export declare function cmdSlice(args: string[], ctx: RuntimeCommandContext): Promise<ExecResult>;
export declare function cmdReverse(args: string[], ctx: RuntimeCommandContext): Promise<ExecResult>;
