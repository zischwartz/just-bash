/**
 * expand - convert tabs to spaces
 *
 * Usage: expand [OPTION]... [FILE]...
 *
 * Convert TABs in each FILE to spaces, writing to standard output.
 * If no FILE is specified, standard input is read.
 */
import type { RuntimeCommand } from "../../types.js";
export declare const expand: RuntimeCommand;
import type { CommandFuzzInfo } from "../fuzz-flags-types.js";
export declare const flagsForFuzzing: CommandFuzzInfo;
