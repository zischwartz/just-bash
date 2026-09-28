/**
 * whoami - print effective user name
 *
 * Usage: whoami
 *
 * In sandboxed environment, always returns "user".
 */
import type { RuntimeCommand } from "../../types.js";
export declare const whoami: RuntimeCommand;
import type { CommandFuzzInfo } from "../fuzz-flags-types.js";
export declare const flagsForFuzzing: CommandFuzzInfo;
