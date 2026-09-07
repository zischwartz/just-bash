/**
 * strings - print the sequences of printable characters in files
 *
 * Usage: strings [OPTION]... [FILE]...
 *
 * For each FILE, print the printable character sequences that are at least
 * MIN characters long. If no FILE is specified, standard input is read.
 */
import type { RuntimeCommand } from "../../types.js";
export declare const strings: RuntimeCommand;
import type { CommandFuzzInfo } from "../fuzz-flags-types.js";
export declare const flagsForFuzzing: CommandFuzzInfo;
