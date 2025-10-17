import { defineConfig } from 'tsup';

export default defineConfig({
	entry: ['src/**/*.ts'],
	format: ['esm', 'cjs'],
	outDir: 'dist',
	splitting: false,
	clean: true,
	outExtension({ format }) {return {js: format === 'esm' ? '.mjs' : '.cjs',};},
	esbuildOptions(options, context) { options.outdir = `dist/${context.format}`; },
});
