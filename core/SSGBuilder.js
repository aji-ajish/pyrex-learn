import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import TemplateEngine from "./TemplateEngine.js";

const SSG_OUTPUT_DIR = join(import.meta.dir, "../dist");

const SSGBuilder = {
  // SSG page build பண்ணு
  build: (route, data = {}) => {
    const html = TemplateEngine.render(route.template, data);

    // dist/ folder create பண்ணு
    if (!existsSync(SSG_OUTPUT_DIR)) {
      mkdirSync(SSG_OUTPUT_DIR, { recursive: true });
    }

    // Path-ஐ file name-ஆ convert பண்ணு
    // /blog → dist/blog/index.html
    const routePath = route.path === "/" ? "/index" : route.path;
    const outputDir = join(SSG_OUTPUT_DIR, routePath);
    mkdirSync(outputDir, { recursive: true });

    const outputFile = join(outputDir, "index.html");
    writeFileSync(outputFile, html);

    console.log(`✅ SSG built: ${route.path} → ${outputFile}`);
    return html;
  },

  // Cache store
  cache: {},

  // SSG response — cache-ல இருந்தா return பண்ணு
  serve: (routePath, buildFn) => {
    if (!SSGBuilder.cache[routePath]) {
      SSGBuilder.cache[routePath] = buildFn();
    }
    return SSGBuilder.cache[routePath];
  },

  // Cache clear பண்ணு (rebuild trigger)
  clearCache: (routePath) => {
    if (routePath) {
      delete SSGBuilder.cache[routePath];
    } else {
      SSGBuilder.cache = {};
    }
  },
};

export default SSGBuilder;
