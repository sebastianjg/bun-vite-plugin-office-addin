const result = await Bun.build({
  entrypoints: ['./src/index.ts'],
  outdir: './dist',
  minify: true,
  target: 'node',
  external: ['vite', 'rollup'],
});

if (!result.success) {
  // biome-ignore lint/suspicious/noConsole: Build script needs console output
  console.error('Build failed');
  for (const message of result.logs) {
    // biome-ignore lint/suspicious/noConsole: Build script needs console output
    console.error(message);
  }
  process.exit(1);
}
