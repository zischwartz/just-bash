import type { SecurityViolationType } from "./types.js";
export declare function assertExcludableViolationTypes(violationTypes: readonly SecurityViolationType[] | undefined): void;
export declare function formatViolationErrorMessage(message: string, violationType: SecurityViolationType, canExclude: boolean): string;
