import { cahyanaConfig } from './scripts/gates/cahyana-rules.mjs';

export default cahyanaConfig({
  files: ['**/*.{js,jsx,mjs,cjs}'],
  commonjsFiles: ['**/*.cjs', 'tailwind.config.js'],
});
