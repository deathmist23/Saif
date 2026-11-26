import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
import {defineConfig} from 'vite';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(() => {
  return {
    base: './',
    build: {
      rolldownOptions: {
        output: {
          format: 'iife' as const,
          codeSplitting: false,
        },
      },
    },
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'classic-file-protocol-html',
        apply: 'build' as const,
        transformIndexHtml: {
          order: 'post' as const,
          handler(html: string): string {
            return html
              .replace(/<script data-raw-source-notice>[\s\S]*?<\/script>\s*/g, '')
              .replace(
                /<script type="module" crossorigin src="([^"]+)"><\/script>/g,
                '<script defer src="$1"></script>',
              )
              .replace(
                /<link rel="stylesheet" crossorigin href="([^"]+)">/g,
                '<link rel="stylesheet" href="$1">',
              );
          },
        },
      },
      {
        name: 'github-pages-static-cleanup',
        apply: 'build' as const,
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(rootDir, 'dist');
          if (!fs.existsSync(distDir)) return;

          // Ensure GitHub Pages serves everything cleanly without Jekyll filtering
          fs.writeFileSync(path.join(distDir, '.nojekyll'), '');

          // Remove dev-only downloadable ZIP folder from production static output
          const distDownloads = path.join(distDir, 'downloads');
          if (fs.existsSync(distDownloads)) {
            fs.rmSync(distDownloads, {recursive: true, force: true});
          }

          // Remove unused legacy files in dist/assets/aistudio except active portrait
          const aistudioDir = path.join(distDir, 'assets', 'aistudio');
          if (fs.existsSync(aistudioDir)) {
            for (const entry of fs.readdirSync(aistudioDir)) {
              if (entry !== 'IMG_20240605_211150_8856819c.jpg') {
                fs.rmSync(path.join(aistudioDir, entry), {recursive: true, force: true});
              }
            }
          }

          // Inline built JS/CSS bundle + portrait fallback directly into dist/index.html
          // so dist/index.html opens directly in any browser (file:// or any static website) without a server.
          const distHtmlPath = path.join(distDir, 'index.html');
          const distAssetsDir = path.join(distDir, 'assets');
          if (fs.existsSync(distHtmlPath) && fs.existsSync(distAssetsDir)) {
            const bundleFiles = fs
              .readdirSync(distAssetsDir)
              .filter((f) => /^index-.*\.js$/.test(f));

            if (bundleFiles.length > 0) {
              const bundlePath = path.join(distAssetsDir, bundleFiles[0]);
              const rawJs = fs
                .readFileSync(bundlePath, 'utf8')
                .replace(/<\/(script)/gi, '<\\/$1');

              const portraitPath = path.join(
                aistudioDir,
                'IMG_20240605_211150_8856819c.jpg',
              );
              let portraitScript = '';
              if (fs.existsSync(portraitPath)) {
                const base64 = fs.readFileSync(portraitPath).toString('base64');
                portraitScript = `<script>window.__SAIF_PORTRAIT_FALLBACK__="data:image/jpeg;base64,${base64}";</script>\n    `;
              }

              let html = fs
                .readFileSync(distHtmlPath, 'utf8')
                .replace(/\s*<script[^>]*src="\.\/assets\/index-[^"]+\.js"[^>]*><\/script>/g, '');

              const bodyCloseIdx = html.lastIndexOf('</body>');
              if (bodyCloseIdx !== -1) {
                html =
                  html.slice(0, bodyCloseIdx) +
                  `    ${portraitScript}<script>${rawJs}</script>\n  ` +
                  html.slice(bodyCloseIdx);
                fs.writeFileSync(distHtmlPath, html, 'utf8');
                fs.rmSync(bundlePath, {force: true});
              }
            }
          }
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(rootDir, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
