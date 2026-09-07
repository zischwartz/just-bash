/**
 * Column operation commands: select, drop, rename, enum
 */
import type { ExecResult, RuntimeCommandContext } from "../../types.js";
export declare function cmdSelect(args: string[], ctx: RuntimeCommandContext): Promise<ExecResult>;
export declare function cmdDrop(args: string[], ctx: RuntimeCommandContext): Promise<ExecResult>;
export declare function cmdRename(args: string[], ctx: RuntimeCommandContext): Promise<ExecResult>;
export declare function cmdEnum(args: string[], ctx: RuntimeCommandContext): Promise<ExecResult>;
