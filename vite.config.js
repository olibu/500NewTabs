import { defineConfig } from 'vite'
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';


const pkg = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf-8')
);

function generateManifest() {
  const isFirefox = process.env.TARGET === "firefox";

  const manifest = {
    manifest_version: 3,
    name: "500NewTabs",
    description: "New tab with images from 500px.com",
    version: pkg.version,
    icons: {
      128: "icons/icon128.png",
      16: "icons/icon16.png",
      48: "icons/icon48.png"
    },
    options_page: "option.html",
    options_ui: {
      page: "option.html",
      open_in_tab: true
    },
    chrome_url_overrides: {
      newtab: "newtab.html"
    },
    host_permissions: [
      "https://api.500px.com/*",
      "https://drscdn.500px.org/*"
    ],
    permissions: [ "storage", "tabs" , "unlimitedStorage" ],
    default_locale: "en",
    homepage_url: "https://github.com/olibu/500NewTabs",
  };

  if (isFirefox) {
    manifest.background = { 
      scripts: ["background.js"] ,
      type: "module"
    };
    manifest["browser_specific_settings"] = {
      gecko: { 
        id: "500newtabs@olibu.com",
        data_collection_permissions: {
          required: ["none"]
        }
      }
    };
    manifest.chrome_settings_overrides = {
      homepage: "newtab.html"
    };
  }
  else {
    manifest.update_url = "https://clients2.google.com/service/update2/crx";
    manifest.offline_enabled = true;
  }

  return manifest;
}

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "js")
    }
  },
  plugins: [
    {
      name: 'generate-manifest',
      generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'manifest.json',
          source: JSON.stringify(generateManifest(), null, 2)
        });
      }
    }
  ],
  build: {
    emptyOutDir: true,
    rollupOptions: {
      // https://rollupjs.org/guide/en/#big-list-of-options
      input: [
        resolve(__dirname, 'js/background.js'),
        resolve(__dirname, 'newtab.html'),
        resolve(__dirname, 'option.html'),
      ],
      output: {
        entryFileNames: (chunkInfo) => {
          // Filenames you want to keep unhashed
          const noHashFiles = ["background"];
          if (noHashFiles.includes(chunkInfo.name)) {
            return "[name].js"; // Keep file unhashed
          }
          return "assets/[name]-[hash].js"; // Hash other entry files
        },
        // Naming patterns for various output file types
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
})
