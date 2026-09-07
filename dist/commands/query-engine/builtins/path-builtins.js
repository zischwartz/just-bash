/**
 * Path-related jq builtins
 *
 * Handles path manipulation functions like getpath, setpath, delpaths, paths, etc.
 */
import { ExecutionLimitError } from "../../../interpreter/errors.js";
import { assertQueryResultCapacity, chargeQueryWork, } from "../evaluator.js";
import { asQueryRecord } from "../safe-object.js";
function validateBoundedPath(path, ctx) {
    if (!Array.isArray(path))
        throw new Error("path must be an array");
    const maxDepth = ctx.limits.maxDepth;
    if (path.length > maxDepth) {
        throw new ExecutionLimitError(`query depth limit exceeded (${maxDepth})`, "recursion");
    }
    const maxElements = ctx.limits.maxArrayElements;
    let prospectiveArrayElements = 0;
    for (const component of path) {
        if (typeof component === "number") {
            if (!Number.isSafeInteger(component) ||
                component < 0 ||
                component >= maxElements) {
                throw new ExecutionLimitError(`query array index limit exceeded (${maxElements})`, "array_elements");
            }
            const allocation = component + 1;
            if (prospectiveArrayElements > maxElements - allocation) {
                throw new ExecutionLimitError(`query cumulative array allocation limit exceeded (${maxElements})`, "array_elements");
            }
            prospectiveArrayElements += allocation;
        }
        else if (typeof component !== "string") {
            throw new Error("path components must be strings or integers");
        }
    }
    chargeQueryWork(ctx, prospectiveArrayElements + path.length);
    return path;
}
function collectContainerPaths(value, ctx, leavesOnly) {
    const paths = [];
    const stack = [{ value, path: [], isRoot: true }];
    while (stack.length > 0) {
        const entry = stack.pop();
        if (!entry)
            break;
        chargeQueryWork(ctx);
        if (entry.path.length > ctx.limits.maxDepth) {
            throw new ExecutionLimitError(`query depth limit exceeded (${ctx.limits.maxDepth})`, "recursion");
        }
        const isContainer = entry.value !== null && typeof entry.value === "object";
        if (!isContainer) {
            if (leavesOnly || !entry.isRoot) {
                assertQueryResultCapacity(ctx, paths.length);
                paths.push(entry.path);
            }
            continue;
        }
        if (!leavesOnly && !entry.isRoot) {
            assertQueryResultCapacity(ctx, paths.length);
            paths.push(entry.path);
        }
        const children = Array.isArray(entry.value)
            ? entry.value.map((child, index) => [index, child])
            : Object.keys(entry.value).map((key) => [
                key,
                // @banned-pattern-ignore: Object.keys returns own properties only
                entry.value[key],
            ]);
        assertQueryResultCapacity(ctx, paths.length, stack.length + children.length);
        for (let index = children.length - 1; index >= 0; index--) {
            const [key, child] = children[index];
            const childPath = [...entry.path, key];
            stack.push({ value: child, path: childPath, isRoot: false });
        }
    }
    return paths;
}
/**
 * Handle path builtins that need evaluate function for arguments.
 * Returns null if the builtin name is not a path builtin handled here.
 */
export function evalPathBuiltin(value, name, args, ctx, evaluate, isTruthy, setPath, deletePath, applyDel, collectPaths) {
    switch (name) {
        case "getpath": {
            if (args.length === 0)
                return [null];
            const paths = evaluate(value, args[0], ctx);
            // Handle multiple paths (generator argument)
            const results = [];
            for (const pathVal of paths) {
                const path = pathVal;
                let current = value;
                for (const key of path) {
                    if (current === null || current === undefined) {
                        current = null;
                        break;
                    }
                    if (Array.isArray(current) && typeof key === "number") {
                        current = current[key];
                    }
                    else if (typeof key === "string") {
                        // Defense against prototype pollution: only access own properties
                        const obj = asQueryRecord(current);
                        if (!obj || !Object.hasOwn(obj, key)) {
                            current = null;
                            break;
                        }
                        current = obj[key];
                    }
                    else {
                        current = null;
                        break;
                    }
                }
                results.push(current);
            }
            return results;
        }
        case "setpath": {
            if (args.length < 2)
                return [null];
            const paths = evaluate(value, args[0], ctx);
            const path = validateBoundedPath(paths[0], ctx);
            const vals = evaluate(value, args[1], ctx);
            const newVal = vals[0];
            return [setPath(value, path, newVal)];
        }
        case "delpaths": {
            if (args.length === 0)
                return [value];
            const pathLists = evaluate(value, args[0], ctx);
            const paths = pathLists[0];
            let result = value;
            for (const path of paths.sort((a, b) => b.length - a.length)) {
                result = deletePath(result, path);
            }
            return [result];
        }
        case "path": {
            if (args.length === 0)
                return [[]];
            const paths = [];
            collectPaths(value, args[0], ctx, [], paths);
            return paths;
        }
        case "del": {
            if (args.length === 0)
                return [value];
            return [applyDel(value, args[0], ctx)];
        }
        case "pick": {
            if (args.length === 0)
                return [null];
            // pick uses path() to get paths, then builds an object with just those paths
            // Collect paths from each argument
            const allPaths = [];
            for (const arg of args) {
                collectPaths(value, arg, ctx, [], allPaths);
            }
            // Build result object with only the picked paths
            let result = null;
            for (const path of allPaths) {
                // Preserve jq's established error for the `last` sentinel before the
                // generic configured-index ceiling classifies all negative numbers.
                for (const key of path) {
                    if (typeof key === "number" && key < 0) {
                        throw new Error("Out of bounds negative array index");
                    }
                }
                validateBoundedPath(path, ctx);
                // Get the value at this path from the input
                let current = value;
                for (const key of path) {
                    if (current === null || current === undefined)
                        break;
                    if (Array.isArray(current) && typeof key === "number") {
                        current = current[key];
                    }
                    else if (typeof key === "string") {
                        // Defense against prototype pollution: only access own properties
                        const obj = asQueryRecord(current);
                        if (!obj || !Object.hasOwn(obj, key)) {
                            current = null;
                            break;
                        }
                        current = obj[key];
                    }
                    else {
                        current = null;
                        break;
                    }
                }
                // Set the value in the result
                result = setPath(result, path, current);
            }
            return [result];
        }
        case "paths": {
            const paths = collectContainerPaths(value, ctx, false);
            if (args.length > 0) {
                return paths.filter((p) => {
                    let v = value;
                    for (const k of p) {
                        if (Array.isArray(v) && typeof k === "number") {
                            v = v[k];
                        }
                        else if (typeof k === "string") {
                            // Defense against prototype pollution: only access own properties
                            const obj = asQueryRecord(v);
                            if (!obj || !Object.hasOwn(obj, k)) {
                                return false;
                            }
                            v = obj[k];
                        }
                        else {
                            return false;
                        }
                    }
                    const results = evaluate(v, args[0], ctx);
                    return results.some(isTruthy);
                });
            }
            return paths;
        }
        case "leaf_paths": {
            const paths = collectContainerPaths(value, ctx, true);
            // Return each path as a separate output (like paths does)
            return paths;
        }
        default:
            return null;
    }
}
