export default {
  security: {
    // Brute Force
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
  // CORS config
  cors: {
    origins: [
      "http://localhost:5173",
      "http://localhost:3000",
      "http://localhost:5500",
      "http://127.0.0.1:5500",
      "http://127.0.0.1:3000",
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    headers: ["Content-Type", "Authorization"],
    credentials: true, // Cookies allow பண்ண
  },
  template: {
    meta: {
      description: "Built with Pyrex Framework",
      keywords: "pyrex, framework, web",
    },
    cdn: {
      styles: [
        "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css",
      ],
      scripts: [
        "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js",
      ],
    },
    external: {
      styles: ["/css/main.css"],
      scripts: ["/js/app.js"],
    },
    inline: {
      styles: "",
      scripts: "",
    },
  },
};
