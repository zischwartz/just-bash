/**
 * Safe Object Utilities
 *
 * Defense-in-depth against JavaScript prototype pollution attacks.
 * These utilities prevent malicious JSON from accessing or modifying
 * the JavaScript prototype chain via keys like "__proto__", "constructor", etc.
 */
import { ExecutionLimitError } from "../../interpreter/errors.js";
/**
 * Keys that could be used to access or pollute the prototype chain.
 * These should never be used as direct object property names when
 * setting values from untrusted input.
 */
const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);
/**
 * Extended list of potentially dangerous keys for extra paranoia.
 * These include Node.js-specific and DOM-specific properties.
 */
const EXTENDED_DANGEROUS_KEYS = new Set([
    ...DANGEROUS_KEYS,
    // Additional properties that could cause issues in specific contexts
    "__defineGetter__",
    "__defineSetter__",
    "__lookupGetter__",
    "__lookupSetter__",
    "hasOwnProperty",
    "isPrototypeOf",
    "propertyIsEnumerable",
    "toLocaleString",
    "toString",
    "valueOf",
]);
/**
 * Assert that a value is a plain object (not an array) with a null prototype.
 * Catches bugs where unsanitized or wrong-type values leak into safe helpers.
 */
function assertSafeObject(obj, caller) {
    if (Array.isArray(obj)) {
        throw new TypeError(`${caller}: expected object, got array`);
    }
    if (Object.getPrototypeOf(obj) !== null) {
        throw new TypeError(`${caller}: expected null-prototype object, got prototypal object`);
    }
}
/**
 * Check if a key is safe to use for object property access/assignment.
 * Returns true if the key is safe, false if it could cause prototype pollution.
 */
export function isSafeKey(key) {
    return !DANGEROUS_KEYS.has(key);
}
/**
 * Check if a key is safe using the extended dangerous keys list.
 * More paranoid version that blocks additional Object.prototype methods.
 */
export function isSafeKeyStrict(key) {
    return !EXTENDED_DANGEROUS_KEYS.has(key);
}
/**
 * Safely get a property from an object using hasOwnProperty check.
 * Returns undefined if the key is dangerous or doesn't exist as own property.
 */
export function safeGet(obj, key) {
    assertSafeObject(obj, "safeGet");
    if (!isSafeKey(key)) {
        return undefined;
    }
    if (Object.hasOwn(obj, key)) {
        return obj[key];
    }
    return undefined;
}
/**
 * Safely set a property on an object.
 * Silently ignores dangerous keys to prevent prototype pollution.
 */
export function safeSet(obj, key, value) {
    assertSafeObject(obj, "safeSet");
    if (isSafeKey(key)) {
        obj[key] = value;
    }
    // Dangerous keys are silently ignored - this matches jq behavior
    // where __proto__ is treated as a regular key that happens to not work
}
/**
 * Safely delete a property from an object.
 * Ignores dangerous keys.
 */
export function safeDelete(obj, key) {
    assertSafeObject(obj, "safeDelete");
    if (isSafeKey(key)) {
        delete obj[key];
    }
}
/**
 * Create a safe object from entries, filtering out dangerous keys.
 */
export function safeFromEntries(entries) {
    // Use null-prototype for additional safety
    const result = Object.create(null);
    for (const [key, value] of entries) {
        safeSet(result, key, value);
    }
    return result;
}
/**
 * Safely spread/assign properties from source to target.
 * Only copies own properties and filters dangerous keys.
 */
export function safeAssign(target, source) {
    assertSafeObject(target, "safeAssign target");
    assertSafeObject(source, "safeAssign source");
    for (const key of Object.keys(source)) {
        safeSet(target, key, source[key]);
    }
    return target;
}
/**
 * Create a shallow copy of an object, filtering dangerous keys.
 */
export function safeCopy(obj) {
    const result = Object.create(null);
    for (const key of Object.keys(obj)) {
        if (isSafeKey(key)) {
            // @banned-pattern-ignore: iterating via Object.keys() which only returns own properties
            result[key] = obj[key];
        }
    }
    return result;
}
/**
 * Check if object has own property safely (not inherited from prototype).
 */
export function safeHasOwn(obj, key) {
    assertSafeObject(obj, "safeHasOwn");
    return Object.hasOwn(obj, key);
}
export function sanitizeParsedData(value, limits = {}) {
    const maxDepth = limits.maxDepth ?? 2000;
    const maxElements = limits.maxElements ?? 1_000_000;
    const seen = new WeakMap();
    const elementBudget = limits.elementBudget ?? { used: 0 };
    if (!Number.isSafeInteger(elementBudget.used) ||
        elementBudget.used < 0 ||
        elementBudget.used > maxElements) {
        throw new ExecutionLimitError(`query input element limit exceeded (${maxElements})`, "array_elements");
    }
    const assertElement = () => {
        if (++elementBudget.used > maxElements) {
            throw new ExecutionLimitError(`query input element limit exceeded (${maxElements})`, "array_elements");
        }
    };
    const createValue = (current, depth, pending) => {
        if (current === null || typeof current !== "object")
            return current;
        if (current instanceof Date)
            return current;
        const cached = seen.get(current);
        if (cached !== undefined)
            return cached;
        if (depth > maxDepth) {
            throw new ExecutionLimitError(`query depth limit exceeded (${maxDepth})`, "recursion");
        }
        const target = Array.isArray(current)
            ? []
            : Object.create(null);
        seen.set(current, target);
        pending.push({ source: current, target, depth });
        return target;
    };
    const pending = [];
    const root = createValue(value, 0, pending);
    while (pending.length > 0) {
        const entry = pending.pop();
        if (!entry)
            break;
        const { source, target, depth } = entry;
        if (Array.isArray(source) && Array.isArray(target)) {
            if (source.length > maxElements - elementBudget.used) {
                throw new ExecutionLimitError(`query input element limit exceeded (${maxElements})`, "array_elements");
            }
            target.length = source.length;
            for (let index = source.length - 1; index >= 0; index--) {
                assertElement();
                target[index] = createValue(source[index], depth + 1, pending);
            }
            continue;
        }
        const sourceRecord = source;
        const targetRecord = target;
        const keys = Object.keys(sourceRecord);
        if (keys.length > maxElements - elementBudget.used) {
            throw new ExecutionLimitError(`query input element limit exceeded (${maxElements})`, "array_elements");
        }
        // Assign in source order so JSON/object insertion order is preserved. The
        // child frames may be processed LIFO without changing key order.
        for (let index = 0; index < keys.length; index++) {
            assertElement();
            const key = keys[index];
            targetRecord[key] = createValue(sourceRecord[key], depth + 1, pending);
        }
    }
    return root;
}
/**
 * Type-safe cast from unknown to Record for property access.
 * Returns null if the value is not a non-array object.
 */
export function asQueryRecord(value) {
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
        return value;
    }
    return null;
}
/**
 * Create a null-prototype object from a static lookup table literal.
 * Use this to define Record/dictionary constants that are safe from
 * prototype pollution (e.g., `__proto__` lookups return `undefined`).
 *
 * ```ts
 * const COLORS = nullPrototype({ red: "#f00", blue: "#00f" });
 * COLORS["__proto__"]  // undefined (no prototype chain)
 * ```
 */
export function nullPrototype(obj) {
    return Object.assign(Object.create(null), obj);
}
/**
 * Create a null-prototype shallow copy of an object.
 * This prevents prototype chain lookups without filtering any keys.
 */
export function nullPrototypeCopy(obj) {
    return Object.assign(Object.create(null), obj);
}
/**
 * Merge multiple objects into a new null-prototype object.
 * This prevents prototype chain lookups without filtering any keys.
 */
export function nullPrototypeMerge(...objs) {
    return Object.assign(Object.create(null), ...objs);
}
