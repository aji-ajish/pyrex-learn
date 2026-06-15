import router from "./routes.js";

const server = Bun.serve({
  port: 3000,
  fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/favicon.ico") {
      return new Response(null, { status: 204 });
    }
    const match = router.match(request.method, path);
    if (match) {
      return router.runMiddlewares(
        request,
        match.middlewares, // ← route-level middlewares
        () => match.handler(match.params),
      );
    }

    // return new Response("404 - Page Not Found", { status: 404 });
  },
});

console.log(`Server is running on http://localhost:${server.port}`);
