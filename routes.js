import PageController from "./controllers/PageController.js";
import Router from "./core/Router.js";
import logger from "./middleware/logger.js";
import auth from "./middleware/auth.js";

const router = new Router();

router.use(logger);
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

router.notFound(PageController.notFound);

export default router;
