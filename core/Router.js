class Router {
  constructor() {
    this.routes = [];
    this.middlewares = [];
  }

  use(middleware) {
    this.middlewares.push(middleware);
  }

  get(pattern, middlewares, handler) {
    if (typeof middlewares === "function") {
      handler = middlewares;
      middlewares = [];
    }
    this.routes.push({ method: "GET", pattern, middlewares, handler });
  }

  post(pattern, middlewares, handler) {
    if (typeof middlewares === "function") {
      handler = middlewares;
      middlewares = [];
    }
    this.routes.push({ method: "POST", pattern, middlewares, handler });
  }

  notFound(handler) {
    this.notFoundHandler = handler;
  }

  async runMiddlewares(request, routeMiddlewares, finalHandler,res) {
    const allMiddlewares = [...this.middlewares, ...(routeMiddlewares || [])];
    let index = 0;

    const next = async () => {
      if (index < allMiddlewares.length) {
        const middleware = allMiddlewares[index];
        index++;
        return await middleware(request, next,res);
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
        };
      }
    }
    if (this.notFoundHandler) {
      return { handler: this.notFoundHandler, params: {}, middlewares: [] };
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
