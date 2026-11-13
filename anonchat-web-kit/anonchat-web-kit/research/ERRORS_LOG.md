# Errors Log
| Date | Symptom | Root cause | Fix | Verified by |
|---|---|---|---|---|
| 2026-11-13 | Rollup native `.node` binary blocked: `ERR_DLOPEN_FAILED` (Application Control policy) | Windows Application Control / AppLocker policy blocks native `.node` binaries in OneDrive paths | Installed `@rollup/wasm-node` and added `scripts/patchRollup.js` (+ `postinstall` hook) to fall back to WebAssembly build | `npm test` and `npm run build` passing with 0 errors |
| 2026-11-13 | Missing module `use-motion-value-event.mjs` in framer-motion | Partial package extraction from interrupted npm install | Re-installed `framer-motion@11.13.1` cleanly with `--force` | `npm run build` transformed 2409 modules successfully |
| 2026-11-13 | `error TS6305: vite.config.d.ts has not been built from source file` | `tsconfig.json` included `vite.config.ts` while `tsconfig.node.json` also included it | Kept `tsconfig.json` scoped to `src` and added `src/vite-env.d.ts` for Vite client types | `npm run typecheck` passing cleanly with 0 errors |
