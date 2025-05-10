// vite.config.ts
import { cloudflareDevProxyVitePlugin as remixCloudflareDevProxy, vitePlugin as remixVitePlugin } from "file:///D:/Real%20Bolt.DIY/test4.2/Original%20Bolt%20-%20Copy/Test_refine/Original%20Bolt%20-%20Copy/Original%20Bolt%20-%20Copy/node_modules/.pnpm/@remix-run+dev@2.16.3_@remix-run+react@2.16.3_react-dom@18.3.1_react@18.3.1__react@18.3.1_typ_wrimpgwwdo2we64jgc6jya46fu/node_modules/@remix-run/dev/dist/index.js";
import UnoCSS from "file:///D:/Real%20Bolt.DIY/test4.2/Original%20Bolt%20-%20Copy/Test_refine/Original%20Bolt%20-%20Copy/Original%20Bolt%20-%20Copy/node_modules/.pnpm/unocss@0.61.9_postcss@8.5.3_rollup@4.38.0_vite@5.4.15_@types+node@22.13.14_sass-embedded@1.86.0_/node_modules/unocss/dist/vite.mjs";
import { defineConfig } from "file:///D:/Real%20Bolt.DIY/test4.2/Original%20Bolt%20-%20Copy/Test_refine/Original%20Bolt%20-%20Copy/Original%20Bolt%20-%20Copy/node_modules/.pnpm/vite@5.4.15_@types+node@22.13.14_sass-embedded@1.86.0/node_modules/vite/dist/node/index.js";
import { nodePolyfills } from "file:///D:/Real%20Bolt.DIY/test4.2/Original%20Bolt%20-%20Copy/Test_refine/Original%20Bolt%20-%20Copy/Original%20Bolt%20-%20Copy/node_modules/.pnpm/vite-plugin-node-polyfills@0.22.0_rollup@4.38.0_vite@5.4.15_@types+node@22.13.14_sass-embedded@1.86.0_/node_modules/vite-plugin-node-polyfills/dist/index.js";
import { optimizeCssModules } from "file:///D:/Real%20Bolt.DIY/test4.2/Original%20Bolt%20-%20Copy/Test_refine/Original%20Bolt%20-%20Copy/Original%20Bolt%20-%20Copy/node_modules/.pnpm/vite-plugin-optimize-css-modules@1.2.0_vite@5.4.15_@types+node@22.13.14_sass-embedded@1.86.0_/node_modules/vite-plugin-optimize-css-modules/dist/index.mjs";
import tsconfigPaths from "file:///D:/Real%20Bolt.DIY/test4.2/Original%20Bolt%20-%20Copy/Test_refine/Original%20Bolt%20-%20Copy/Original%20Bolt%20-%20Copy/node_modules/.pnpm/vite-tsconfig-paths@4.3.2_typescript@5.8.2_vite@5.4.15_@types+node@22.13.14_sass-embedded@1.86.0_/node_modules/vite-tsconfig-paths/dist/index.mjs";
import * as dotenv from "file:///D:/Real%20Bolt.DIY/test4.2/Original%20Bolt%20-%20Copy/Test_refine/Original%20Bolt%20-%20Copy/Original%20Bolt%20-%20Copy/node_modules/.pnpm/dotenv@16.4.7/node_modules/dotenv/lib/main.js";
import { execSync } from "child_process";
import { readFileSync } from "fs";
import { join } from "path";
dotenv.config();
var getGitInfo = () => {
  try {
    return {
      commitHash: execSync("git rev-parse --short HEAD").toString().trim(),
      branch: execSync("git rev-parse --abbrev-ref HEAD").toString().trim(),
      commitTime: execSync("git log -1 --format=%cd").toString().trim(),
      author: execSync("git log -1 --format=%an").toString().trim(),
      email: execSync("git log -1 --format=%ae").toString().trim(),
      remoteUrl: execSync("git config --get remote.origin.url").toString().trim(),
      repoName: execSync("git config --get remote.origin.url").toString().trim().replace(/^.*github.com[:/]/, "").replace(/\.git$/, "")
    };
  } catch {
    return {
      commitHash: "no-git-info",
      branch: "unknown",
      commitTime: "unknown",
      author: "unknown",
      email: "unknown",
      remoteUrl: "unknown",
      repoName: "unknown"
    };
  }
};
var getPackageJson = () => {
  try {
    const pkgPath = join(process.cwd(), "package.json");
    const pkg2 = JSON.parse(readFileSync(pkgPath, "utf-8"));
    return {
      name: pkg2.name,
      description: pkg2.description,
      license: pkg2.license,
      dependencies: pkg2.dependencies || {},
      devDependencies: pkg2.devDependencies || {},
      peerDependencies: pkg2.peerDependencies || {},
      optionalDependencies: pkg2.optionalDependencies || {}
    };
  } catch {
    return {
      name: "bolt.diy",
      description: "A DIY LLM interface",
      license: "MIT",
      dependencies: {},
      devDependencies: {},
      peerDependencies: {},
      optionalDependencies: {}
    };
  }
};
var pkg = getPackageJson();
var gitInfo = getGitInfo();
var vite_config_default = defineConfig((config2) => {
  return {
    define: {
      __COMMIT_HASH: JSON.stringify(gitInfo.commitHash),
      __GIT_BRANCH: JSON.stringify(gitInfo.branch),
      __GIT_COMMIT_TIME: JSON.stringify(gitInfo.commitTime),
      __GIT_AUTHOR: JSON.stringify(gitInfo.author),
      __GIT_EMAIL: JSON.stringify(gitInfo.email),
      __GIT_REMOTE_URL: JSON.stringify(gitInfo.remoteUrl),
      __GIT_REPO_NAME: JSON.stringify(gitInfo.repoName),
      __APP_VERSION: JSON.stringify(process.env.npm_package_version),
      __PKG_NAME: JSON.stringify(pkg.name),
      __PKG_DESCRIPTION: JSON.stringify(pkg.description),
      __PKG_LICENSE: JSON.stringify(pkg.license),
      __PKG_DEPENDENCIES: JSON.stringify(pkg.dependencies),
      __PKG_DEV_DEPENDENCIES: JSON.stringify(pkg.devDependencies),
      __PKG_PEER_DEPENDENCIES: JSON.stringify(pkg.peerDependencies),
      __PKG_OPTIONAL_DEPENDENCIES: JSON.stringify(pkg.optionalDependencies),
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV)
    },
    build: {
      target: "esnext"
    },
    plugins: [
      nodePolyfills({
        include: ["buffer", "process", "util", "stream"],
        globals: {
          Buffer: true,
          process: true,
          global: true
        },
        protocolImports: true,
        exclude: ["child_process", "fs", "path"]
      }),
      {
        name: "buffer-polyfill",
        transform(code, id) {
          if (id.includes("env.mjs")) {
            return {
              code: `import { Buffer } from 'buffer';
${code}`,
              map: null
            };
          }
          return null;
        }
      },
      config2.mode !== "test" && remixCloudflareDevProxy(),
      remixVitePlugin({
        future: {
          v3_fetcherPersist: true,
          v3_relativeSplatPath: true,
          v3_throwAbortReason: true,
          v3_lazyRouteDiscovery: true
        }
      }),
      UnoCSS(),
      tsconfigPaths(),
      chrome129IssuePlugin(),
      config2.mode === "production" && optimizeCssModules({ apply: "build" })
    ],
    envPrefix: [
      "VITE_",
      "OPENAI_LIKE_API_BASE_URL",
      "OLLAMA_API_BASE_URL",
      "LMSTUDIO_API_BASE_URL",
      "TOGETHER_API_BASE_URL"
    ],
    css: {
      preprocessorOptions: {
        scss: {
          api: "modern-compiler"
        }
      }
    }
  };
});
function chrome129IssuePlugin() {
  return {
    name: "chrome129IssuePlugin",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const raw = req.headers["user-agent"]?.match(/Chrom(e|ium)\/([0-9]+)\./);
        if (raw) {
          const version = parseInt(raw[2], 10);
          if (version === 129) {
            res.setHeader("content-type", "text/html");
            res.end(
              '<body><h1>Please use Chrome Canary for testing.</h1><p>Chrome 129 has an issue with JavaScript modules & Vite local development, see <a href="https://github.com/stackblitz/bolt.new/issues/86#issuecomment-2395519258">for more information.</a></p><p><b>Note:</b> This only impacts <u>local development</u>. `pnpm run build` and `pnpm run start` will work fine in this browser.</p></body>'
            );
            return;
          }
        }
        next();
      });
    }
  };
}
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxSZWFsIEJvbHQuRElZXFxcXHRlc3Q0LjJcXFxcT3JpZ2luYWwgQm9sdCAtIENvcHlcXFxcVGVzdF9yZWZpbmVcXFxcT3JpZ2luYWwgQm9sdCAtIENvcHlcXFxcT3JpZ2luYWwgQm9sdCAtIENvcHlcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkQ6XFxcXFJlYWwgQm9sdC5ESVlcXFxcdGVzdDQuMlxcXFxPcmlnaW5hbCBCb2x0IC0gQ29weVxcXFxUZXN0X3JlZmluZVxcXFxPcmlnaW5hbCBCb2x0IC0gQ29weVxcXFxPcmlnaW5hbCBCb2x0IC0gQ29weVxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRDovUmVhbCUyMEJvbHQuRElZL3Rlc3Q0LjIvT3JpZ2luYWwlMjBCb2x0JTIwLSUyMENvcHkvVGVzdF9yZWZpbmUvT3JpZ2luYWwlMjBCb2x0JTIwLSUyMENvcHkvT3JpZ2luYWwlMjBCb2x0JTIwLSUyMENvcHkvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBjbG91ZGZsYXJlRGV2UHJveHlWaXRlUGx1Z2luIGFzIHJlbWl4Q2xvdWRmbGFyZURldlByb3h5LCB2aXRlUGx1Z2luIGFzIHJlbWl4Vml0ZVBsdWdpbiB9IGZyb20gJ0ByZW1peC1ydW4vZGV2JztcclxuaW1wb3J0IFVub0NTUyBmcm9tICd1bm9jc3Mvdml0ZSc7XHJcbmltcG9ydCB7IGRlZmluZUNvbmZpZywgdHlwZSBWaXRlRGV2U2VydmVyIH0gZnJvbSAndml0ZSc7XHJcbmltcG9ydCB7IG5vZGVQb2x5ZmlsbHMgfSBmcm9tICd2aXRlLXBsdWdpbi1ub2RlLXBvbHlmaWxscyc7XHJcbmltcG9ydCB7IG9wdGltaXplQ3NzTW9kdWxlcyB9IGZyb20gJ3ZpdGUtcGx1Z2luLW9wdGltaXplLWNzcy1tb2R1bGVzJztcclxuaW1wb3J0IHRzY29uZmlnUGF0aHMgZnJvbSAndml0ZS10c2NvbmZpZy1wYXRocyc7XHJcbmltcG9ydCAqIGFzIGRvdGVudiBmcm9tICdkb3RlbnYnO1xyXG5pbXBvcnQgeyBleGVjU3luYyB9IGZyb20gJ2NoaWxkX3Byb2Nlc3MnO1xyXG5pbXBvcnQgeyByZWFkRmlsZVN5bmMgfSBmcm9tICdmcyc7XHJcbmltcG9ydCB7IGpvaW4gfSBmcm9tICdwYXRoJztcclxuXHJcbmRvdGVudi5jb25maWcoKTtcclxuXHJcbi8vIEdldCBkZXRhaWxlZCBnaXQgaW5mbyB3aXRoIGZhbGxiYWNrc1xyXG5jb25zdCBnZXRHaXRJbmZvID0gKCkgPT4ge1xyXG4gIHRyeSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBjb21taXRIYXNoOiBleGVjU3luYygnZ2l0IHJldi1wYXJzZSAtLXNob3J0IEhFQUQnKS50b1N0cmluZygpLnRyaW0oKSxcclxuICAgICAgYnJhbmNoOiBleGVjU3luYygnZ2l0IHJldi1wYXJzZSAtLWFiYnJldi1yZWYgSEVBRCcpLnRvU3RyaW5nKCkudHJpbSgpLFxyXG4gICAgICBjb21taXRUaW1lOiBleGVjU3luYygnZ2l0IGxvZyAtMSAtLWZvcm1hdD0lY2QnKS50b1N0cmluZygpLnRyaW0oKSxcclxuICAgICAgYXV0aG9yOiBleGVjU3luYygnZ2l0IGxvZyAtMSAtLWZvcm1hdD0lYW4nKS50b1N0cmluZygpLnRyaW0oKSxcclxuICAgICAgZW1haWw6IGV4ZWNTeW5jKCdnaXQgbG9nIC0xIC0tZm9ybWF0PSVhZScpLnRvU3RyaW5nKCkudHJpbSgpLFxyXG4gICAgICByZW1vdGVVcmw6IGV4ZWNTeW5jKCdnaXQgY29uZmlnIC0tZ2V0IHJlbW90ZS5vcmlnaW4udXJsJykudG9TdHJpbmcoKS50cmltKCksXHJcbiAgICAgIHJlcG9OYW1lOiBleGVjU3luYygnZ2l0IGNvbmZpZyAtLWdldCByZW1vdGUub3JpZ2luLnVybCcpXHJcbiAgICAgICAgLnRvU3RyaW5nKClcclxuICAgICAgICAudHJpbSgpXHJcbiAgICAgICAgLnJlcGxhY2UoL14uKmdpdGh1Yi5jb21bOi9dLywgJycpXHJcbiAgICAgICAgLnJlcGxhY2UoL1xcLmdpdCQvLCAnJyksXHJcbiAgICB9O1xyXG4gIH0gY2F0Y2gge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgY29tbWl0SGFzaDogJ25vLWdpdC1pbmZvJyxcclxuICAgICAgYnJhbmNoOiAndW5rbm93bicsXHJcbiAgICAgIGNvbW1pdFRpbWU6ICd1bmtub3duJyxcclxuICAgICAgYXV0aG9yOiAndW5rbm93bicsXHJcbiAgICAgIGVtYWlsOiAndW5rbm93bicsXHJcbiAgICAgIHJlbW90ZVVybDogJ3Vua25vd24nLFxyXG4gICAgICByZXBvTmFtZTogJ3Vua25vd24nLFxyXG4gICAgfTtcclxuICB9XHJcbn07XHJcblxyXG4vLyBSZWFkIHBhY2thZ2UuanNvbiB3aXRoIGRldGFpbGVkIGRlcGVuZGVuY3kgaW5mb1xyXG5jb25zdCBnZXRQYWNrYWdlSnNvbiA9ICgpID0+IHtcclxuICB0cnkge1xyXG4gICAgY29uc3QgcGtnUGF0aCA9IGpvaW4ocHJvY2Vzcy5jd2QoKSwgJ3BhY2thZ2UuanNvbicpO1xyXG4gICAgY29uc3QgcGtnID0gSlNPTi5wYXJzZShyZWFkRmlsZVN5bmMocGtnUGF0aCwgJ3V0Zi04JykpO1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgIG5hbWU6IHBrZy5uYW1lLFxyXG4gICAgICBkZXNjcmlwdGlvbjogcGtnLmRlc2NyaXB0aW9uLFxyXG4gICAgICBsaWNlbnNlOiBwa2cubGljZW5zZSxcclxuICAgICAgZGVwZW5kZW5jaWVzOiBwa2cuZGVwZW5kZW5jaWVzIHx8IHt9LFxyXG4gICAgICBkZXZEZXBlbmRlbmNpZXM6IHBrZy5kZXZEZXBlbmRlbmNpZXMgfHwge30sXHJcbiAgICAgIHBlZXJEZXBlbmRlbmNpZXM6IHBrZy5wZWVyRGVwZW5kZW5jaWVzIHx8IHt9LFxyXG4gICAgICBvcHRpb25hbERlcGVuZGVuY2llczogcGtnLm9wdGlvbmFsRGVwZW5kZW5jaWVzIHx8IHt9LFxyXG4gICAgfTtcclxuICB9IGNhdGNoIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIG5hbWU6ICdib2x0LmRpeScsXHJcbiAgICAgIGRlc2NyaXB0aW9uOiAnQSBESVkgTExNIGludGVyZmFjZScsXHJcbiAgICAgIGxpY2Vuc2U6ICdNSVQnLFxyXG4gICAgICBkZXBlbmRlbmNpZXM6IHt9LFxyXG4gICAgICBkZXZEZXBlbmRlbmNpZXM6IHt9LFxyXG4gICAgICBwZWVyRGVwZW5kZW5jaWVzOiB7fSxcclxuICAgICAgb3B0aW9uYWxEZXBlbmRlbmNpZXM6IHt9LFxyXG4gICAgfTtcclxuICB9XHJcbn07XHJcblxyXG5jb25zdCBwa2cgPSBnZXRQYWNrYWdlSnNvbigpO1xyXG5jb25zdCBnaXRJbmZvID0gZ2V0R2l0SW5mbygpO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKChjb25maWcpID0+IHtcclxuICByZXR1cm4ge1xyXG4gICAgZGVmaW5lOiB7XHJcbiAgICAgIF9fQ09NTUlUX0hBU0g6IEpTT04uc3RyaW5naWZ5KGdpdEluZm8uY29tbWl0SGFzaCksXHJcbiAgICAgIF9fR0lUX0JSQU5DSDogSlNPTi5zdHJpbmdpZnkoZ2l0SW5mby5icmFuY2gpLFxyXG4gICAgICBfX0dJVF9DT01NSVRfVElNRTogSlNPTi5zdHJpbmdpZnkoZ2l0SW5mby5jb21taXRUaW1lKSxcclxuICAgICAgX19HSVRfQVVUSE9SOiBKU09OLnN0cmluZ2lmeShnaXRJbmZvLmF1dGhvciksXHJcbiAgICAgIF9fR0lUX0VNQUlMOiBKU09OLnN0cmluZ2lmeShnaXRJbmZvLmVtYWlsKSxcclxuICAgICAgX19HSVRfUkVNT1RFX1VSTDogSlNPTi5zdHJpbmdpZnkoZ2l0SW5mby5yZW1vdGVVcmwpLFxyXG4gICAgICBfX0dJVF9SRVBPX05BTUU6IEpTT04uc3RyaW5naWZ5KGdpdEluZm8ucmVwb05hbWUpLFxyXG4gICAgICBfX0FQUF9WRVJTSU9OOiBKU09OLnN0cmluZ2lmeShwcm9jZXNzLmVudi5ucG1fcGFja2FnZV92ZXJzaW9uKSxcclxuICAgICAgX19QS0dfTkFNRTogSlNPTi5zdHJpbmdpZnkocGtnLm5hbWUpLFxyXG4gICAgICBfX1BLR19ERVNDUklQVElPTjogSlNPTi5zdHJpbmdpZnkocGtnLmRlc2NyaXB0aW9uKSxcclxuICAgICAgX19QS0dfTElDRU5TRTogSlNPTi5zdHJpbmdpZnkocGtnLmxpY2Vuc2UpLFxyXG4gICAgICBfX1BLR19ERVBFTkRFTkNJRVM6IEpTT04uc3RyaW5naWZ5KHBrZy5kZXBlbmRlbmNpZXMpLFxyXG4gICAgICBfX1BLR19ERVZfREVQRU5ERU5DSUVTOiBKU09OLnN0cmluZ2lmeShwa2cuZGV2RGVwZW5kZW5jaWVzKSxcclxuICAgICAgX19QS0dfUEVFUl9ERVBFTkRFTkNJRVM6IEpTT04uc3RyaW5naWZ5KHBrZy5wZWVyRGVwZW5kZW5jaWVzKSxcclxuICAgICAgX19QS0dfT1BUSU9OQUxfREVQRU5ERU5DSUVTOiBKU09OLnN0cmluZ2lmeShwa2cub3B0aW9uYWxEZXBlbmRlbmNpZXMpLFxyXG4gICAgICAncHJvY2Vzcy5lbnYuTk9ERV9FTlYnOiBKU09OLnN0cmluZ2lmeShwcm9jZXNzLmVudi5OT0RFX0VOViksXHJcbiAgICB9LFxyXG4gICAgYnVpbGQ6IHtcclxuICAgICAgdGFyZ2V0OiAnZXNuZXh0JyxcclxuICAgIH0sXHJcbiAgICBwbHVnaW5zOiBbXHJcbiAgICAgIG5vZGVQb2x5ZmlsbHMoe1xyXG4gICAgICAgIGluY2x1ZGU6IFsnYnVmZmVyJywgJ3Byb2Nlc3MnLCAndXRpbCcsICdzdHJlYW0nXSxcclxuICAgICAgICBnbG9iYWxzOiB7XHJcbiAgICAgICAgICBCdWZmZXI6IHRydWUsXHJcbiAgICAgICAgICBwcm9jZXNzOiB0cnVlLFxyXG4gICAgICAgICAgZ2xvYmFsOiB0cnVlLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcHJvdG9jb2xJbXBvcnRzOiB0cnVlLFxyXG4gICAgICAgIGV4Y2x1ZGU6IFsnY2hpbGRfcHJvY2VzcycsICdmcycsICdwYXRoJ10sXHJcbiAgICAgIH0pLFxyXG4gICAgICB7XHJcbiAgICAgICAgbmFtZTogJ2J1ZmZlci1wb2x5ZmlsbCcsXHJcbiAgICAgICAgdHJhbnNmb3JtKGNvZGUsIGlkKSB7XHJcbiAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ2Vudi5tanMnKSkge1xyXG4gICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgIGNvZGU6IGBpbXBvcnQgeyBCdWZmZXIgfSBmcm9tICdidWZmZXInO1xcbiR7Y29kZX1gLFxyXG4gICAgICAgICAgICAgIG1hcDogbnVsbCxcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgICBjb25maWcubW9kZSAhPT0gJ3Rlc3QnICYmIHJlbWl4Q2xvdWRmbGFyZURldlByb3h5KCksXHJcbiAgICAgIHJlbWl4Vml0ZVBsdWdpbih7XHJcbiAgICAgICAgZnV0dXJlOiB7XHJcbiAgICAgICAgICB2M19mZXRjaGVyUGVyc2lzdDogdHJ1ZSxcclxuICAgICAgICAgIHYzX3JlbGF0aXZlU3BsYXRQYXRoOiB0cnVlLFxyXG4gICAgICAgICAgdjNfdGhyb3dBYm9ydFJlYXNvbjogdHJ1ZSxcclxuICAgICAgICAgIHYzX2xhenlSb3V0ZURpc2NvdmVyeTogdHJ1ZSxcclxuICAgICAgICB9LFxyXG4gICAgICB9KSxcclxuICAgICAgVW5vQ1NTKCksXHJcbiAgICAgIHRzY29uZmlnUGF0aHMoKSxcclxuICAgICAgY2hyb21lMTI5SXNzdWVQbHVnaW4oKSxcclxuICAgICAgY29uZmlnLm1vZGUgPT09ICdwcm9kdWN0aW9uJyAmJiBvcHRpbWl6ZUNzc01vZHVsZXMoeyBhcHBseTogJ2J1aWxkJyB9KSxcclxuICAgIF0sXHJcbiAgICBlbnZQcmVmaXg6IFtcclxuICAgICAgJ1ZJVEVfJyxcclxuICAgICAgJ09QRU5BSV9MSUtFX0FQSV9CQVNFX1VSTCcsXHJcbiAgICAgICdPTExBTUFfQVBJX0JBU0VfVVJMJyxcclxuICAgICAgJ0xNU1RVRElPX0FQSV9CQVNFX1VSTCcsXHJcbiAgICAgICdUT0dFVEhFUl9BUElfQkFTRV9VUkwnLFxyXG4gICAgXSxcclxuICAgIGNzczoge1xyXG4gICAgICBwcmVwcm9jZXNzb3JPcHRpb25zOiB7XHJcbiAgICAgICAgc2Nzczoge1xyXG4gICAgICAgICAgYXBpOiAnbW9kZXJuLWNvbXBpbGVyJyxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICB9O1xyXG59KTtcclxuXHJcbmZ1bmN0aW9uIGNocm9tZTEyOUlzc3VlUGx1Z2luKCkge1xyXG4gIHJldHVybiB7XHJcbiAgICBuYW1lOiAnY2hyb21lMTI5SXNzdWVQbHVnaW4nLFxyXG4gICAgY29uZmlndXJlU2VydmVyKHNlcnZlcjogVml0ZURldlNlcnZlcikge1xyXG4gICAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKChyZXEsIHJlcywgbmV4dCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IHJhdyA9IHJlcS5oZWFkZXJzWyd1c2VyLWFnZW50J10/Lm1hdGNoKC9DaHJvbShlfGl1bSlcXC8oWzAtOV0rKVxcLi8pO1xyXG5cclxuICAgICAgICBpZiAocmF3KSB7XHJcbiAgICAgICAgICBjb25zdCB2ZXJzaW9uID0gcGFyc2VJbnQocmF3WzJdLCAxMCk7XHJcblxyXG4gICAgICAgICAgaWYgKHZlcnNpb24gPT09IDEyOSkge1xyXG4gICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdjb250ZW50LXR5cGUnLCAndGV4dC9odG1sJyk7XHJcbiAgICAgICAgICAgIHJlcy5lbmQoXHJcbiAgICAgICAgICAgICAgJzxib2R5PjxoMT5QbGVhc2UgdXNlIENocm9tZSBDYW5hcnkgZm9yIHRlc3RpbmcuPC9oMT48cD5DaHJvbWUgMTI5IGhhcyBhbiBpc3N1ZSB3aXRoIEphdmFTY3JpcHQgbW9kdWxlcyAmIFZpdGUgbG9jYWwgZGV2ZWxvcG1lbnQsIHNlZSA8YSBocmVmPVwiaHR0cHM6Ly9naXRodWIuY29tL3N0YWNrYmxpdHovYm9sdC5uZXcvaXNzdWVzLzg2I2lzc3VlY29tbWVudC0yMzk1NTE5MjU4XCI+Zm9yIG1vcmUgaW5mb3JtYXRpb24uPC9hPjwvcD48cD48Yj5Ob3RlOjwvYj4gVGhpcyBvbmx5IGltcGFjdHMgPHU+bG9jYWwgZGV2ZWxvcG1lbnQ8L3U+LiBgcG5wbSBydW4gYnVpbGRgIGFuZCBgcG5wbSBydW4gc3RhcnRgIHdpbGwgd29yayBmaW5lIGluIHRoaXMgYnJvd3Nlci48L3A+PC9ib2R5PicsXHJcbiAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBuZXh0KCk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSxcclxuICB9O1xyXG59Il0sCiAgIm1hcHBpbmdzIjogIjtBQUE2ZixTQUFTLGdDQUFnQyx5QkFBeUIsY0FBYyx1QkFBdUI7QUFDcG1CLE9BQU8sWUFBWTtBQUNuQixTQUFTLG9CQUF3QztBQUNqRCxTQUFTLHFCQUFxQjtBQUM5QixTQUFTLDBCQUEwQjtBQUNuQyxPQUFPLG1CQUFtQjtBQUMxQixZQUFZLFlBQVk7QUFDeEIsU0FBUyxnQkFBZ0I7QUFDekIsU0FBUyxvQkFBb0I7QUFDN0IsU0FBUyxZQUFZO0FBRWQsY0FBTztBQUdkLElBQU0sYUFBYSxNQUFNO0FBQ3ZCLE1BQUk7QUFDRixXQUFPO0FBQUEsTUFDTCxZQUFZLFNBQVMsNEJBQTRCLEVBQUUsU0FBUyxFQUFFLEtBQUs7QUFBQSxNQUNuRSxRQUFRLFNBQVMsaUNBQWlDLEVBQUUsU0FBUyxFQUFFLEtBQUs7QUFBQSxNQUNwRSxZQUFZLFNBQVMseUJBQXlCLEVBQUUsU0FBUyxFQUFFLEtBQUs7QUFBQSxNQUNoRSxRQUFRLFNBQVMseUJBQXlC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QSxRQUNWO0FBQUEsUUFDQSxpQkFBaUI7QUFBQSxRQUNqQixTQUFTLENBQUMsaUJBQWlCLE1BQU0sTUFBTTtBQUFBLE1BQ3pDLENBQUM7QUFBQSxNQUNEO0FBQUEsUUFDRSxNQUFNO0FBQUEsUUFDTixVQUFVLE1BQU0sSUFBSTtBQUNsQixjQUFJLEdBQUcsU0FBUyxTQUFTLEdBQUc7QUFDMUIsbUJBQU87QUFBQSxjQUNMLE1BQU07QUFBQSxFQUFxQyxJQUFJO0FBQUEsY0FDL0MsS0FBSztBQUFBLFlBQ1A7QUFBQSxVQUNGO0FBRUEsaUJBQU87QUFBQSxRQUNUO0FBQUEsTUFDRjtBQUFBLE1BQ0FBLFFBQU8sU0FBUyxVQUFVLHdCQUF3QjtBQUFBLE1BQ2xELGdCQUFnQjtBQUFBLFFBQ2QsUUFBUTtBQUFBLFVBQ04sbUJBQW1CO0FBQUEsVUFDbkIsc0JBQXNCO0FBQUEsVUFDdEIscUJBQXFCO0FBQUEsVUFDckIsdUJBQXVCO0FBQUEsUUFDekI7QUFBQSxNQUNGLENBQUM7QUFBQSxNQUNELE9BQU87QUFBQSxNQUNQLGNBQWM7QUFBQSxNQUNkLHFCQUFxQjtBQUFBLE1BQ3JCQSxRQUFPLFNBQVMsZ0JBQWdCLG1CQUFtQixFQUFFLE9BQU8sUUFBUSxDQUFDO0FBQUEsSUFDdkU7QUFBQSxJQUNBLFdBQVc7QUFBQSxNQUNUO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0Y7QUFBQSxJQUNBLEtBQUs7QUFBQSxNQUNILHFCQUFxQjtBQUFBLFFBQ25CLE1BQU07QUFBQSxVQUNKLEtBQUs7QUFBQSxRQUNQO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQztBQUVELFNBQVMsdUJBQXVCO0FBQzlCLFNBQU87QUFBQSxJQUNMLE1BQU07QUFBQSxJQUNOLGdCQUFnQixRQUF1QjtBQUNyQyxhQUFPLFlBQVksSUFBSSxDQUFDLEtBQUssS0FBSyxTQUFTO0FBQ3pDLGNBQU0sTUFBTSxJQUFJLFFBQVEsWUFBWSxHQUFHLE1BQU0sMEJBQTBCO0FBRXZFLFlBQUksS0FBSztBQUNQLGdCQUFNLFVBQVUsU0FBUyxJQUFJLENBQUMsR0FBRyxFQUFFO0FBRW5DLGNBQUksWUFBWSxLQUFLO0FBQ25CLGdCQUFJLFVBQVUsZ0JBQWdCLFdBQVc7QUFDekMsZ0JBQUk7QUFBQSxjQUNGO0FBQUEsWUFDRjtBQUVBO0FBQUEsVUFDRjtBQUFBLFFBQ0Y7QUFFQSxhQUFLO0FBQUEsTUFDUCxDQUFDO0FBQUEsSUFDSDtBQUFBLEVBQ0Y7QUFDRjsiLAogICJuYW1lcyI6IFsicGtnIiwgImNvbmZpZyJdCn0K
