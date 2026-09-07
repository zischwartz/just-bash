/**
 * Moonblade expression tokenizer
 */
export type TokenType = "int" | "float" | "string" | "regex" | "ident" | "true" | "false" | "null" | "(" | ")" | "[" | "]" | "{" | "}" | "," | ":" | ";" | "=>" | "+" | "-" | "*" | "/" | "//" | "%" | "**" | "++" | "==" | "!=" | "<" | "<=" | ">" | ">=" | "eq" | "ne" | "lt" | "le" | "gt" | "ge" | "&&" | "||" | "and" | "or" | "!" | "." | "|" | "in" | "not in" | "as" | "=" | "_" | "eof";
export interface Token {
    type: TokenType;
    value: string;
    pos: number;
}
export interface TokenizerLimits {
    maxSourceLength?: number;
    maxTokens?: number;
}
export declare class Tokenizer {
    private input;
    private pos;
    private tokens;
    private readonly maxSourceLength;
    private readonly maxTokens;
    constructor(input: string, limits?: TokenizerLimits);
    tokenize(): Token[];
    private assertTokenCapacity;
    private skipWhitespace;
    private nextToken;
    private match;
    private isIdentStart;
    private isIdentChar;
    private readNumber;
    private readString;
    private readRegex;
    private readIdentifier;
}
