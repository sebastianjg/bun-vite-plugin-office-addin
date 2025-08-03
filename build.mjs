if (typeof Bun !== 'undefined') {
  // Use Bun's build system when available
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

  // Generate TypeScript declarations
  const { execSync } = await import('node:child_process');
  try {
    execSync('tsc --project tsconfig.types.json', { stdio: 'inherit' });
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: Build script needs console output
    console.error('TypeScript declaration generation failed:', error.message);
    process.exit(1);
  }
} else {
  // Fallback to esbuild for Node.js
  const { build } = await import('esbuild');
  const { execSync } = await import('node:child_process');

  try {
    await build({
      entryPoints: ['./src/index.ts'],
      outdir: './dist',
      minify: true,
      platform: 'node',
      external: ['vite', 'rollup'],
      format: 'esm',
    });

    // Generate TypeScript declarations
    execSync('tsc --project tsconfig.types.json', { stdio: 'inherit' });
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: Build script needs console output
    console.error('Build failed:', error.message);
    process.exit(1);
  }
}
