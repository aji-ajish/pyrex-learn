import bodyParser from "../core/BodyParser.js";

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
    const body = await bodyParser(request);
    console.log("Body:", body);
    return res.status(201).json({ message: "User created!", data: body });
  },

  notFound: (params, request, res) =>
    res.status(404).send("404 - Page Not Found!"),
};

export default PageController;
