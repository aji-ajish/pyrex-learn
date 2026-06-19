import router from "./routes.js";

const server = Bun.serve({
  port: Bun.env.PORT || 3000,
  fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/favicon.ico") {
      return new Response(null, { status: 204 });
    }
    const match = router.match(request.method, path);
    if (match) {
      const res = {
        status: (code) => {
          return {
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
          };
        },
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
      return router.runMiddlewares(request, match.middlewares, () =>
        match.handler(match.params, request, res),res
      );
    }
  },
});

console.log(`${Bun.env.APP_NAME} running on http://localhost:${server.port}`);
