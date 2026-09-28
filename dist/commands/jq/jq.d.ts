/**
 * jq - RuntimeCommand-line JSON processor
 *
 * Full jq implementation with proper parser and evaluator.
 */
import type { RuntimeCommand } from "../../types.js";
export declare const jqCommand: RuntimeCommand;
import type { CommandFuzzInfo } from "../fuzz-flags-types.js";
export declare const flagsForFuzzing: CommandFuzzInfo;
