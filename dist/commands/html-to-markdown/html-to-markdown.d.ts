/**
 * html-to-markdown - Convert HTML to Markdown using TurndownService
 *
 * This is a non-standard command that converts HTML from stdin to Markdown.
 */
import type { RuntimeCommand } from "../../types.js";
export declare const htmlToMarkdownCommand: RuntimeCommand;
import type { CommandFuzzInfo } from "../fuzz-flags-types.js";
export declare const flagsForFuzzing: CommandFuzzInfo;
