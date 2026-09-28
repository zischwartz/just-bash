import type { RegexLike } from "../../regex/index.js";
import type { InterpreterContext } from "../types.js";
/** Build a regex replacement prospectively without an unbounded host replace. */
export declare function applyPatternReplacementBounded(ctx: InterpreterContext, value: string, regex: RegexLike, replacement: string, replaceAll: boolean): string;
