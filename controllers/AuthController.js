import prisma from "../core/db.js";
import AuthService from "../core/AuthService.js";

const AuthController = {
  // POST /api/v1/register
  register: async (params, request, res) => {
    const body = request.body;

    // check Email already exist
    const existingUser = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (existingUser) {
      return res.status(400).json({ error: "Email already registered!" });
    }

    // Password hash 
    const hashedPassword = await AuthService.hashPassword(body.password);

    // User create 
    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        password: hashedPassword,
      },
    });

    const payload = { id: user.id, email: user.email, role: user.role };
    const token = AuthService.generateToken(payload);
    const refreshToken = AuthService.generateRefreshToken(payload);

    await AuthService.createSession(user.id, token, refreshToken);

    return res.status(201).json({
      message: "User registered!",
      token,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email },
    });
  },

  // POST /api/v1/login
  login: async (params, request, res) => {
    const body = request.body;

    // User find 
    const user = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password!" });
    }

    // Password compare 
    const isValid = await AuthService.comparePassword(body.password, user.password);

    if (!isValid) {
      return res.status(401).json({ error: "Invalid email or password!" });
    }

    const payload = { id: user.id, email: user.email, role: user.role };
    const token = AuthService.generateToken(payload);
    const refreshToken = AuthService.generateRefreshToken(payload);

    await AuthService.createSession(user.id, token, refreshToken);

    return res.status(200).json({
      message: "Login successful!",
      token,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email },
    });
  },

  // ✅ Refresh access token
  refresh: async (params, request, res) => {
    const body = request.body;
    const { refreshToken } = body;

    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token required!" });
    }

    const newToken = await AuthService.refreshAccessToken(refreshToken);

    if (!newToken) {
      return res.status(401).json({ error: "Invalid or expired refresh token!" });
    }

    return res.status(200).json({
      message: "Token refreshed!",
      token: newToken,
    });
  },

  logout: async (params, request, res) => {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];

    if (token) {
      await AuthService.destroySession(token);
    }

    return res.status(200).json({ message: "Logged out successfully!" });
  },
};

export default AuthController;