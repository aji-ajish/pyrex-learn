import router from "./routes.js";
import { bodyParser, safeParseBody } from "./core/BodyParser.js";
import config from "./config/framework.config.js";
import TemplateEngine from "./core/TemplateEngine.js";

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
