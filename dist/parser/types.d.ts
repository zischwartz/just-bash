/**
 * Parser Types and Constants
 *
 * Shared types, interfaces, and constants used across parser modules.
 */
import { type Token, TokenType } from "./lexer.js";
export declare const MAX_INPUT_SIZE = 1000000;
export declare const MAX_TOKENS = 100000;
export declare const MAX_PARSER_DEPTH = 200;
export declare enum WordParseContext {
    Default = 0,
    Assignment = 1,
    NoBraceExpansion = 2,
    Regex = 4
}
export declare const REDIRECTION_TOKENS: Set<TokenType>;
export declare const REDIRECTION_AFTER_NUMBER: Set<TokenType>;
export declare const REDIRECTION_AFTER_FD_VARIABLE: Set<TokenType>;
export interface ParseError {
    message: string;
    line: number;
    column: number;
    token?: Token;
}
export declare class ParseException extends Error {
    line: number;
    column: number;
    token: Token | undefined;
    constructor(message: string, line: number, column: number, token?: Token | undefined);
}
/** Mutable limits shared by every parser created for one top-level source. */
export declare class ParseBudget {
    private iterations;
    private tokens;
    private depth;
    reset(): void;
    chargeIteration(line: number, column: number): void;
    chargeTokens(count: number, line?: number, column?: number): void;
    enter(line: number, column: number): () => void;
}
