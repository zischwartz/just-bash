/**
 * Secure fetch adapter.
 *
 * just-bash retains path allow-listing, firewall headers, response conversion,
 * and redirect policy; guarded-fetch handles SSRF and transport safety.
 */
import { type FetchResult, type NetworkConfig } from "./types.js";
export interface SecureFetchOptions {
    method?: string;
    headers?: Headers | Record<string, string>;
    body?: string;
    followRedirects?: boolean;
    /** Override timeout for this request (capped at global timeout) */
    timeoutMs?: number;
    /** Override redirects for this request (capped at the host policy). */
    maxRedirects?: number;
    /** Abort DNS review, redirects, transport, and response-body consumption. */
    signal?: AbortSignal;
}
/**
 * Type for the secure fetch function
 */
export type SecureFetch = (url: string, options?: SecureFetchOptions) => Promise<FetchResult>;
/**
 * Creates a secure fetch function that enforces the allow-list.
 */
export declare function createSecureFetch(config: NetworkConfig): SecureFetch;
