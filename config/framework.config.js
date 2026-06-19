// config/framework.config.js
export default {
  security: {
    bruteForce: {
      routes: [
        "/api/v1/login1",
        "/api/v1/login",
        "/admin/login"
      ],
      maxAttempts: 5,
      window: 300
    }
  }
}