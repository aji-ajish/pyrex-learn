import router from "./routes.js";
import { bodyParser, safeParseBody } from "./core/BodyParser.js";
import config from "./config/framework.config.js";
import TemplateEngine from "./core/TemplateEngine.js";
import SSGBuilder from "./core/SSGBuilder.js";

async function registerSecurityConfig() {
  try {
    const base = "http://localhost:8000";
    const headers = { "Content-Type": "application/json" };

    // ✅ முதல்ல reset பண்ணு — old config clear!
    await fetch(`${base}/config/reset`, { method: "POST", headers });

    // Brute force routes
    await fetch(`${base}/config/brute-force-routes`, {
      method: "POST",
      headers,
      body: JSON.stringify({ routes: config.security.bruteForce.routes }),
    });

    // Blacklist IPs
    for (const ip of config.security.blacklist) {
      await fetch(`${base}/config/blacklist/add`, {
        method: "POST",
        headers,
        body: JSON.stringify({ ip }),
      });
    }

    // Whitelist IPs
    for (const ip of config.security.whitelist) {
      await fetch(`${base}/config/whitelist/add`, {
        method: "POST",
        headers,
        body: JSON.stringify({ ip }),
      });
    }

    // Route whitelist
    for (const [route, ips] of Object.entries(config.security.routeWhitelist)) {
      await fetch(`${base}/config/route-whitelist`, {
        method: "POST",
        headers,
        body: JSON.stringify({ route, ips }),
      });
    }

    console.log("Security config registered!");
  } catch (e) {
    console.log("Python server not ready:", e.message);
  }
}

const server = Bun.serve({
  port: Bun.env.PORT || 3000,
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/favicon.ico") {
      return new Response(null, { status: 204 });
    }
    if (
      path.startsWith("/css/") ||
      path.startsWith("/js/") ||
      path.startsWith("/images/") ||
      path.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/)
    ) {
      const { join } = await import("path");
      const staticPath = join(import.meta.dir, "public", path);
      const staticFile = Bun.file(staticPath);
      if (await staticFile.exists()) {
        return new Response(staticFile);
      }
      return new Response("Not Found", { status: 404 });
    }

    // ✅ Routes முதல்ல check பண்ணு
    const body = await bodyParser(request);
    const pyrexRequest = {
      raw: request,
      method: request.method,
      headers: request.headers,
      url: request.url,
      parsedBody: body,
      body: safeParseBody(body),
    };

    const match = router.match(request.method, path);
    if (match) {
      const res = {
        render: (templatePath, data = {}) => {
          // SSG mode — cache use பண்ணு
          if (match.mode === "SSG") {
            const html = SSGBuilder.serve(path, () =>
              TemplateEngine.render(templatePath, data),
            );
            return new Response(html, {
              status: 200,
              headers: { "Content-Type": "text/html" },
            });
          }

          // SPA mode
          if (match.mode === "SPA") {
            const html = TemplateEngine.render(templatePath, data);
            const spaScript = `<script>
    document.addEventListener("click", (e) => {
      const link = e.target.closest("a");
      if (!link) return;
      const href = link.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("#")) return;
      e.preventDefault();
      history.pushState({}, "", href);
      loadPage(href);
    });

    async function loadPage(url) {
      const res = await fetch(url, {
        headers: { "X-SPA-Request": "true" }
      });
      const html = await res.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      document.querySelector("main").innerHTML =
        doc.querySelector("main").innerHTML;
      document.title = doc.title;
    }

    window.addEventListener("popstate", () => {
      loadPage(location.pathname);
    });
  <\/script>`;

            // ✅ </body> முன்னே inject பண்ணு
            const finalHtml = html.replace("</body>", spaScript + "\n</body>");
            return new Response(finalHtml, {
              status: 200,
              headers: { "Content-Type": "text/html" },
            });
          }

          // SSR mode (default)
          const html = TemplateEngine.render(templatePath, data);
          return new Response(html, {
            status: 200,
            headers: { "Content-Type": "text/html" },
          });
        },
        status: (code) => ({
          json: (data) =>
            new Response(JSON.stringify(data), {
              status: code,
              headers: { "Content-Type": "application/json" },
            }),
          send: (text) => new Response(text, { status: code }),
          redirect: (url) =>
            new Response(null, {
              status: code,
              headers: { Location: url },
            }),
        }),
        json: (data) =>
          new Response(JSON.stringify(data), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        send: (text) => new Response(text, { status: 200 }),
        redirect: (url) =>
          new Response(null, {
            status: 302,
            headers: { Location: url },
          }),
      };
      return router.runMiddlewares(
        pyrexRequest,
        match.middlewares,
        () => match.handler(match.params, pyrexRequest, res),
        res,
      );
    }

    // ✅ Route match இல்லன்னா மட்டும் static files check பண்ணு
    const { join } = await import("path");
    const staticPath = join(
      import.meta.dir,
      "public",
      path === "/" ? "/index.html" : path,
    );
    const staticFile = Bun.file(staticPath);
    if (await staticFile.exists()) {
      return new Response(staticFile);
    }

    return new Response("404 - Page Not Found", { status: 404 });
  },
});

console.log(`${Bun.env.APP_NAME} running on http://localhost:${server.port}`);

await registerSecurityConfig();
