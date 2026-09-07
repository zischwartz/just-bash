---
"just-bash": patch
---

Block `URL.createObjectURL` during sandboxed script execution. On a runtime without `node:module.registerHooks` (e.g. Bun), the ESM loader hook that blocks dynamic `import("blob:...")` never installs. Since a `blob:` URL has to be minted via `URL.createObjectURL` before it can be imported, blocking that call closes the same escape vector from the other end, independent of loader-hook availability. This does not cover `data:` URL imports, which need no prior creation step.
