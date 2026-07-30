import { defineConfig } from 'tsdown';

export default defineConfig({
    entry: ['src/index.ts'],
    globalName: 'SpinWheel',
    format: ['esm', 'cjs', 'iife'],
    dts: true,
    clean: true,
    deps: {
        onlyBundle: false,
    },
});
