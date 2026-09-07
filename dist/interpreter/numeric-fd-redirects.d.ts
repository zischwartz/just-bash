import type { RedirectionNode } from "../ast/types.js";
/**
 * The descriptor a redirection acts on, or null when it targets both
 * stdout and stderr (`&>`), which never names a user fd.
 */
export declare function effectiveRedirectFd(redir: RedirectionNode): number | null;
/** True when this redirection is installed in the descriptor table. */
export declare function isNumericFdRedirection(redir: RedirectionNode): boolean;
