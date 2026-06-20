import router from "./routes.js";
import { bodyParser, safeParseBody } from "./core/BodyParser.js";
import config from "./config/framework.config.js";

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

    // Static file check
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
    console.log("Content-Type:", request.headers.get("Content-Type"));
    // ✅ Body parse பண்ணு
    const body = await bodyParser(request);
    // console.log("Parsed body:", body);
    // console.log("Body type:", typeof body);
    // ✅ pyrexRequest wrapper create பண்ணு (request readonly fix)
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
        pyrexRequest, // ✅ pyrexRequest use பண்ணு
        match.middlewares,
        () => match.handler(match.params, pyrexRequest, res),
        res,
      );
    }
  },
});

console.log(`${Bun.env.APP_NAME} running on http://localhost:${server.port}`);

await registerSecurityConfig();
