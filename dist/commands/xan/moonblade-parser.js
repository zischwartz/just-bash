/**
 * Moonblade expression parser for xan
 *
 * Parses moonblade expressions (xan's expression language) and transforms
 * them to jq AST for evaluation by the shared query engine.
 *
 * Grammar based on xan's grammar.pest
 */
import { ExecutionLimitError } from "../../interpreter/errors.js";
import { Tokenizer, } from "./moonblade-tokenizer.js";
export function getMoonbladeLimits(ctx) {
    return {
        maxSourceLength: ctx.limits.maxStringLength,
        maxTokens: ctx.limits.maxQueryTokens,
        maxAstNodes: ctx.limits.maxQueryElements,
        maxOperations: ctx.limits.maxJqIterations,
        maxDepth: ctx.limits.maxQueryDepth,
    };
}
// Operator precedence (higher = tighter binding)
const PREC = {
    PIPE: 1,
    OR: 2,
    AND: 3,
    EQUALITY: 4,
    COMPARISON: 5,
    ADDITIVE: 6,
    MULTIPLICATIVE: 7,
    POWER: 8,
    UNARY: 9,
    POSTFIX: 10,
};
class Parser {
    pos = 0;
    tokens;
    depth = 0;
    operations = 0;
    astNodes = 0;
    limits;
    constructor(tokens, limits = {}) {
        this.tokens = tokens;
        this.limits = {
            maxSourceLength: limits.maxSourceLength ?? 1024 * 1024,
            maxTokens: limits.maxTokens ?? 100_000,
            maxDepth: limits.maxDepth ?? 100,
            maxOperations: limits.maxOperations ?? 100_000,
            maxAstNodes: limits.maxAstNodes ?? 100_000,
        };
        let delimiterDepth = 0;
        for (const token of tokens) {
            this.useOperation();
            if (token.type === "(" || token.type === "[" || token.type === "{") {
                delimiterDepth++;
                if (delimiterDepth > this.limits.maxDepth)
                    this.throwDepthLimit();
            }
            else if (token.type === ")" ||
                token.type === "]" ||
                token.type === "}") {
                delimiterDepth = Math.max(0, delimiterDepth - 1);
            }
        }
    }
    parse() {
        const expr = this.parseExpr(0);
        if (this.peek().type !== "eof") {
            throw new Error(`Unexpected token: ${this.peek().value}`);
        }
        return expr;
    }
    parseExpr(minPrec) {
        return this.withDepth(() => this.parseExprInner(minPrec));
    }
    parseExprInner(minPrec) {
        let left = this.parsePrefix();
        while (true) {
            const token = this.peek();
            const prec = this.getInfixPrec(token.type);
            if (prec < minPrec)
                break;
            left = this.parseInfix(left, prec);
        }
        return left;
    }
    useOperation(count = 1) {
        if (count > this.limits.maxOperations - this.operations) {
            throw new ExecutionLimitError(`xan: expression parser operation limit exceeded (${this.limits.maxOperations})`, "iterations");
        }
        this.operations += count;
    }
    withDepth(operation) {
        if (this.depth >= this.limits.maxDepth)
            this.throwDepthLimit();
        this.depth++;
        try {
            return operation();
        }
        finally {
            this.depth--;
        }
    }
    throwDepthLimit() {
        throw new ExecutionLimitError(`xan: expression parser depth limit exceeded (${this.limits.maxDepth})`, "recursion");
    }
    addAstNode() {
        if (this.astNodes >= this.limits.maxAstNodes) {
            throw new ExecutionLimitError(`xan: expression AST node limit exceeded (${this.limits.maxAstNodes})`, "array_elements");
        }
        this.astNodes++;
    }
    parsePrefix() {
        const token = this.peek();
        switch (token.type) {
            case "int":
                this.advance();
                return { type: "int", value: Number.parseInt(token.value, 10) };
            case "float":
                this.advance();
                return { type: "float", value: Number.parseFloat(token.value) };
            case "string":
                this.advance();
                return { type: "string", value: token.value };
            case "regex": {
                this.advance();
                const parts = token.value.split("/");
                const flags = parts.length > 1 ? parts[parts.length - 1] : "";
                const pattern = parts.slice(0, -1).join("/") || token.value;
                return { type: "regex", pattern, caseInsensitive: flags.includes("i") };
            }
            case "true":
                this.advance();
                return { type: "bool", value: true };
            case "false":
                this.advance();
                return { type: "bool", value: false };
            case "null":
                this.advance();
                return { type: "null" };
            case "_":
                this.advance();
                return { type: "underscore" };
            case "ident": {
                const name = token.value;
                const unsure = name.endsWith("?");
                const cleanName = unsure ? name.slice(0, -1) : name;
                this.advance();
                // Check if it's a function call
                if (this.peek().type === "(") {
                    return this.parseFunctionCall(cleanName);
                }
                // Check if it's a lambda
                if (this.peek().type === "=>") {
                    this.advance(); // skip =>
                    const body = this.parseExpr(0);
                    return this.bindLambdaArgs({ type: "lambda", params: [cleanName], body }, [cleanName]);
                }
                return { type: "identifier", name: cleanName, unsure };
            }
            case "(": {
                this.advance();
                // Could be grouping or lambda params. Save pos so we can
                // cleanly backtrack if the lambda guess is wrong — the prior
                // implementation used `pos -= params.length * 2` which
                // mis-counted comma tokens and infinite-recursed on `(ident)`.
                const startPos = this.pos;
                if (this.peek().type === ")") {
                    // Empty parens - either an empty-arg lambda or invalid.
                    this.advance();
                    if (this.peek().type === "=>") {
                        this.advance();
                        const body = this.parseExpr(0);
                        return { type: "lambda", params: [], body };
                    }
                    throw new Error("Empty parentheses not allowed");
                }
                // Speculatively try `(ident, ident, ...) =>`. If it doesn't
                // hold, restore pos and parse as a grouped expression instead.
                if (this.peek().type === "ident") {
                    const params = [this.peek().value];
                    this.advance();
                    let looksLikeParamList = true;
                    while (this.peek().type === ",") {
                        this.advance();
                        if (this.peek().type === "ident") {
                            params.push(this.peek().value);
                            this.advance();
                        }
                        else {
                            looksLikeParamList = false;
                            break;
                        }
                    }
                    if (looksLikeParamList &&
                        this.peek().type === ")" &&
                        this.peekAt(1).type === "=>") {
                        this.advance(); // ')'
                        this.advance(); // '=>'
                        const body = this.parseExpr(0);
                        return this.bindLambdaArgs({ type: "lambda", params, body }, params);
                    }
                    // Not a lambda. Restore and fall through to grouped-expression parse.
                    this.pos = startPos;
                }
                // Parse as grouped expression.
                const expr = this.parseExpr(0);
                this.expect(")");
                return expr;
            }
            case "[":
                return this.parseList();
            case "{":
                return this.parseMap();
            case "-": {
                this.advance();
                const operand = this.parseExpr(PREC.UNARY);
                // Simplify negative literals
                if (operand.type === "int") {
                    return { type: "int", value: -operand.value };
                }
                if (operand.type === "float") {
                    return { type: "float", value: -operand.value };
                }
                return { type: "func", name: "neg", args: [{ expr: operand }] };
            }
            case "!": {
                this.advance();
                const operand = this.parseExpr(PREC.UNARY);
                return { type: "func", name: "not", args: [{ expr: operand }] };
            }
            default:
                throw new Error(`Unexpected token: ${token.type} (${token.value})`);
        }
    }
    parseFunctionCall(name) {
        this.expect("(");
        const args = [];
        if (this.peek().type !== ")") {
            do {
                if (args.length > 0 && this.peek().type === ",") {
                    this.advance();
                }
                // Check for named argument: ident=expr
                let argName;
                if (this.peek().type === "ident") {
                    const ident = this.peek().value;
                    const nextPos = this.pos + 1;
                    if (nextPos < this.tokens.length &&
                        this.tokens[nextPos].type === "=") {
                        argName = ident;
                        this.advance(); // skip ident
                        this.advance(); // skip =
                    }
                }
                const expr = this.parseExpr(0);
                args.push({ name: argName, expr });
            } while (this.peek().type === ",");
        }
        this.expect(")");
        return { type: "func", name: name.toLowerCase(), args };
    }
    parseList() {
        this.expect("[");
        const elements = [];
        if (this.peek().type !== "]") {
            do {
                if (elements.length > 0 && this.peek().type === ",") {
                    this.advance();
                }
                elements.push(this.parseExpr(0));
            } while (this.peek().type === ",");
        }
        this.expect("]");
        return { type: "list", elements };
    }
    parseMap() {
        this.expect("{");
        const entries = [];
        if (this.peek().type !== "}") {
            do {
                if (entries.length > 0 && this.peek().type === ",") {
                    this.advance();
                }
                // Key can be ident or string
                let key;
                if (this.peek().type === "ident") {
                    key = this.peek().value;
                    this.advance();
                }
                else if (this.peek().type === "string") {
                    key = this.peek().value;
                    this.advance();
                }
                else {
                    throw new Error(`Expected map key, got ${this.peek().type}`);
                }
                this.expect(":");
                const value = this.parseExpr(0);
                entries.push({ key, value });
            } while (this.peek().type === ",");
        }
        this.expect("}");
        return { type: "map", entries };
    }
    parseInfix(left, prec) {
        const token = this.peek();
        // Binary operators that map to functions
        const binaryOps = new Map([
            ["+", "add"],
            ["-", "sub"],
            ["*", "mul"],
            ["/", "div"],
            ["//", "idiv"],
            ["%", "mod"],
            ["**", "pow"],
            ["++", "concat"],
            ["==", "=="],
            ["!=", "!="],
            ["<", "<"],
            ["<=", "<="],
            [">", ">"],
            [">=", ">="],
            ["eq", "eq"],
            ["ne", "ne"],
            ["lt", "lt"],
            ["le", "le"],
            ["gt", "gt"],
            ["ge", "ge"],
            ["&&", "and"],
            ["and", "and"],
            ["||", "or"],
            ["or", "or"],
        ]);
        const opName = binaryOps.get(token.type);
        if (opName !== undefined) {
            this.advance();
            const right = this.parseExpr(prec + (this.isRightAssoc(token.type) ? 0 : 1));
            return {
                type: "func",
                name: opName,
                args: [{ expr: left }, { expr: right }],
            };
        }
        // Pipe operator
        if (token.type === "|") {
            this.advance();
            const right = this.parseExpr(prec);
            return this.handlePipe(left, right);
        }
        // Dot operator (access/method call)
        if (token.type === ".") {
            this.advance();
            return this.handleDot(left);
        }
        // Indexing
        if (token.type === "[") {
            this.advance();
            return this.handleIndexing(left);
        }
        // In operator
        if (token.type === "in") {
            this.advance();
            const right = this.parseExpr(prec + 1);
            return {
                type: "func",
                name: "contains",
                args: [{ expr: right }, { expr: left }],
            };
        }
        // Not in operator
        if (token.type === "not in") {
            this.advance();
            const right = this.parseExpr(prec + 1);
            return {
                type: "func",
                name: "not",
                args: [
                    {
                        expr: {
                            type: "func",
                            name: "contains",
                            args: [{ expr: right }, { expr: left }],
                        },
                    },
                ],
            };
        }
        throw new Error(`Unexpected infix token: ${token.type}`);
    }
    handlePipe(left, right) {
        // If right is an identifier that's a known function, call it with left as arg
        if (right.type === "identifier") {
            // We'd need to check if it's a known function
            // For now, treat as function call
            return { type: "func", name: right.name, args: [{ expr: left }] };
        }
        // If right is a function call, check for underscore
        if (right.type === "func") {
            const underscoreCount = this.countUnderscores(right);
            if (underscoreCount === 0) {
                // Just return the right side (pipe trimming)
                return right;
            }
            if (underscoreCount === 1) {
                // Fill the underscore with left
                return this.fillUnderscore(right, left);
            }
            // Multiple underscores - create pipeline
            return { type: "pipeline", exprs: [left, right] };
        }
        // If right has underscore, fill it
        if (this.countUnderscores(right) === 1) {
            return this.fillUnderscore(right, left);
        }
        return right;
    }
    handleDot(left) {
        const token = this.peek();
        // .identifier -> get(left, "identifier")
        if (token.type === "ident") {
            const name = token.value;
            this.advance();
            // Check if it's a method call: .func()
            if (this.peek().type === "(") {
                const call = this.parseFunctionCall(name);
                if (call.type === "func") {
                    // Insert left as first argument
                    call.args.unshift({ expr: left });
                }
                return call;
            }
            return {
                type: "func",
                name: "get",
                args: [{ expr: left }, { expr: { type: "string", value: name } }],
            };
        }
        // .123 -> get(left, 123)
        if (token.type === "int") {
            const idx = Number.parseInt(token.value, 10);
            this.advance();
            return {
                type: "func",
                name: "get",
                args: [{ expr: left }, { expr: { type: "int", value: idx } }],
            };
        }
        // ."string" -> get(left, "string")
        if (token.type === "string") {
            const key = token.value;
            this.advance();
            return {
                type: "func",
                name: "get",
                args: [{ expr: left }, { expr: { type: "string", value: key } }],
            };
        }
        throw new Error(`Expected identifier, number, or string after dot, got ${token.type}`);
    }
    handleIndexing(left) {
        // Check for slice
        if (this.peek().type === ":") {
            this.advance();
            if (this.peek().type === "]") {
                // [:] - full slice (not common)
                this.advance();
                return { type: "func", name: "slice", args: [{ expr: left }] };
            }
            // [:end]
            const end = this.parseExpr(0);
            this.expect("]");
            return {
                type: "func",
                name: "slice",
                args: [
                    { expr: left },
                    { expr: { type: "int", value: 0 } },
                    { expr: end },
                ],
            };
        }
        const start = this.parseExpr(0);
        if (this.peek().type === ":") {
            this.advance();
            if (this.peek().type === "]") {
                // [start:]
                this.advance();
                return {
                    type: "func",
                    name: "slice",
                    args: [{ expr: left }, { expr: start }],
                };
            }
            // [start:end]
            const end = this.parseExpr(0);
            this.expect("]");
            return {
                type: "func",
                name: "slice",
                args: [{ expr: left }, { expr: start }, { expr: end }],
            };
        }
        // [index]
        this.expect("]");
        return {
            type: "func",
            name: "get",
            args: [{ expr: left }, { expr: start }],
        };
    }
    countUnderscores(expr) {
        const pending = [expr];
        let count = 0;
        while (pending.length > 0) {
            this.useOperation();
            const current = pending.pop();
            if (!current)
                break;
            if (current.type === "underscore") {
                count++;
            }
            else if (current.type === "func") {
                for (const arg of current.args)
                    pending.push(arg.expr);
            }
            else if (current.type === "list") {
                pending.push(...current.elements);
            }
            else if (current.type === "map") {
                for (const entry of current.entries)
                    pending.push(entry.value);
            }
            if (pending.length > this.limits.maxAstNodes) {
                throw new ExecutionLimitError(`xan: expression AST node limit exceeded (${this.limits.maxAstNodes})`, "array_elements");
            }
        }
        return count;
    }
    fillUnderscore(expr, fill) {
        return this.withDepth(() => this.fillUnderscoreInner(expr, fill));
    }
    fillUnderscoreInner(expr, fill) {
        this.useOperation();
        if (expr.type === "underscore")
            return fill;
        if (expr.type === "func") {
            return {
                ...expr,
                args: expr.args.map((arg) => ({
                    ...arg,
                    expr: this.fillUnderscore(arg.expr, fill),
                })),
            };
        }
        if (expr.type === "list") {
            return {
                ...expr,
                elements: expr.elements.map((el) => this.fillUnderscore(el, fill)),
            };
        }
        if (expr.type === "map") {
            return {
                ...expr,
                entries: expr.entries.map((e) => ({
                    ...e,
                    value: this.fillUnderscore(e.value, fill),
                })),
            };
        }
        return expr;
    }
    bindLambdaArgs(expr, names) {
        return {
            ...expr,
            body: this.bindLambdaArgsInExpr(expr.body, names),
        };
    }
    bindLambdaArgsInExpr(expr, names) {
        return this.withDepth(() => this.bindLambdaArgsInExprInner(expr, names));
    }
    bindLambdaArgsInExprInner(expr, names) {
        this.useOperation();
        if (expr.type === "identifier" && names.includes(expr.name)) {
            return { type: "lambdaBinding", name: expr.name };
        }
        if (expr.type === "func") {
            return {
                ...expr,
                args: expr.args.map((arg) => ({
                    ...arg,
                    expr: this.bindLambdaArgsInExpr(arg.expr, names),
                })),
            };
        }
        if (expr.type === "list") {
            return {
                ...expr,
                elements: expr.elements.map((el) => this.bindLambdaArgsInExpr(el, names)),
            };
        }
        if (expr.type === "map") {
            return {
                ...expr,
                entries: expr.entries.map((e) => ({
                    ...e,
                    value: this.bindLambdaArgsInExpr(e.value, names),
                })),
            };
        }
        return expr;
    }
    getInfixPrec(type) {
        switch (type) {
            case "|":
                return PREC.PIPE;
            case "||":
            case "or":
                return PREC.OR;
            case "&&":
            case "and":
                return PREC.AND;
            case "==":
            case "!=":
            case "eq":
            case "ne":
                return PREC.EQUALITY;
            case "<":
            case "<=":
            case ">":
            case ">=":
            case "lt":
            case "le":
            case "gt":
            case "ge":
            case "in":
            case "not in":
                return PREC.COMPARISON;
            case "+":
            case "-":
            case "++":
                return PREC.ADDITIVE;
            case "*":
            case "/":
            case "//":
            case "%":
                return PREC.MULTIPLICATIVE;
            case "**":
                return PREC.POWER;
            case ".":
            case "[":
                return PREC.POSTFIX;
            default:
                // Non-infix tokens (like eof, comma, etc.) return -1 to stop parsing
                return -1;
        }
    }
    isRightAssoc(type) {
        return type === "**";
    }
    peek() {
        return this.tokens[this.pos] || { type: "eof", value: "", pos: 0 };
    }
    peekAt(offset) {
        return this.tokens[this.pos + offset] || { type: "eof", value: "", pos: 0 };
    }
    advance() {
        this.useOperation();
        this.addAstNode();
        return this.tokens[this.pos++];
    }
    expect(type) {
        const token = this.peek();
        if (token.type !== type) {
            throw new Error(`Expected ${type}, got ${token.type}`);
        }
        return this.advance();
    }
}
/**
 * Parse named expressions like: "expr1, expr2 as name, expr3 as (a, b)"
 */
export function parseNamedExpressions(input, limits = {}) {
    const results = [];
    const tokenizer = new Tokenizer(input, {
        maxSourceLength: limits.maxSourceLength,
        maxTokens: limits.maxTokens,
    });
    const tokens = tokenizer.tokenize();
    let pos = 0;
    const peek = () => tokens[pos] || { type: "eof", value: "", pos: 0 };
    const advance = () => tokens[pos++];
    while (peek().type !== "eof") {
        // Skip leading comma
        if (peek().type === "," && results.length > 0) {
            advance();
            continue;
        }
        // Parse expression
        const exprTokens = [];
        let depth = 0;
        const startPos = pos;
        while (peek().type !== "eof") {
            const token = peek();
            if ((token.type === "," || token.type === "as") && depth === 0) {
                break;
            }
            if (token.type === "(" || token.type === "[" || token.type === "{")
                depth++;
            if (token.type === ")" || token.type === "]" || token.type === "}")
                depth--;
            exprTokens.push(advance());
        }
        exprTokens.push({ type: "eof", value: "", pos: 0 });
        const parser = new Parser(exprTokens, limits);
        const expr = parser.parse();
        // Check for "as"
        let name;
        if (peek().type === "as") {
            advance(); // skip "as"
            // Check for tuple name
            if (peek().type === "(") {
                advance();
                const names = [];
                while (peek().type !== ")" && peek().type !== "eof") {
                    if (peek().type === "ident" || peek().type === "string") {
                        names.push(peek().value);
                        advance();
                    }
                    if (peek().type === ",") {
                        advance();
                    }
                    else if (peek().type !== ")" && peek().type !== "eof") {
                        throw new Error(`Expected tuple alias, got ${peek().type}`);
                    }
                }
                if (peek().type !== ")") {
                    throw new Error("Expected ')' after tuple alias");
                }
                advance();
                name = names;
            }
            else if (peek().type === "ident" || peek().type === "string") {
                name = peek().value;
                advance();
            }
            else {
                throw new Error(`Expected name after 'as', got ${peek().type}`);
            }
        }
        else {
            // Use expression text as name
            name = input
                .slice(tokens[startPos].pos, tokens[pos - 1]?.pos || input.length)
                .trim();
            // If it's just an identifier, use that
            if (expr.type === "identifier") {
                name = expr.name;
            }
        }
        results.push({ expr, name });
    }
    return results;
}
/**
 * Parse a moonblade expression string into AST
 */
export function parseMoonblade(input, limits = {}) {
    const tokenizer = new Tokenizer(input, {
        maxSourceLength: limits.maxSourceLength,
        maxTokens: limits.maxTokens,
    });
    const tokens = tokenizer.tokenize();
    const parser = new Parser(tokens, limits);
    return parser.parse();
}
