/**
 * Condition execution helper for the interpreter.
 *
 * Handles executing condition statements with proper inCondition state management.
 * Used by if, while, and until loops.
 */
import { ExecutionOutputAccumulator } from "../../execution-output.js";
/**
 * Execute condition statements with inCondition flag set.
 * This prevents errexit from triggering during condition evaluation.
 *
 * @param ctx - Interpreter context
 * @param statements - Condition statements to execute
 * @returns Accumulated stdout, stderr, and final exit code
 */
export async function executeCondition(ctx, statements) {
    const savedInCondition = ctx.state.inCondition;
    ctx.state.inCondition = true;
    const output = new ExecutionOutputAccumulator(ctx.executionScope, "condition");
    let exitCode = 0;
    try {
        for (const stmt of statements) {
            const result = await ctx.executeStatement(stmt);
            output.appendResult(result);
            exitCode = result.exitCode;
        }
    }
    catch (error) {
        output.prependTo(error);
        throw error;
    }
    finally {
        ctx.state.inCondition = savedInCondition;
    }
    return output.build(exitCode);
}
