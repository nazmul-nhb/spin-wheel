import { defineConfig } from 'tsdown';

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    exports: true,
    dts: true,
    clean: true,
    deps: {
        onlyBundle: false,
    },
});
