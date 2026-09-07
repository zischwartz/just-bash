export interface CombinedAbortSignal {
    signal: AbortSignal | undefined;
    cleanup(): void;
}
/**
 * Compose abort signals without relying on AbortSignal.any(), which is not
 * available in every supported runtime. The first abort reason wins and all
 * listeners are removable by the caller's finally block.
 */
export declare function combineAbortSignals(...signals: Array<AbortSignal | undefined>): CombinedAbortSignal;
