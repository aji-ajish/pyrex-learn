import prisma from "../core/db.js";

const UserController = {
  // GET /api/v1/users
  index: async (params, request, res) => {
    const users = await prisma.user.findMany();
    return res.status(200).json({ users });
  },

  // GET /api/v1/users/:id
  show: async (params, request, res) => {
    const user = await prisma.user.findUnique({
      where: { id: Number(params.id) },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found!" });
    }

    return res.status(200).json({ user });
  },

  // POST /api/v1/users
  create: async (params, request, res) => {
    const body = request.body;

    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        password: body.password,
      },
    });

    return res.status(201).json({ message: "User created!", user });
  },

  // PUT /api/v1/users/:id
update: async (params, request, res) => {
  const body = request.body;

  const user = await prisma.user.update({
    where: { id: Number(params.id) },
    data: {
      name: body.name,
      email: body.email,
      role: body.role,  
    },
  });

  return res.status(200).json({ message: "User updated!", user });
},

  // DELETE /api/v1/users/:id
  destroy: async (params, request, res) => {
    await prisma.user.delete({
      where: { id: Number(params.id) },
    });

    return res.status(200).json({ message: "User deleted!" });
  },
};

export default UserController;