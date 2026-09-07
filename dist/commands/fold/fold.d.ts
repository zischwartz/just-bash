/**
 * fold - wrap each input line to fit in specified width
 *
 * Usage: fold [OPTION]... [FILE]...
 *
 * Wrap input lines in each FILE, writing to standard output.
 * If no FILE is specified, standard input is read.
 */
import type { RuntimeCommand } from "../../types.js";
export declare const fold: RuntimeCommand;
import type { CommandFuzzInfo } from "../fuzz-flags-types.js";
export declare const flagsForFuzzing: CommandFuzzInfo;
