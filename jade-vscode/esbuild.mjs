import * as esbuild from 'esbuild';

const watch = process.argv.includes('--watch');

const base = {
  bundle: true,
  platform: 'node',
  target: 'node20',
  sourcemap: false,
  minify: false,
};

const extensionConfig = {
  ...base,
  entryPoints: ['src/extension.ts'],
  outfile: 'dist/extension.js',
  external: ['vscode'],
  format: 'cjs',
};

const serverConfig = {
  ...base,
  entryPoints: ['src/server/server.ts'],
  outfile: 'dist/server.js',
  format: 'cjs',
};

if (watch) {
  const [extCtx, srvCtx] = await Promise.all([
    esbuild.context(extensionConfig),
    esbuild.context(serverConfig),
  ]);
  await Promise.all([extCtx.watch(), srvCtx.watch()]);
  console.log('Watching for changes...');
} else {
  await Promise.all([
    esbuild.build(extensionConfig),
    esbuild.build(serverConfig),
  ]);
  console.log('Build complete: dist/extension.js + dist/server.js');
}
