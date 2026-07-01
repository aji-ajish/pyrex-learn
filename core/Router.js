class Router {
  constructor() {
    this.routes = [];
    this.middlewares = [];
  }

  use(middleware) {
    this.middlewares.push(middleware);
  }

  get(pattern, optionsOrMiddlewares, handler) {
    let middlewares = [];
    let mode = "SSR"; // default

    if (typeof optionsOrMiddlewares === "function") {
      // router.get("/path", handler)
      handler = optionsOrMiddlewares;
    } else if (Array.isArray(optionsOrMiddlewares)) {
      // router.get("/path", [middleware], handler)
      middlewares = optionsOrMiddlewares;
    } else if (typeof optionsOrMiddlewares === "object") {
      // router.get("/path", { mode: "SPA" }, handler)
      mode = optionsOrMiddlewares.mode || "SSR";
      middlewares = optionsOrMiddlewares.middlewares || [];
    }

    this.routes.push({ method: "GET", pattern, middlewares, handler, mode });
  }

  post(pattern, middlewares, handler) {
    if (typeof middlewares === "function") {
      handler = middlewares;
      middlewares = [];
    }
    this.routes.push({ method: "POST", pattern, middlewares, handler });
  }

  put(pattern, middlewares, handler) {
    if (typeof middlewares === "function") {
      handler = middlewares;
      middlewares = [];
    }
    this.routes.push({ method: "PUT", pattern, middlewares, handler });
  }

  patch(pattern, middlewares, handler) {
    if (typeof middlewares === "function") {
      handler = middlewares;
      middlewares = [];
    }
    this.routes.push({ method: "PATCH", pattern, middlewares, handler });
  }

  delete(pattern, middlewares, handler) {
    if (typeof middlewares === "function") {
      handler = middlewares;
      middlewares = [];
    }
    this.routes.push({ method: "DELETE", pattern, middlewares, handler });
  }

  notFound(handler) {
    this.notFoundHandler = handler;
  }

  group(prefix) {
    return {
      get: (pattern, optionsOrMiddlewares, handler) => {
        this.get(prefix + pattern, optionsOrMiddlewares, handler);
      },
      post: (pattern, optionsOrMiddlewares, handler) => {
        this.post(prefix + pattern, optionsOrMiddlewares, handler);
      },
      put: (pattern, optionsOrMiddlewares, handler) => {
        this.put(prefix + pattern, optionsOrMiddlewares, handler);
      },
      patch: (pattern, optionsOrMiddlewares, handler) => {
        this.patch(prefix + pattern, optionsOrMiddlewares, handler);
      },
      delete: (pattern, optionsOrMiddlewares, handler) => {
        this.delete(prefix + pattern, optionsOrMiddlewares, handler);
      },
    };
  }

  async runMiddlewares(request, routeMiddlewares, finalHandler, res) {
    const allMiddlewares = [...this.middlewares, ...(routeMiddlewares || [])];
    let index = 0;

    const next = async () => {
      if (index < allMiddlewares.length) {
        const middleware = allMiddlewares[index];
        index++;
        return await middleware(request, next, res);
      }
      return await finalHandler();
    };

    return next();
  }

  match(method, path) {
    for (const route of this.routes) {
      if (route.method !== method) continue;
      const params = this.matchPattern(route.pattern, path);
      if (params !== null) {
        return {
          handler: route.handler,
          params,
          middlewares: route.middlewares,
          mode: route.mode || "SSR", // ✅ mode return பண்ணு
        };
      }
    }
    if (this.notFoundHandler) {
      return {
        handler: this.notFoundHandler,
        params: {},
        middlewares: [],
        mode: "SSR",
      };
    }
    return null;
  }

  matchPattern(pattern, actual) {
    const patternParts = pattern.split("/");
    const actualParts = actual.split("/");

    if (patternParts.length !== actualParts.length) return null;

    const params = {};

    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(":")) {
        params[patternParts[i].slice(1)] = actualParts[i];
      } else if (patternParts[i] !== actualParts[i]) {
        return null;
      }
    }

    return params;
  }
}

export default Router;
