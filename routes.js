import PageController from "./controllers/PageController.js";
import UserController from "./controllers/UserController.js";
import AuthController from "./controllers/AuthController.js";
import Router from "./core/Router.js";
import logger from "./middleware/logger.js";
import auth from "./middleware/auth.js";
import security from "./middleware/security.js";
import cors from "./middleware/cors.js";

const router = new Router();

router.use(logger);
router.use(security);
router.use(cors);
const api = router.group("/api/v1");

api.get("/", PageController.home);
api.get("/about", [auth], PageController.about);
api.get("/contact", PageController.contact);
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

router.notFound(PageController.notFound);

export default router;
