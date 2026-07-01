import prisma from "../core/db.js";

const AdminController = {
  // GET /admin — Dashboard
  dashboard: async (params, request, res) => {
    const totalUsers = await prisma.user.count();
    const totalSessions = await prisma.session.count();
    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // Audit stats Python-இருந்து எடு
    let totalRequests = 0;
    let blockedRequests = 0;
    try {
      const statsRes = await fetch("http://localhost:8000/audit/stats");
      const stats = await statsRes.json();
      totalRequests = stats.total_requests || 0;
      blockedRequests = stats.blocked || 0;
    } catch (e) {}

    return res.render("admin/dashboard.html", {
      title: "Dashboard",
      totalUsers,
      totalSessions,
      totalRequests,
      blockedRequests,
      recentUsers,
    });
  },

  // GET /admin/users — User list
  users: async (params, request, res) => {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });

    return res.render("admin/users.html", {
      title: "Users",
      users,
      totalUsers: users.length,
    });
  },

  // GET /admin/users/create — Create form
  createUserForm: (params, request, res) => {
    return res.render("admin/user-form.html", {
      title: "Create User",
      formAction: "/admin/users",
      user: { name: "", email: "", role: "user" },
    });
  },

  // GET /admin/users/:id/edit — Edit form
  editUserForm: async (params, request, res) => {
    const user = await prisma.user.findUnique({
      where: { id: Number(params.id) },
    });

    if (!user) {
      return res.status(404).send("User not found!");
    }

    return res.render("admin/user-form.html", {
      title: "Edit User",
      formAction: `/api/v1/users/${params.id}`, // ✅ API route use பண்ணு
      formMethod: "PUT",
      user,
      userRole: user.role, // ✅ current role pass பண்ணு
    });
  },

  createUserForm: (params, request, res) => {
    return res.render("admin/user-form.html", {
      title: "Create User",
      formAction: "/api/v1/users", // ✅ API route
      formMethod: "POST",
      user: { name: "", email: "", role: "user" },
      userRole: "user",
    });
  },
  disable2FA: async (params, request, res) => {
    await prisma.user.update({
      where: { id: Number(params.id) },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });
    return res.status(200).json({ message: "2FA disabled!" });
  },
  // GET /admin/users/:id/delete — Delete user
  deleteUser: async (params, request, res) => {
    await prisma.user.delete({
      where: { id: Number(params.id) },
    });

    return res.status(302).redirect("/admin/users");
  },

  // GET /admin/audit — Audit logs
  auditLogs: async (params, request, res) => {
    let logs = [];
    let stats = {};
    try {
      const logsRes = await fetch("http://localhost:8000/audit/logs?limit=50");
      const data = await logsRes.json();
      logs = data.logs || [];

      const statsRes = await fetch("http://localhost:8000/audit/stats");
      stats = await statsRes.json();
    } catch (e) {}

    return res.json({ logs, stats });
  },
  // Audit proxy endpoints
  auditStats: async (params, request, res) => {
    const response = await fetch("http://localhost:8000/audit/stats");
    const data = await response.json();
    return res.status(200).json(data);
  },

  auditLogs: async (params, request, res) => {
    const response = await fetch("http://localhost:8000/audit/logs?limit=50");
    const data = await response.json();
    return res.status(200).json(data);
  },

  auditPage: (params, request, res) => {
    return res.render("admin/audit.html", { title: "Audit Logs" });
  },
  auditClear: async (params, request, res) => {
    await fetch("http://localhost:8000/audit/clear", { method: "DELETE" });
    return res.status(200).json({ message: "Logs cleared!" });
  },
};

export default AdminController;
