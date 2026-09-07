export declare const _setTimeout: typeof globalThis.setTimeout;
export declare const _clearTimeout: typeof globalThis.clearTimeout;
export interface FiniteTimeoutHandle {
    cleared: boolean;
    remainingMs: number;
    timer: ReturnType<typeof globalThis.setTimeout> | undefined;
}
/**
 * Schedule a configured deadline without overflowing the host timer. Positive
 * Infinity means no deadline; longer finite delays are advanced in native-safe
 * chunks so they retain their actual duration.
 */
export declare function _setTimeoutIfFinite(callback: Parameters<typeof globalThis.setTimeout>[0], delay: number): FiniteTimeoutHandle | undefined;
export declare function _clearFiniteTimeout(handle: FiniteTimeoutHandle | undefined): void;
export declare const _setInterval: typeof globalThis.setInterval;
export declare const _clearInterval: typeof globalThis.clearInterval;
