/**
 * View commands: pretty print CSV as table or flattened records
 */
import type { ExecResult, RuntimeCommandContext } from "../../types.js";
/**
 * Flatten: display records vertically, one field per line
 * Usage: xan flatten [OPTIONS] [FILE]
 *   -l, --limit N    Maximum number of rows to display
 *   -s, --select COLS  Select columns to display
 */
export declare function cmdFlatten(args: string[], ctx: RuntimeCommandContext): Promise<ExecResult>;
export declare function cmdView(args: string[], ctx: RuntimeCommandContext): Promise<ExecResult>;
