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
};
