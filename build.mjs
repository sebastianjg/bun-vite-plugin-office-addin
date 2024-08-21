import dts from 'bun-plugin-dts';

const result = await Bun.build({
  entrypoints: ['./src/index.ts'],
  outdir: './dist',
  minify: true,
  target: 'bun',
  // plugins: [dts()], // This currently doesn't work. Cannot be used in the build script to generate dts files.
});

if (!result.success) {
  console.error('Build failed');
  for (const message of result.logs) {
    console.error(message);
  }
} else {
  console.info('Build succeeded');
}
