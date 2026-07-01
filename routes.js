import PageController from "./controllers/PageController.js";
import UserController from "./controllers/UserController.js";
import AuthController from "./controllers/AuthController.js";
import AdminController from "./controllers/AdminController.js";
import Router from "./core/Router.js";
import logger from "./middleware/logger.js";
import auth from "./middleware/auth.js";
import security from "./middleware/security.js";
import cors from "./middleware/cors.js";
import role from "./middleware/role.js";

const router = new Router();

router.use(logger);
router.use(security);
router.use(cors);
const api = router.group("/api/v1");

// SSR — default
router.get("/", PageController.home);
// SPA — dashboard
router.get("/dashboard", { mode: "SPA" }, PageController.dashboard);
// SSG — blog (cache-ல store ஆகும்)
router.get("/blog", { mode: "SSG" }, PageController.blog);
router.get("/about", PageController.about);
router.get("/contact", PageController.contact);
api.get("/user/:id", PageController.user);
api.get("/user/profile/:id", PageController.userProfile);
api.post("/user", PageController.createUser);
api.put("/user/:id", PageController.updateUser);
api.patch("/user/:id", PageController.updateUser);
api.delete("/user/:id", PageController.deleteUser);
// api.post("/login", PageController.loginUser);
api.get("/test-db", PageController.testDb)

api.get("/users", UserController.index);
api.get("/users/:id", UserController.show);
api.post("/users", UserController.create);
api.put("/users/:id", UserController.update);
api.delete("/users/:id", UserController.destroy);

api.post("/register", AuthController.register);
api.post("/login", AuthController.login);

api.get("/profile", [auth], (params, request, res) => {
  return res.status(200).json({ message: "Protected route!", user: request.user });
});

api.post("/logout", [auth], AuthController.logout);

// Admin மட்டும் access பண்ண முடியும்
api.get("/admin/dashboard", [auth, role(["admin"])], (params, request, res) => {
  return res.status(200).json({ message: "Welcome Admin!", user: request.user });
});

// Admin அல்லது Editor access பண்ணலாம்
api.get("/editor/posts", [auth, role(["admin", "editor"])], (params, request, res) => {
  return res.status(200).json({ message: "Editor area!", user: request.user });
});

api.post("/refresh", AuthController.refresh);

api.post("/2fa/enable", [auth], AuthController.enable2FA);
api.post("/2fa/verify", [auth], AuthController.verify2FA);
api.post("/login-2fa", AuthController.loginWith2FA);

api.post("/forgot-password", AuthController.forgotPassword);
api.post("/reset-password", AuthController.resetPassword);

// Admin routes — auth + admin role required
router.get("/admin", [auth, role(["admin"])], AdminController.dashboard);
router.get("/admin/users", [auth, role(["admin"])], AdminController.users);
router.get("/admin/users/create", [auth, role(["admin"])], AdminController.createUserForm);
router.get("/admin/users/:id/edit", [auth, role(["admin"])], AdminController.editUserForm);
router.get("/admin/users/:id/delete", [auth, role(["admin"])], AdminController.deleteUser);
router.get("/admin/audit", [auth, role(["admin"])], AdminController.auditPage);
router.get("/admin/audit/stats", [auth, role(["admin"])], AdminController.auditStats);
router.get("/admin/audit/logs", [auth, role(["admin"])], AdminController.auditLogs);
router.delete("/admin/audit/clear", [auth, role(["admin"])], AdminController.auditClear);
router.post("/admin/users/:id/disable-2fa", [auth, role(["admin"])], AdminController.disable2FA);
// Admin login — auth இல்லாம public!
router.get("/admin/login", (params, request, res) => {
  return res.render("admin/login.html", { title: "Admin Login" });
});

// CSRF token proxy — browser இருந்து directly Python call பண்ண வேண்டாம்!
router.get("/csrf-token", async (params, request, res) => {
  const response = await fetch("http://localhost:8000/csrf/token");
  const data = await response.json();
  return res.status(200).json(data);
});

router.notFound(PageController.notFound);

export default router;
