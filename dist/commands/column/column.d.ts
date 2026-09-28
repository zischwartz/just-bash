/**
 * column - columnate lists
 *
 * Usage: column [OPTION]... [FILE]...
 *
 * Columnate input. Fill rows first by default, or create a table with -t.
 */
import type { RuntimeCommand } from "../../types.js";
export declare const column: RuntimeCommand;
import type { CommandFuzzInfo } from "../fuzz-flags-types.js";
export declare const flagsForFuzzing: CommandFuzzInfo;
