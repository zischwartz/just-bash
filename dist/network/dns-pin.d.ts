/**
 * Request-owned connection binding for DNS-reviewed HTTP requests.
 *
 * Each owner has a private Undici Agent whose connector resolves exactly one
 * hostname to exactly one preflight-reviewed address. The Agent is never
 * shared between requests or redirect hops, so an existing origin pool cannot
 * substitute a socket opened under a different DNS decision.
 *
 * The browser build removes the Node-only `undici` branch and edge runtimes
 * that cannot construct this owner fail closed when private-range denial is
 * enabled.
 */
export interface PinnedAddress {
    hostname: string;
    address: string;
    family: 4 | 6;
}
export interface PinnedConnectionOwner {
    fetch(url: string, init: RequestInit): Promise<Response>;
    close(): Promise<void>;
}
export type PinnedConnectionOwnerFactory = (pinned: PinnedAddress) => Promise<PinnedConnectionOwner>;
/**
 * Both shapes a dynamic `import("undici")` can resolve to.
 *
 * Node resolves the package and exposes its CommonJS exports as named ones. A
 * bundler that inlines the same module into its own graph cannot always do
 * that, and hands back a namespace carrying the module under `default` alone.
 */
type UndiciNamespace = typeof import("undici") | Pick<typeof import("undici"), "default">;
type UndiciExports = typeof import("undici") | typeof import("undici").default;
/** @internal Pure namespace normalization used by focused interop tests. */
export declare function _undiciExports(namespace: UndiciNamespace): UndiciExports;
type PinnedLookup = import("node:net").LookupFunction;
/** @internal Pure connector lookup used by focused binding tests. */
export declare function _createPinnedLookup(pinned: PinnedAddress): PinnedLookup;
/**
 * Create a disposable transport whose pool identity is the reviewed address.
 * The returned owner must be closed after the response body is consumed.
 */
export declare const createPinnedConnectionOwner: PinnedConnectionOwnerFactory;
export {};
