import PageController from "./controllers/PageController.js";
import Router from "./core/Router.js";
import logger from "./middleware/logger.js";
import auth from "./middleware/auth.js";

const router = new Router();

router.use(logger);

router.get("/", PageController.home);
router.get("/about",[auth], PageController.about);
router.get("/contact", PageController.contact);
router.get("/user/:id", PageController.user);
router.get("/user/profile/:id", PageController.userProfile);

router.notFound(PageController.notFound);

export default router;
