# bun-vite-plugin-office-addin

> Office Add-ins development using Bun and Vite.

Build your Office Add-in using Bun and Vite. This plugin adds the support
for **manifest.xml** file to be copied to build output.

## Getting Started

Install the **bun-vite-plugin-office-addin** to your Office Add-in project.

```sh
bun install --save-dev bun-vite-plugin-office-addin
```

### Configure Vite

Use the plugin in your `vite.config.js` file:

```js
// vite.config.js
import { defineConfig } from 'vite'
import officeAddin from 'bun-vite-plugin-office-addin'

export default defineConfig({
  plugins: [officeAddin()]
})
```

## Advanced Usage

### Replacing development address

To replace the development URL address in **manifest.xml** file to production address,
you can use the plugin configuration option or `.env` files.

```js
// vite.config.js
import { defineConfig } from 'vite'
import officeAddin from 'bun-vite-plugin-office-addin'

export default defineConfig({
  plugins: [officeAddin({
    devUrl: 'https://localhost:3000',
    prodUrl: 'https://office-addin.contoso.com'
  })]
})
```

Alternatively, you can use `.env` to replace different addresses for different environments.
Use the `ADDIN_DEV_URL` and `ADDIN_PROD_URL` environment variables.

```js
// vite.config.js + .env files
import { defineConfig } from 'vite'
import officeAddin from 'bun-vite-plugin-office-addin'

export default defineConfig({
  plugins: [officeAddin()]
})
```

```sh
# .env
ADDIN_DEV_URL=https://localhost:3000
ADDIN_PROD_URL=https://office-addin.contoso.com
```

When you run `vite build` the generated **manifest.xml** file will have
production addresses.


### Specify a custom path

If your `manifest.xml` file is not in the project root, set the `path` property to point to the right location:

```js
// vite.config.js
import { defineConfig } from 'vite'
import officeAddin from 'bun-vite-plugin-office-addin'

export default defineConfig({
  plugins: [officeAddin({
    path: 'src/other-folder/manifest.xml'
  })]
})
```

### Copying multiple manifests

To copy multiple manifests to your output folder, define `officeAddin` entry for each file:

```js
// vite.config.js
import { defineConfig } from 'vite'
import officeAddin from 'bun-vite-plugin-office-addin'

export default defineConfig({
  plugins: [
    officeAddin({ path: 'manifest.xml' }),
    officeAddin({ path: 'manifest.staging.xml' }),
  ]
})
```


## License

Licensed under [MIT License](LICENSE).  
Copyright © 2024 Sebastian Jara
