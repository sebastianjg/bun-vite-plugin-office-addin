import type { Plugin, ResolvedConfig } from 'vite';
import { loadEnv } from 'vite';

interface Options {
  /**
   * Path to the manifest file.
   * @default "manifest.xml"
   */
  path?: string;
  /**
   * Development URL to be replaced in the manifest.
   */
  devUrl?: string;
  /**
   * Production URL to replace the development URL in the manifest.
   */
  prodUrl?: string;
}

// Runtime detection
const isBun = typeof Bun !== 'undefined';

// Path separator regex for cross-platform support
const PATH_SEPARATOR_REGEX = /[\\/]/;

// Path operations abstraction
async function resolvePath(...paths: string[]): Promise<string> {
  if (isBun && Bun.resolveSync) {
    // Use Bun's path resolution
    return Bun.resolveSync(paths.join('/'), process.cwd());
  }
  // Node.js fallback
  const { resolve } = await import('node:path');
  return resolve(...paths);
}

function getBasename(path: string): string {
  // Simple implementation that works in both environments
  const parts = path.split(PATH_SEPARATOR_REGEX);
  return parts.at(-1) || '';
}

// File operations abstraction
async function fileExists(path: string): Promise<boolean> {
  if (isBun) {
    return Bun.file(path).exists();
  }
  // Node.js fallback
  try {
    const { access } = await import('node:fs/promises');
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function readFileText(path: string): Promise<string> {
  if (isBun) {
    return await Bun.file(path).text();
  }
  // Node.js fallback
  const { readFile } = await import('node:fs/promises');
  return await readFile(path, 'utf-8');
}
export default function officeManifest(options?: Options): Plugin {
  const manifestFile = options?.path ?? 'manifest.xml';

  let viteConfig: ResolvedConfig;
  let env: Record<string, string>;

  return {
    name: 'office-addin-bun:manifest',

    configResolved(resolvedConfig: ResolvedConfig) {
      viteConfig = resolvedConfig;
      env = loadEnv(viteConfig.mode, process.cwd(), 'ADDIN');
    },

    async generateBundle() {
      const manifestPath = await resolvePath(viteConfig.root, manifestFile);

      if (!(await fileExists(manifestPath))) {
        viteConfig.logger.error(
          `The manifest.xml file does not exist at path: '${manifestPath}'`
        );
        return;
      }

      const devUrl = options?.devUrl || env.ADDIN_DEV_URL;
      const prodUrl = options?.prodUrl || env.ADDIN_PROD_URL;

      let content = await readFileText(manifestPath);
      if (devUrl && devUrl !== '' && prodUrl) {
        // Use simple string replacement - no need for regex escaping
        content = content.replaceAll(devUrl, prodUrl);
      }

      this.emitFile({
        type: 'asset',
        fileName: getBasename(manifestPath),
        source: content,
      });
    },
  };
}
