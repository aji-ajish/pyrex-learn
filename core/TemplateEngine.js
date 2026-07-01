import { readFileSync, existsSync } from "fs";
import { join } from "path";

const VIEWS_DIR = join(import.meta.dir, "../views");

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
      }
    );
  },

  // {% extends "layout.html" %} + {% block %} handle பண்ணு
  processExtends: (template) => {
    const extendsMatch = template.match(/\{%\s*extends\s+"([^"]+)"\s*%\}/);
    if (!extendsMatch) return template;

    const layoutPath = extendsMatch[1];
    let layout = TemplateEngine.readTemplate(layoutPath);

    // Blocks extract பண்ணு
    const blockRegex = /\{%\s*block\s+(\w+)\s*%\}([\s\S]*?)\{%\s*endblock\s*%\}/g;
    const blocks = {};
    let match;

    while ((match = blockRegex.exec(template)) !== null) {
      blocks[match[1]] = match[2].trim();
    }

    // Layout-ல blocks replace பண்ணு
    layout = layout.replace(
      /\{%\s*block\s+(\w+)\s*%\}[\s\S]*?\{%\s*endblock\s*%\}/g,
      (match, blockName) => blocks[blockName] || ""
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
      }
    );
  },

  // {% for item in items %} handle பண்ணு
  processFor: (template, data) => {
    return template.replace(
      /\{%\s*for\s+(\w+)\s+in\s+(\w+)\s*%\}([\s\S]*?)\{%\s*endfor\s*%\}/g,
      (match, item, array, content) => {
        const items = data[array];
        if (!Array.isArray(items)) return "";

        return items.map(value => {
          const itemData = { ...data, [item]: value };
          return TemplateEngine.processVariables(content, itemData);
        }).join("");
      }
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
    const styles = data.styles || "";
    const scripts = data.scripts || "";
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

    // 3. For loops process பண்ணு
    template = TemplateEngine.processFor(template, data);

    // 4. If conditions process பண்ணு
    template = TemplateEngine.processIf(template, data);

    // 5. Variables process பண்ணு
    template = TemplateEngine.processVariables(template, data);

    // 6. Assets inject பண்ணு
    template = TemplateEngine.processAssets(template, data);

    return template;
  },
};

export default TemplateEngine;