import { readFileSync, existsSync } from "fs";
import { join } from "path";
import config from "../config/framework.config.js";

const VIEWS_DIR = join(import.meta.dir, "../views");

// Asset tags generate பண்ணு
const generateAssets = () => {
  const template = config.template;
  let styles = "";
  let scripts = "";

  // Meta tags
  const meta = template.meta || {};
  if (meta.description) {
    styles += `<meta name="description" content="${meta.description}">\n`;
  }

  // CDN styles
  for (const url of template.cdn?.styles || []) {
    styles += `<link rel="stylesheet" href="${url}">\n`;
  }

  // External styles
  for (const url of template.external?.styles || []) {
    styles += `<link rel="stylesheet" href="${url}">\n`;
  }

  // Inline styles
  if (template.inline?.styles) {
    styles += `<style>${template.inline.styles}</style>\n`;
  }

  // CDN scripts
  for (const url of template.cdn?.scripts || []) {
    scripts += `<script src="${url}"></script>\n`;
  }

  // External scripts
  for (const url of template.external?.scripts || []) {
    scripts += `<script src="${url}"></script>\n`;
  }

  // Inline scripts
  if (template.inline?.scripts) {
    scripts += `<script>${template.inline.scripts}</script>\n`;
  }

  return { styles, scripts };
};

const TemplateEngine = {
  // File read பண்ணு
  readTemplate: (templatePath) => {
    const fullPath = join(VIEWS_DIR, templatePath);
    if (!existsSync(fullPath)) {
      throw new Error(`Template not found: ${templatePath}`);
    }
    return readFileSync(fullPath, "utf-8");
  },

  // {% include "component.html" %} handle பண்ணு
  processIncludes: (template) => {
    return template.replace(
      /\{%\s*include\s+"([^"]+)"\s*%\}/g,
      (match, path) => {
        try {
          return TemplateEngine.readTemplate(path);
        } catch (e) {
          return `<!-- Include error: ${path} -->`;
        }
      },
    );
  },

  // {% extends "layout.html" %} + {% block %} handle பண்ணு
  processExtends: (template) => {
    const extendsMatch = template.match(/\{%\s*extends\s+"([^"]+)"\s*%\}/);
    if (!extendsMatch) return template;

    const layoutPath = extendsMatch[1];
    let layout = TemplateEngine.readTemplate(layoutPath);

    // Blocks extract பண்ணு
    const blockRegex =
      /\{%\s*block\s+(\w+)\s*%\}([\s\S]*?)\{%\s*endblock\s*%\}/g;
    const blocks = {};
    let match;

    while ((match = blockRegex.exec(template)) !== null) {
      blocks[match[1]] = match[2].trim();
    }

    // Layout-ல blocks replace பண்ணு
    layout = layout.replace(
      /\{%\s*block\s+(\w+)\s*%\}[\s\S]*?\{%\s*endblock\s*%\}/g,
      (match, blockName) => blocks[blockName] || "",
    );

    return layout;
  },

  // {% if condition %} handle பண்ணு
  processIf: (template, data) => {
    return template.replace(
      /\{%\s*if\s+(.+?)\s*%\}([\s\S]*?)\{%\s*endif\s*%\}/g,
      (match, condition, content) => {
        try {
          const fn = new Function(...Object.keys(data), `return ${condition}`);
          const result = fn(...Object.values(data));
          return result ? content : "";
        } catch (e) {
          return "";
        }
      },
    );
  },

  // {% for item in items %} handle பண்ணு
  processFor: (template, data) => {
    return template.replace(
      /\{%\s*for\s+(\w+)\s+in\s+(\w+)\s*%\}([\s\S]*?)\{%\s*endfor\s*%\}/g,
      (match, item, array, content) => {
        const items = data[array];
        if (!Array.isArray(items)) return "";

        return items
          .map((value) => {
            const itemData = { ...data, [item]: value };
            return TemplateEngine.processVariables(content, itemData);
          })
          .join("");
      },
    );
  },

  // {{ variable }} handle பண்ணு
  processVariables: (template, data) => {
    return template.replace(/\{\{\s*([^}]+)\s*\}\}/g, (match, key) => {
      const keys = key.trim().split(".");
      let value = data;
      for (const k of keys) {
        value = value?.[k];
      }
      return value !== undefined && value !== null ? value : "";
    });
  },

  // CSS/JS inject பண்ணு (framework.config.js இருந்து)
  processAssets: (template, data) => {
    const { styles, scripts } = generateAssets();
    return template
      .replace("{{ styles }}", styles)
      .replace("{{ scripts }}", scripts);
  },

  // Main render function
  render: (templatePath, data = {}) => {
    let template = TemplateEngine.readTemplate(templatePath);

    // 1. Extends process பண்ணு
    template = TemplateEngine.processExtends(template);

    // 2. Includes process பண்ணு
    template = TemplateEngine.processIncludes(template);

    // 3. ✅ Assets முதல்ல inject பண்ணு — variables process பண்ண முன்னே!
    template = TemplateEngine.processAssets(template, data);

    // 4. For loops process பண்ணு
    template = TemplateEngine.processFor(template, data);

    // 5. If conditions process பண்ணு
    template = TemplateEngine.processIf(template, data);

    // 6. Variables process பண்ணு
    template = TemplateEngine.processVariables(template, data);

    return template;
  },
};

export default TemplateEngine;
