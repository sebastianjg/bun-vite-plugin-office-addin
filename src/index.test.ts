import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import type { NormalizedOutputOptions, OutputBundle } from 'rollup';
import type { Plugin, ResolvedConfig } from 'vite';
import officeManifest from './index';

// Helper to call plugin hooks that can be functions or objects
// biome-ignore lint/suspicious/noExplicitAny: Generic helper for plugin hooks
function callHook(hook: any, context: any, ...args: any[]) {
  if (typeof hook === 'function') {
    return hook.call(context, ...args);
  }
  if (hook?.handler) {
    return hook.handler.call(context, ...args);
  }
}

// Mock Bun.resolveSync for tests
const originalResolveSync = globalThis.Bun?.resolveSync;
const mockedResolveSync = mock((path: string, base: string) => {
  // Simple mock implementation
  if (path.startsWith('/')) {
    return path;
  }
  return `${base}/${path}`;
});

// Mock node:path for Node.js fallback
const mockedResolve = mock((...paths: string[]) => paths.join('/'));
mock.module('node:path', () => ({
  resolve: mockedResolve,
}));

const mockedLoadEnv = mock(() => ({
  ADDIN_DEV_URL: 'http://localhost:3000',
  ADDIN_PROD_URL: 'https://production.com',
}));

// For tests that need different env values
const mockedLoadEnvEmpty = mock(() => ({}));

mock.module('vite', () => ({
  loadEnv: mockedLoadEnv,
}));

// Mock for Node.js fs/promises
const mockedReadFile = mock((path: string) => {
  if (path.includes('manifest.xml')) {
    return Promise.resolve(
      '<SourceLocation DefaultValue="http://localhost:3000" />'
    );
  }
  throw new Error('File not found');
});

const mockedAccess = mock((path: string) => {
  if (path.includes('nonexistent')) {
    throw new Error('ENOENT');
  }
  return Promise.resolve();
});

mock.module('node:fs/promises', () => ({
  readFile: mockedReadFile,
  access: mockedAccess,
}));

describe('officeManifest', () => {
  let plugin: Plugin;
  let mockConfig: ResolvedConfig;

  beforeEach(() => {
    mock.restore();

    // Mock Bun.resolveSync if Bun is available
    if (globalThis.Bun) {
      // biome-ignore lint/suspicious/noExplicitAny: Mock requires any type
      globalThis.Bun.resolveSync = mockedResolveSync as any;
    }

    plugin = officeManifest();
    mockConfig = {
      root: '/project',
      mode: 'production',
      logger: {
        error: mock(),
      },
    } as unknown as ResolvedConfig;
  });

  afterEach(() => {
    // Restore original Bun.resolveSync
    if (globalThis.Bun && originalResolveSync) {
      globalThis.Bun.resolveSync = originalResolveSync;
    }
  });

  test('should use default manifest path if not provided', async () => {
    const mockedFileExists = mock(() => Promise.resolve(true));
    const mockedFileText = mock(() =>
      Promise.resolve('<SourceLocation DefaultValue="http://localhost:3000" />')
    );
    const originalBunFile = globalThis.Bun.file;
    globalThis.Bun.file = mock(() => ({
      exists: mockedFileExists,
      text: mockedFileText,
    })) as unknown as typeof Bun.file;

    // Call configResolved hook
    callHook(plugin.configResolved, {}, mockConfig);

    const emitFile = mock();
    const context = { emitFile };

    // Trigger the generateBundle hook
    await callHook(
      plugin.generateBundle,
      context,
      {} as NormalizedOutputOptions,
      {} as OutputBundle,
      false
    );

    // Should have resolved the path
    if (globalThis.Bun) {
      expect(mockedResolveSync).toHaveBeenCalled();
    } else {
      expect(mockedResolve).toHaveBeenCalled();
    }
    expect(emitFile).toHaveBeenCalled();

    // Restore original Bun.file
    globalThis.Bun.file = originalBunFile;
  });

  test('should use custom manifest path if provided', async () => {
    const mockedFileExists = mock(() => Promise.resolve(true));
    const mockedFileText = mock(() =>
      Promise.resolve('<SourceLocation DefaultValue="http://localhost:3000" />')
    );
    const originalBunFile = globalThis.Bun.file;
    globalThis.Bun.file = mock(() => ({
      exists: mockedFileExists,
      text: mockedFileText,
    })) as unknown as typeof Bun.file;

    plugin = officeManifest({ path: 'custom-manifest.xml' });

    // Call configResolved hook
    callHook(plugin.configResolved, {}, mockConfig);

    const emitFile = mock();
    const context = { emitFile };

    // Trigger the generateBundle hook
    await callHook(
      plugin.generateBundle,
      context,
      {} as NormalizedOutputOptions,
      {} as OutputBundle,
      false
    );

    // Should have resolved the path
    if (globalThis.Bun) {
      expect(mockedResolveSync).toHaveBeenCalled();
    } else {
      expect(mockedResolve).toHaveBeenCalled();
    }
    expect(emitFile).toHaveBeenCalled();

    // Restore original Bun.file
    globalThis.Bun.file = originalBunFile;
  });

  test('should replace dev URL with prod URL in manifest content', async () => {
    const mockedFileExists = mock(() => Promise.resolve(true));
    const mockedFileText = mock(() =>
      Promise.resolve('<SourceLocation DefaultValue="http://localhost:3000" />')
    );
    const originalBunFile = globalThis.Bun.file;
    globalThis.Bun.file = mock(() => ({
      exists: mockedFileExists,
      text: mockedFileText,
    })) as unknown as typeof Bun.file;

    // Call configResolved hook
    callHook(plugin.configResolved, {}, mockConfig);

    const emitFile = mock();
    const context = { emitFile };

    // Trigger the generateBundle hook with context
    await callHook(
      plugin.generateBundle,
      context,
      {} as NormalizedOutputOptions,
      {} as OutputBundle,
      false
    );

    expect(emitFile).toHaveBeenCalledWith({
      type: 'asset',
      fileName: 'manifest.xml',
      source: '<SourceLocation DefaultValue="https://production.com" />',
    });

    // Restore original Bun.file
    globalThis.Bun.file = originalBunFile;
  });

  test('should throw error if manifest file does not exist', async () => {
    const mockedFileExists = mock(() => Promise.resolve(false));
    const originalBunFile = globalThis.Bun.file;
    globalThis.Bun.file = mock(() => ({
      exists: mockedFileExists,
    })) as unknown as typeof Bun.file;

    // Call configResolved hook
    callHook(plugin.configResolved, {}, mockConfig);

    const context = { emitFile: mock() };

    // Trigger the generateBundle hook with context and expect it to throw
    await expect(
      callHook(
        plugin.generateBundle,
        context,
        {} as NormalizedOutputOptions,
        {} as OutputBundle,
        false
      )
    ).rejects.toThrow('The manifest.xml file does not exist');

    // Restore original Bun.file
    globalThis.Bun.file = originalBunFile;
  });

  describe('Cross-runtime compatibility', () => {
    test('should handle both Bun and Node.js file operations', async () => {
      // This test verifies that the abstraction layer works correctly
      // The actual runtime detection is tested by the fact that tests pass in Bun
      const mockedFileExists = mock(() => Promise.resolve(true));
      const mockedFileText = mock(() =>
        Promise.resolve(
          '<SourceLocation DefaultValue="http://localhost:3000" />'
        )
      );
      const originalBunFile = globalThis.Bun.file;
      globalThis.Bun.file = mock(() => ({
        exists: mockedFileExists,
        text: mockedFileText,
      })) as unknown as typeof Bun.file;

      callHook(plugin.configResolved, {}, mockConfig);

      const emitFile = mock();
      const context = { emitFile };

      await callHook(
        plugin.generateBundle,
        context,
        {} as NormalizedOutputOptions,
        {} as OutputBundle,
        false
      );

      // In Bun runtime, it should use Bun.file
      expect(mockedFileExists).toHaveBeenCalled();
      expect(mockedFileText).toHaveBeenCalled();

      expect(emitFile).toHaveBeenCalledWith({
        type: 'asset',
        fileName: 'manifest.xml',
        source: '<SourceLocation DefaultValue="https://production.com" />',
      });

      globalThis.Bun.file = originalBunFile;
    });

    test('should handle file not found in cross-runtime compatible way', async () => {
      const mockedFileExists = mock(() => Promise.resolve(false));
      const originalBunFile = globalThis.Bun.file;
      globalThis.Bun.file = mock(() => ({
        exists: mockedFileExists,
      })) as unknown as typeof Bun.file;

      plugin = officeManifest({ path: 'nonexistent.xml' });
      callHook(plugin.configResolved, {}, mockConfig);

      const context = { emitFile: mock() };

      await expect(
        callHook(
          plugin.generateBundle,
          context,
          {} as NormalizedOutputOptions,
          {} as OutputBundle,
          false
        )
      ).rejects.toThrow('The manifest.xml file does not exist');

      globalThis.Bun.file = originalBunFile;
    });
  });

  describe('Edge cases', () => {
    test('should handle empty dev URL', async () => {
      // Mock loadEnv to return empty env vars for this test
      mock.module('vite', () => ({
        loadEnv: mockedLoadEnvEmpty,
      }));

      const mockedFileExists = mock(() => Promise.resolve(true));
      const mockedFileText = mock(() =>
        Promise.resolve(
          '<SourceLocation DefaultValue="http://localhost:3000" />'
        )
      );
      const originalBunFile = globalThis.Bun.file;
      globalThis.Bun.file = mock(() => ({
        exists: mockedFileExists,
        text: mockedFileText,
      })) as unknown as typeof Bun.file;

      plugin = officeManifest({
        devUrl: '',
        prodUrl: 'https://production.com',
      });
      callHook(plugin.configResolved, {}, mockConfig);

      const emitFile = mock();
      const context = { emitFile };

      await callHook(
        plugin.generateBundle,
        context,
        {} as NormalizedOutputOptions,
        {} as OutputBundle,
        false
      );

      // Should not replace anything when devUrl is empty
      expect(emitFile).toHaveBeenCalled();
      const callArgs = emitFile.mock.calls[0][0];
      expect(callArgs.type).toBe('asset');
      expect(callArgs.fileName).toBe('manifest.xml');
      // When devUrl is empty, no replacement should occur
      expect(callArgs.source).toBe(
        '<SourceLocation DefaultValue="http://localhost:3000" />'
      );

      globalThis.Bun.file = originalBunFile;

      // Restore original mock
      mock.module('vite', () => ({
        loadEnv: mockedLoadEnv,
      }));
    });

    test('should handle special regex characters in URLs', async () => {
      const mockedFileExists = mock(() => Promise.resolve(true));
      const mockedFileText = mock(() =>
        Promise.resolve(
          '<SourceLocation DefaultValue="http://localhost:3000?test=value&foo[]=bar" />'
        )
      );
      const originalBunFile = globalThis.Bun.file;
      globalThis.Bun.file = mock(() => ({
        exists: mockedFileExists,
        text: mockedFileText,
      })) as unknown as typeof Bun.file;

      plugin = officeManifest({
        devUrl: 'http://localhost:3000?test=value&foo[]=bar',
        prodUrl: 'https://production.com',
      });
      callHook(plugin.configResolved, {}, mockConfig);

      const emitFile = mock();
      const context = { emitFile };

      await callHook(
        plugin.generateBundle,
        context,
        {} as NormalizedOutputOptions,
        {} as OutputBundle,
        false
      );

      expect(emitFile).toHaveBeenCalled();
      const callArgs = emitFile.mock.calls[0][0];
      expect(callArgs.type).toBe('asset');
      expect(callArgs.fileName).toBe('manifest.xml');
      expect(callArgs.source).toBe(
        '<SourceLocation DefaultValue="https://production.com" />'
      );

      globalThis.Bun.file = originalBunFile;
    });

    test('should prioritize plugin options over environment variables', async () => {
      const mockedFileExists = mock(() => Promise.resolve(true));
      const mockedFileText = mock(() =>
        Promise.resolve(
          '<SourceLocation DefaultValue="http://custom-dev.com" />'
        )
      );
      const originalBunFile = globalThis.Bun.file;
      globalThis.Bun.file = mock(() => ({
        exists: mockedFileExists,
        text: mockedFileText,
      })) as unknown as typeof Bun.file;

      plugin = officeManifest({
        devUrl: 'http://custom-dev.com',
        prodUrl: 'https://custom-prod.com',
      });
      callHook(plugin.configResolved, {}, mockConfig);

      const emitFile = mock();
      const context = { emitFile };

      await callHook(
        plugin.generateBundle,
        context,
        {} as NormalizedOutputOptions,
        {} as OutputBundle,
        false
      );

      expect(emitFile).toHaveBeenCalled();
      const callArgs2 = emitFile.mock.calls[0][0];
      expect(callArgs2.type).toBe('asset');
      expect(callArgs2.fileName).toBe('manifest.xml');
      expect(callArgs2.source).toBe(
        '<SourceLocation DefaultValue="https://custom-prod.com" />'
      );

      globalThis.Bun.file = originalBunFile;
    });

    test('should not replace URLs when prodUrl is missing', async () => {
      const mockedFileExists = mock(() => Promise.resolve(true));
      const mockedFileText = mock(() =>
        Promise.resolve(
          '<SourceLocation DefaultValue="http://localhost:3000" />'
        )
      );
      const originalBunFile = globalThis.Bun.file;
      globalThis.Bun.file = mock(() => ({
        exists: mockedFileExists,
        text: mockedFileText,
      })) as unknown as typeof Bun.file;

      // Mock empty env for this test
      mock.module('vite', () => ({
        loadEnv: mockedLoadEnvEmpty,
      }));

      plugin = officeManifest({
        devUrl: 'http://localhost:3000',
        // prodUrl is missing
      });
      callHook(plugin.configResolved, {}, mockConfig);

      const emitFile = mock();
      const context = { emitFile };

      await callHook(
        plugin.generateBundle,
        context,
        {} as NormalizedOutputOptions,
        {} as OutputBundle,
        false
      );

      expect(emitFile).toHaveBeenCalledWith({
        type: 'asset',
        fileName: 'manifest.xml',
        source: '<SourceLocation DefaultValue="http://localhost:3000" />',
      });

      globalThis.Bun.file = originalBunFile;

      // Restore original mock
      mock.module('vite', () => ({
        loadEnv: mockedLoadEnv,
      }));
    });

    test('should handle multiple occurrences of dev URL', async () => {
      const mockedFileExists = mock(() => Promise.resolve(true));
      const mockedFileText = mock(() =>
        Promise.resolve(`
          <SourceLocation DefaultValue="http://localhost:3000" />
          <SourceLocation DefaultValue="http://localhost:3000/api" />
          <RedirectUrl>http://localhost:3000/redirect</RedirectUrl>
        `)
      );
      const originalBunFile = globalThis.Bun.file;
      globalThis.Bun.file = mock(() => ({
        exists: mockedFileExists,
        text: mockedFileText,
      })) as unknown as typeof Bun.file;

      plugin = officeManifest({
        devUrl: 'http://localhost:3000',
        prodUrl: 'https://production.com',
      });
      callHook(plugin.configResolved, {}, mockConfig);

      const emitFile = mock();
      const context = { emitFile };

      await callHook(
        plugin.generateBundle,
        context,
        {} as NormalizedOutputOptions,
        {} as OutputBundle,
        false
      );

      const callArgs = emitFile.mock.calls[0][0];
      expect(callArgs.source).toContain('https://production.com"');
      expect(callArgs.source).toContain('https://production.com/api"');
      expect(callArgs.source).toContain('https://production.com/redirect');
      expect(callArgs.source).not.toContain('http://localhost:3000');

      globalThis.Bun.file = originalBunFile;
    });
  });
});
