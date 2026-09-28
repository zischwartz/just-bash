/**
 * od - dump files in octal and other formats
 *
 * Usage: od [OPTION]... [FILE]...
 *
 * Write an unambiguous representation, octal bytes by default,
 * of FILE to standard output.
 */
import type { RuntimeCommand } from "../../types.js";
export declare const od: RuntimeCommand;
import type { CommandFuzzInfo } from "../fuzz-flags-types.js";
export declare const flagsForFuzzing: CommandFuzzInfo;
