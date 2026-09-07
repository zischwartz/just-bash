---
"just-bash": patch
---

Fix `defenseInDepth` failing to activate under Bun with `DefenseInDepthBox: critical patches failed: Module._resolveFilename`. Bun's `node:module` shim exposes `Module._resolveFilename` as an accessor property (`get`/`set`) rather than a plain data property like Node does; patching it built a new descriptor by spreading the original one and adding `value`, and a descriptor can't mix accessor and data keys — `Object.defineProperty` throws under Bun's JavaScriptCore engine (V8 is more permissive here). The patch now always writes a clean data descriptor instead of spreading the original.
