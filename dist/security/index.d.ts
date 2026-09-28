/**
 * Security Module - Defense-in-Depth Box
 *
 * This module provides a secondary defense layer that monkey-patches
 * dangerous JavaScript globals during bash script execution.
 *
 * IMPORTANT: This is a SECONDARY defense layer. It should never be relied upon
 * as the primary security mechanism. The primary security comes from proper
 * sandboxing, input validation, and architectural constraints.
 *
 * Usage:
 * ```typescript
 * import { Bash } from 'just-bash';
 *
 * // Capability-detect defense-in-depth (the Bash default)
 * const bash = new Bash({
 *   defenseInDepth: { enabled: "auto" },
 * });
 *
 * // Or with custom configuration
 * const bash = new Bash({
 *   defenseInDepth: {
 *     enabled: true,
 *     auditMode: false,
 *     onViolation: (v) => console.warn('Violation:', v),
 *   },
 * });
 * ```
 */
export { DefenseInDepthBox, SecurityViolationError, } from "./defense-in-depth-box.js";
export { createConsoleViolationCallback, SecurityViolationLogger, type SecurityViolationLoggerOptions, type ViolationSummary, } from "./security-violation-logger.js";
export type { DefenseInDepthConfig, DefenseInDepthHandle, DefenseInDepthStats, DefenseInDepthStatus, SecurityViolation, SecurityViolationType, } from "./types.js";
export { WorkerDefenseInDepth, type WorkerDefenseStats, } from "./worker-defense-in-depth.js";
