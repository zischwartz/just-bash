/**
 * hostname - show or set the system's host name
 *
 * Usage: hostname [NAME]
 *
 * In sandboxed environment, always returns "localhost".
 */
import type { RuntimeCommand } from "../../types.js";
export declare const hostname: RuntimeCommand;
import type { CommandFuzzInfo } from "../fuzz-flags-types.js";
export declare const flagsForFuzzing: CommandFuzzInfo;
