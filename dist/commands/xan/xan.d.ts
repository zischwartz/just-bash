/**
 * xan - CSV toolkit command
 *
 * Provides ergonomic CLI for CSV operations, translating commands to jq expressions
 * and using the shared query engine. Inspired by xsv and xan tools.
 */
import type { RuntimeCommand } from "../../types.js";
export declare const xanCommand: RuntimeCommand;
import type { CommandFuzzInfo } from "../fuzz-flags-types.js";
export declare const flagsForFuzzing: CommandFuzzInfo;
