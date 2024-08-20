import type { Plugin, ResolvedConfig } from "vite";
import { loadEnv } from "vite";
import { resolve, basename } from "node:path";

/**
 * Options for the officeManifest plugin.
 */
export interface Options {
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

export default function officeManifest(options?: Options): Plugin {
	const manifestFile = options?.path ?? "manifest.xml";

	let viteConfig: ResolvedConfig;
	let env: Record<string, string>;

	return {
		name: "office-addin:manifest",

		configResolved(resolvedConfig: ResolvedConfig) {
			viteConfig = resolvedConfig;
			env = loadEnv(viteConfig.mode, process.cwd(), "ADDIN");
		},

		async generateBundle() {
			const manifestPath = resolve(viteConfig.root, manifestFile);
			const file = Bun.file(manifestPath);

			if (!(await file.exists())) {
				viteConfig.logger.error(
					`The manifest.xml file does not exist at path: '${manifestPath}'`,
				);
				return;
			}

			const devUrl = options?.devUrl || env.ADDIN_DEV_URL;
			const prodUrl = options?.prodUrl || env.ADDIN_PROD_URL;

			let content = await file.text();
			if (devUrl && devUrl !== "") {
				const escapedDevUrl = devUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
				content = content.replaceAll(escapedDevUrl, prodUrl);
			}

			this.emitFile({
				type: "asset",
				fileName: basename(manifestPath),
				source: content,
			});
		},
	};
}
