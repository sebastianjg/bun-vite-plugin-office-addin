# vite-plugin-office-addin-bun

> Office Add-ins development using Vite with Bun and Node.js support.

Build your Office Add-in with blazing-fast performance. This plugin automatically copies and transforms **manifest.xml** files to your build output with intelligent runtime detection for optimal performance.

> **Note**: This project is based on and extends [vite-plugin-office-addin](https://github.com/jozefizso/vite-plugin-office-addin) by [Jozef Izso](https://github.com/jozefizso), adding dual runtime support for both Bun and Node.js environments.

## ✨ Features

- 🚀 **Dual Runtime Support** - Works seamlessly with both Bun and Node.js
- ⚡ **Bun-First Optimization** - Uses native Bun APIs when available for maximum performance
- 🔄 **Automatic Runtime Detection** - Intelligently switches between Bun and Node.js file operations
- 🌍 **Cross-Platform** - Works on Windows, macOS, and Linux
- 🎯 **URL Replacement** - Automatically replaces development URLs with production URLs
- 📁 **Flexible Manifest Paths** - Support for custom manifest file locations
- 🔧 **Environment Variables** - Configure URLs through environment variables
- 📝 **TypeScript Support** - Full TypeScript definitions included

## 📋 Requirements

- **Bun** (latest) or **Node.js** ≥18.0.0
- **Vite** ≥7.0.6

## 🚀 Getting Started

Install the **vite-plugin-office-addin-bun** to your Office Add-in project.

### With Bun (Recommended)

```sh
bun install --save-dev vite-plugin-office-addin-bun
```

### With npm/yarn/pnpm

```sh
npm install --save-dev vite-plugin-office-addin-bun
# or
yarn add --dev vite-plugin-office-addin-bun
# or
pnpm add --save-dev vite-plugin-office-addin-bun
```

### Configure Vite

Use the plugin in your `vite.config.js` file:

```js
// vite.config.js
import { defineConfig } from 'vite'
import officeAddin from 'vite-plugin-office-addin-bun'

export default defineConfig({
  plugins: [officeAddin()]
})
```

## ⚡ Runtime Compatibility

This plugin automatically detects your runtime environment and optimizes accordingly:

### 🔥 **Bun Runtime** (Recommended)

When running with Bun, the plugin uses:

- `Bun.resolveSync()` for ultra-fast path resolution
- `Bun.file()` for native file operations
- Zero Node.js dependencies for maximum performance

### 🟢 **Node.js Runtime**

When running with Node.js, the plugin gracefully falls back to:

- `node:path` module for path operations
- `node:fs/promises` for file operations
- Dynamic imports to minimize bundle size

> **Performance Tip**: For the best development experience, use Bun as your runtime. The plugin will automatically leverage Bun's native APIs for significantly faster file operations.

## 🔧 Advanced Usage

### 🔄 URL Replacement

Transform your development URLs to production URLs automatically during build. The plugin supports both direct configuration and environment variables.

#### Using Plugin Configuration

```js
// vite.config.js
import { defineConfig } from 'vite'
import officeAddin from 'vite-plugin-office-addin-bun'

export default defineConfig({
  plugins: [officeAddin({
    devUrl: 'https://localhost:3000',
    prodUrl: 'https://office-addin.contoso.com'
  })]
})
```

#### Using Environment Variables

Configure URLs through environment variables for different deployment environments:

```js
// vite.config.js + .env files
import { defineConfig } from 'vite'
import officeAddin from 'vite-plugin-office-addin-bun'

export default defineConfig({
  plugins: [officeAddin()]
})
```

```sh
# .env.production
ADDIN_DEV_URL=https://localhost:3000
ADDIN_PROD_URL=https://office-addin.contoso.com

# .env.staging  
ADDIN_DEV_URL=https://localhost:3000
ADDIN_PROD_URL=https://staging.office-addin.contoso.com
```

> **Configuration Priority**: Plugin options take precedence over environment variables. Use plugin configuration for static setups and environment variables for dynamic deployments.

When you run `vite build`, the generated **manifest.xml** file will have production addresses automatically replaced.

### 📁 Custom Manifest Paths

If your `manifest.xml` file is not in the project root, specify a custom path:

```js
// vite.config.js
import { defineConfig } from 'vite'
import officeAddin from 'vite-plugin-office-addin-bun'

export default defineConfig({
  plugins: [officeAddin({
    path: 'src/other-folder/manifest.xml'
  })]
})
```

### 📄 Multiple Manifests

Copy multiple manifest files for different Office applications or environments:

```js
// vite.config.js
import { defineConfig } from 'vite'
import officeAddin from 'vite-plugin-office-addin-bun'

export default defineConfig({
  plugins: [
    officeAddin({ path: 'manifests/excel-addin.xml' }),
    officeAddin({ path: 'manifests/word-addin.xml' }),
    officeAddin({ path: 'manifests/powerpoint-addin.xml' }),
  ]
})
```

## 📚 API Reference

### Plugin Options

```typescript
interface Options {
  /**
   * Path to the manifest file relative to project root
   * @default "manifest.xml"
   */
  path?: string;
  
  /**
   * Development URL to be replaced in the manifest
   * Takes precedence over ADDIN_DEV_URL environment variable
   */
  devUrl?: string;
  
  /**
   * Production URL to replace the development URL
   * Takes precedence over ADDIN_PROD_URL environment variable  
   */
  prodUrl?: string;
}
```

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `ADDIN_DEV_URL` | Development server URL | `https://localhost:3000` |
| `ADDIN_PROD_URL` | Production deployment URL | `https://office-addin.contoso.com` |

## 💡 Examples

### Basic Excel Add-in Setup

```js
// vite.config.js
import { defineConfig } from 'vite'
import officeAddin from 'vite-plugin-office-addin-bun'

export default defineConfig({
  plugins: [
    officeAddin({
      devUrl: 'https://localhost:3000',
      prodUrl: 'https://excel-addin.contoso.com'
    })
  ],
  server: {
    port: 3000,
    https: true
  }
})
```

### Multi-Environment Setup

```js
// vite.config.js
import { defineConfig } from 'vite'
import officeAddin from 'vite-plugin-office-addin-bun'

export default defineConfig(({ mode }) => ({
  plugins: [
    officeAddin({
      path: `manifests/manifest.${mode}.xml`
    })
  ]
}))
```

## 🔧 Troubleshooting

### Common Issues

#### Q: Plugin doesn't replace URLs in my manifest

- Ensure `devUrl` and `prodUrl` are both configured
- Check that the URLs in your manifest exactly match the `devUrl` value
- Verify the manifest file exists at the specified path

#### Q: Build fails with "manifest.xml file does not exist"

- Check the `path` option points to the correct manifest location
- Ensure the manifest file exists relative to your project root
- Verify file permissions allow reading the manifest

#### Q: Performance seems slow

- Consider using Bun runtime for optimal performance
- The plugin automatically uses the fastest available APIs for your runtime

### Debug Mode

Set the environment variable to enable verbose logging:

```sh
ADDIN_DEBUG=1 bun run build
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🙏 Acknowledgments

This project is based on [vite-plugin-office-addin](https://github.com/jozefizso/vite-plugin-office-addin) by [Jozef Izso](https://github.com/jozefizso). We extend our gratitude for the foundational work that made this Bun-enhanced version possible.

## 📝 License

Licensed under [MIT License](LICENSE).
Copyright © 2024 Sebastian Jara
