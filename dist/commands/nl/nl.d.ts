/**
 * nl - number lines of files
 *
 * Usage: nl [OPTION]... [FILE]...
 *
 * Write each FILE to standard output, with line numbers added.
 * If no FILE is specified, standard input is read.
 */
import type { RuntimeCommand } from "../../types.js";
export declare const nl: RuntimeCommand;
import type { CommandFuzzInfo } from "../fuzz-flags-types.js";
export declare const flagsForFuzzing: CommandFuzzInfo;
