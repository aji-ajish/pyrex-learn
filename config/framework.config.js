export default {
  security: {
    bruteForce: {
      routes: ["/api/v1/login1", "/api/v1/login", "/admin/login"],
      maxAttempts: 5,
      window: 300,
    },
    // IP config
    blacklist: ["127.0.0.33","127.0.0.34","127.0.0.35"], // always block
    whitelist: ["127.0.0.22","127.0.0.23","127.0.0.24"], // empty = allow all
    routeWhitelist: {
      "/admin": ["127.0.0.1"], // admin — office IP மட்டும்
    },
  },
};
