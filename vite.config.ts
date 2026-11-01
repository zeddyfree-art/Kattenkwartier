import { readFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string };
const build = `${pkg.version}-${Date.now().toString(36)}`;

/** Writes version.json next to the app, so open apps can see that a newer build exists. */
function versionFile(): Plugin {
  return {
    name: 'version-file',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ version: pkg.version, build }) });
    },
  };
}

// Relative base: works on GitHub Pages under any repository name.
export default defineConfig({
  base: './',
  worker: { format: 'es' },
  define: {
    __BUILD_ID__: JSON.stringify(build),
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [versionFile()],
});
