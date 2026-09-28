/**
 * gzip - compress or expand files
 *
 * Also provides gunzip (decompress) and zcat (decompress to stdout) commands.
 */
import type { RuntimeCommand } from "../../types.js";
export declare const gzipCommand: RuntimeCommand;
export declare const gunzipCommand: RuntimeCommand;
export declare const zcatCommand: RuntimeCommand;
import type { CommandFuzzInfo } from "../fuzz-flags-types.js";
export declare const flagsForFuzzing: CommandFuzzInfo;
export declare const gunzipFlagsForFuzzing: CommandFuzzInfo;
export declare const zcatFlagsForFuzzing: CommandFuzzInfo;
