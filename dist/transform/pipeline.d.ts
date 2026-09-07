import type { BashTransformResult, TransformPlugin } from "./types.js";
export declare class BashTransformPipeline<TMetadata extends object = Record<string, never>> {
    private readonly maxSourceBytes;
    private plugins;
    constructor(maxSourceBytes?: number);
    use<M extends object>(plugin: TransformPlugin<M>): BashTransformPipeline<TMetadata & M>;
    transform(script: string): BashTransformResult<TMetadata>;
}
