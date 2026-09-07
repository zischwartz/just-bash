/**
 * Navigation and traversal jq builtins
 *
 * Handles recurse, recurse_down, walk, transpose, combinations, parent, parents, root.
 */
import { ExecutionLimitError } from "../../../interpreter/errors.js";
import { asQueryRecord, isSafeKey, safeSet } from "../safe-object.js";
function resourceLimits(ctx) {
    const maxIterations = ctx.limits.maxIterations;
    return {
        maxDepth: ctx.limits.maxDepth,
        maxResults: ctx.limits.maxArrayElements,
        maxIterations,
    };
}
function throwTraversalLimit(message) {
    throw new ExecutionLimitError(message, "array_elements");
}
function checkedProduct(values, limit) {
    let product = 1;
    for (const value of values) {
        if (!Number.isSafeInteger(value) || value < 0) {
            throw new Error("combinations requires finite array lengths");
        }
        if (value !== 0 && product > Math.floor(limit / value)) {
            throwTraversalLimit(`query combination limit exceeded (${limit})`);
        }
        product *= value;
    }
    return product;
}
/**
 * Handle navigation builtins that need evaluate function for arguments.
 * Returns null if the builtin name is not a navigation builtin handled here.
 */
export function evalNavigationBuiltin(value, name, args, ctx, evaluate, isTruthy, getValueAtPath, evalBuiltin) {
    switch (name) {
        case "recurse": {
            const results = [];
            const limits = resourceLimits(ctx);
            const condExpr = args.length >= 2 ? args[1] : null;
            const stack = [
                { value, depth: 0 },
            ];
            let iterations = 0;
            while (stack.length > 0) {
                const entry = stack.pop();
                if (!entry)
                    break;
                if (++iterations > limits.maxIterations) {
                    throw new ExecutionLimitError(`query iteration limit exceeded (${limits.maxIterations})`, "iterations");
                }
                if (entry.depth > limits.maxDepth) {
                    throw new ExecutionLimitError(`query depth limit exceeded (${limits.maxDepth})`, "recursion");
                }
                // Check condition if provided (recurse(f; cond))
                if (condExpr) {
                    const condResults = evaluate(entry.value, condExpr, ctx);
                    if (!condResults.some(isTruthy))
                        continue;
                }
                if (results.length >= limits.maxResults) {
                    throwTraversalLimit(`query result element limit exceeded (${limits.maxResults})`);
                }
                results.push(entry.value);
                let next = [];
                if (args.length === 0) {
                    if (Array.isArray(entry.value)) {
                        next = entry.value;
                    }
                    else if (entry.value && typeof entry.value === "object") {
                        next = Object.keys(entry.value).map((key) => {
                            // @banned-pattern-ignore: Object.keys returns own properties only
                            return entry.value[key];
                        });
                    }
                }
                else {
                    next = evaluate(entry.value, args[0], ctx).filter((item) => item !== null && item !== undefined);
                }
                if (stack.length > limits.maxResults - next.length) {
                    throwTraversalLimit(`query traversal queue limit exceeded (${limits.maxResults})`);
                }
                for (let i = next.length - 1; i >= 0; i--) {
                    stack.push({ value: next[i], depth: entry.depth + 1 });
                }
            }
            return results;
        }
        case "recurse_down":
            return evalBuiltin(value, "recurse", args, ctx);
        case "walk": {
            if (args.length === 0)
                return [value];
            const limits = resourceLimits(ctx);
            const scheduled = new WeakSet();
            const transformed = new WeakMap();
            const stack = [{ value, depth: 0, expanded: false }];
            let rootResult = value;
            let iterations = 0;
            while (stack.length > 0) {
                const frame = stack.pop();
                if (!frame)
                    break;
                if (++iterations > limits.maxIterations) {
                    throw new ExecutionLimitError(`query iteration limit exceeded (${limits.maxIterations})`, "iterations");
                }
                if (frame.depth > limits.maxDepth) {
                    throw new ExecutionLimitError(`query depth limit exceeded (${limits.maxDepth})`, "recursion");
                }
                const container = frame.value !== null && typeof frame.value === "object"
                    ? frame.value
                    : null;
                if (!frame.expanded && container) {
                    if (scheduled.has(container))
                        continue;
                    scheduled.add(container);
                    stack.push({ ...frame, expanded: true });
                    const record = asQueryRecord(frame.value);
                    const children = Array.isArray(frame.value)
                        ? frame.value
                        : Object.keys(record ?? {}).map((key) => {
                            return record?.[key];
                        });
                    if (stack.length > limits.maxResults - children.length) {
                        throwTraversalLimit(`query traversal queue limit exceeded (${limits.maxResults})`);
                    }
                    for (let i = children.length - 1; i >= 0; i--) {
                        stack.push({
                            value: children[i],
                            depth: frame.depth + 1,
                            expanded: false,
                        });
                    }
                    continue;
                }
                let childResult = frame.value;
                if (Array.isArray(frame.value)) {
                    childResult = frame.value.map((child) => child !== null && typeof child === "object"
                        ? (transformed.get(child) ?? child)
                        : child);
                }
                else if (container) {
                    const objectResult = Object.create(null);
                    const record = asQueryRecord(frame.value);
                    for (const key of Object.keys(record ?? {})) {
                        if (!isSafeKey(key))
                            continue;
                        const child = record?.[key];
                        safeSet(objectResult, key, child !== null && typeof child === "object"
                            ? (transformed.get(child) ?? child)
                            : child);
                    }
                    childResult = objectResult;
                }
                const evaluated = evaluate(childResult, args[0], ctx)[0];
                if (container)
                    transformed.set(container, evaluated);
                if (frame.depth === 0)
                    rootResult = evaluated;
            }
            return [rootResult];
        }
        case "transpose": {
            if (!Array.isArray(value))
                return [null];
            if (value.length === 0)
                return [[]];
            const limits = resourceLimits(ctx);
            let maxLen = 0;
            for (const row of value) {
                if (Array.isArray(row))
                    maxLen = Math.max(maxLen, row.length);
            }
            checkedProduct([value.length, maxLen], limits.maxResults);
            const result = [];
            for (let i = 0; i < maxLen; i++) {
                result.push(value.map((row) => (Array.isArray(row) ? row[i] : null)));
            }
            return [result];
        }
        case "combinations": {
            // Generate Cartesian product of arrays
            // combinations with no args: input is array of arrays, generate all combinations
            // combinations(n): generate n-length combinations from input array
            if (args.length > 0) {
                // combinations(n) - n-tuples from input array
                const ns = evaluate(value, args[0], ctx);
                const n = ns[0];
                if (!Array.isArray(value))
                    return [];
                if (!Number.isFinite(n) || !Number.isSafeInteger(n) || n < 0) {
                    throw new Error("combinations length must be a finite non-negative integer");
                }
                const limits = resourceLimits(ctx);
                if (n > limits.maxDepth || n > limits.maxResults) {
                    throw new ExecutionLimitError(`query depth limit exceeded (${limits.maxDepth})`, "recursion");
                }
                if (n === 0) {
                    if (limits.maxResults < 1) {
                        throwTraversalLimit("query combination limit exceeded (0)");
                    }
                    return [[]];
                }
                const resultCount = checkedProduct(Array.from({ length: n }, () => value.length), limits.maxResults);
                if (resultCount === 0)
                    return [];
                const results = [];
                const indexes = new Array(n).fill(0);
                for (let produced = 0; produced < resultCount; produced++) {
                    results.push(indexes.map((index) => value[index]));
                    for (let position = n - 1; position >= 0; position--) {
                        indexes[position]++;
                        if (indexes[position] < value.length)
                            break;
                        indexes[position] = 0;
                    }
                }
                return results;
            }
            // combinations with no args - Cartesian product of array of arrays
            if (!Array.isArray(value))
                return [];
            if (value.length === 0) {
                if (resourceLimits(ctx).maxResults < 1) {
                    throwTraversalLimit("query combination limit exceeded (0)");
                }
                return [[]];
            }
            // Check all elements are arrays
            for (const arr of value) {
                if (!Array.isArray(arr))
                    return [];
            }
            const limits = resourceLimits(ctx);
            const arrays = value;
            if (arrays.length > limits.maxDepth) {
                throw new ExecutionLimitError(`query depth limit exceeded (${limits.maxDepth})`, "recursion");
            }
            const resultCount = checkedProduct(arrays.map((array) => array.length), limits.maxResults);
            if (resultCount === 0)
                return [];
            const results = [];
            const indexes = new Array(arrays.length).fill(0);
            for (let produced = 0; produced < resultCount; produced++) {
                results.push(indexes.map((index, position) => arrays[position][index]));
                for (let position = arrays.length - 1; position >= 0; position--) {
                    indexes[position]++;
                    if (indexes[position] < arrays[position].length)
                        break;
                    indexes[position] = 0;
                }
            }
            return results;
        }
        // Navigation operators
        case "parent": {
            if (ctx.root === undefined || ctx.currentPath === undefined)
                return [];
            const path = ctx.currentPath;
            if (path.length === 0)
                return []; // At root, no parent
            // Get levels argument (default: 1)
            const levels = args.length > 0 ? evaluate(value, args[0], ctx)[0] : 1;
            if (levels >= 0) {
                // Positive: go up n levels
                if (levels > path.length)
                    return []; // Beyond root
                const parentPath = path.slice(0, path.length - levels);
                return [getValueAtPath(ctx.root, parentPath)];
            }
            else {
                // Negative: index from root (-1 = root, -2 = one below root, etc.)
                // -1 means path length 0 (root)
                // -2 means path length 1 (one level below root)
                const targetLen = -levels - 1;
                if (targetLen >= path.length)
                    return [value]; // Beyond current
                const parentPath = path.slice(0, targetLen);
                return [getValueAtPath(ctx.root, parentPath)];
            }
        }
        case "parents": {
            if (ctx.root === undefined || ctx.currentPath === undefined)
                return [[]];
            const path = ctx.currentPath;
            const parents = [];
            // Build array of parents from immediate parent to root
            for (let i = path.length - 1; i >= 0; i--) {
                parents.push(getValueAtPath(ctx.root, path.slice(0, i)));
            }
            return [parents];
        }
        case "root":
            return ctx.root !== undefined ? [ctx.root] : [];
        default:
            return null;
    }
}
