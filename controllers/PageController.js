import { bodyParser, safeParseBody } from "../core/BodyParser.js";
import prisma from "../core/db.js";

const PageController = {
  home: async (params, request, res) => {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true },
    });

    return res.render("pages/home.html", {
      title: "Home",
      name: "Ajish",
      role: "admin",
      users,
      user: { name: "Ajish" }, // navbar-ku
    });
  },
  dashboard: (params, request, res) => {
    return res.render("pages/dashboard.html", { title: "Dashboard" });
  },

  blog: (params, request, res) => {
    return res.render("pages/blog.html", { title: "Blog" });
  },
  about: (params, request, res) =>
    res.status(200).send("This is the About Page!"),
  contact: (params, request, res) => res.status(302).redirect("/user/20"),
  user: (params, request, res) => res.status(200).send(`User ID: ${params.id}`),
  userProfile: (params, request, res) =>
    res.status(200).send(`User Profile name: ${params.id}`),
  createUser: async (params, request, res) => {
    const body = request.body; // ✅ files already serialized!
    return res.status(201).json({ message: "User created!", data: body });
  },
  updateUser: (params, request, res) => {
    return res.status(200).json({ message: `User ${params.id} updated!` });
  },

  deleteUser: (params, request, res) => {
    return res.status(200).json({ message: `User ${params.id} deleted!` });
  },
  loginUser: async (params, request, res) => {
    const body = request.body; // ✅ files already serialized!
    return res.status(201).json({ message: "user login!", data: body });
  },
  testDb: async (params, request, res) => {
    const user = await prisma.user.create({
      data: {
        name: "Ajish",
        email: "ajish@test.com",
        password: "hashed123",
      },
    });
    return res.status(201).json({ message: "User created in DB!", user });
  },

  notFound: (params, request, res) =>
    res.status(404).send("404 - Page Not Found!"),
};

export default PageController;
