/**
 * file - determine file type
 *
 * Uses the file-type npm package for magic byte detection.
 */
import type { RuntimeCommand } from "../../types.js";
export declare const fileCommand: RuntimeCommand;
import type { CommandFuzzInfo } from "../fuzz-flags-types.js";
export declare const flagsForFuzzing: CommandFuzzInfo;
