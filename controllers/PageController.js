import { bodyParser, safeParseBody } from "../core/BodyParser.js";

const PageController = {
  home: (params, request, res) => {
    return res.status(200).send("Welcome to the Home Page!");
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

  notFound: (params, request, res) =>
    res.status(404).send("404 - Page Not Found!"),
};

export default PageController;
