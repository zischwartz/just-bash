/**
 * Core search logic for rg command
 */
import type { ExecResult, RuntimeCommandContext } from "../../types.js";
import type { RgOptions } from "./rg-options.js";
export interface SearchContext {
    ctx: RuntimeCommandContext;
    options: RgOptions;
    paths: string[];
    explicitLineNumbers: boolean;
}
/**
 * Execute the search with parsed options
 */
export declare function executeSearch(searchCtx: SearchContext): Promise<ExecResult>;
