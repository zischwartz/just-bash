/**
 * tar - manipulate tape archives
 *
 * Supports creating, extracting, and listing tar archives
 * with optional gzip, bzip2, and xz compression.
 */
import type { RuntimeCommand } from "../../types.js";
export declare const tarCommand: RuntimeCommand;
import type { CommandFuzzInfo } from "../fuzz-flags-types.js";
export declare const flagsForFuzzing: CommandFuzzInfo;
