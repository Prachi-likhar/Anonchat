import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rollupNativePath = path.resolve(__dirname, '../node_modules/rollup/dist/native.js');

if (fs.existsSync(rollupNativePath)) {
  let content = fs.readFileSync(rollupNativePath, 'utf8');
  if (!content.includes('@rollup/wasm-node/dist/native.js')) {
    const target = 'const nativeModule = requireWithFriendlyError(';
    const replacement = `let nativeModule;
try {
\tnativeModule = requireWithFriendlyError(`;
    const endTarget = ');\n\nconst { parse, parseAsync, xxhashBase64Url, xxhashBase36, xxhashBase16 } = nativeModule;';
    const endReplacement = `);\n} catch (error) {\n\ttry {\n\t\tnativeModule = require('@rollup/wasm-node/dist/native.js');\n\t} catch {\n\t\tthrow error;\n\t}\n}\n\nconst { parse, parseAsync, xxhashBase64Url, xxhashBase36, xxhashBase16 } = nativeModule;`;

    if (content.includes(target) && content.includes(endTarget)) {
      content = content.replace(target, replacement).replace(endTarget, endReplacement);
      fs.writeFileSync(rollupNativePath, content, 'utf8');
      console.log('Successfully patched rollup for wasm fallback.');
    }
  }
}

