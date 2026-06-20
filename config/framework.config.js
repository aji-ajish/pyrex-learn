export default {
  security: {
    bruteForce: {
      routes: ["/api/v1/login1", "/api/v1/login", "/admin/login"],
      maxAttempts: 5,
      window: 300,
    },
    // IP config
    blacklist: [], // always block
    whitelist: [], // empty = allow all
    routeWhitelist: {
      "/admin": ["127.0.0.1"], // admin — office IP மட்டும்
    },
  },
};
