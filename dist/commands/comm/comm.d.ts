/**
 * comm - compare two sorted files line by line
 *
 * Outputs three columns:
 * - Column 1: lines only in FILE1
 * - Column 2: lines only in FILE2
 * - Column 3: lines in both files
 */
import type { RuntimeCommand } from "../../types.js";
export declare const commCommand: RuntimeCommand;
import type { CommandFuzzInfo } from "../fuzz-flags-types.js";
export declare const flagsForFuzzing: CommandFuzzInfo;
