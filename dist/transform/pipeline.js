import { mergeToNullPrototype } from "../helpers/env.js";
import { DEFAULT_MAX_SOURCE_BYTES } from "../limits.js";
import { parse } from "../parser/parser.js";
import { assertSourceWithinLimit } from "../source-limit.js";
import { serialize } from "./serialize.js";
export class BashTransformPipeline {
    maxSourceBytes;
    // biome-ignore lint/suspicious/noExplicitAny: required for type-erased plugin storage
    plugins = [];
    constructor(maxSourceBytes = DEFAULT_MAX_SOURCE_BYTES) {
        this.maxSourceBytes = maxSourceBytes;
        if (!Number.isSafeInteger(maxSourceBytes) || maxSourceBytes < 0) {
            throw new Error("BashTransformPipeline: invalid maxSourceBytes");
        }
    }
    use(plugin) {
        this.plugins.push(plugin);
        // biome-ignore lint/suspicious/noExplicitAny: required for generic type accumulation cast
        return this;
    }
    transform(script) {
        assertSourceWithinLimit(script, this.maxSourceBytes);
        let ast = parse(script);
        let metadata = Object.create(null);
        for (const plugin of this.plugins) {
            const result = plugin.transform({ ast, metadata });
            ast = result.ast;
            if (result.metadata) {
                metadata = mergeToNullPrototype(metadata, result.metadata);
            }
        }
        return {
            script: serialize(ast),
            ast,
            metadata: metadata,
        };
    }
}
