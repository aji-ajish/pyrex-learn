import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "./db.js";

const JWT_SECRET = Bun.env.JWT_SECRET || "pyrex-secret-123";

const AuthService = {
  // Password hash
  hashPassword: async (password) => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  },

  // Password compare
  comparePassword: async (password, hash) => {
    return await bcrypt.compare(password, hash);
  },

  // Access token — short-lived
  generateToken: (payload) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "60m" });  // ✅ 15 minutes
  },

  // Refresh token — long-lived
  generateRefreshToken: (payload) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });  // ✅ 7 days
  },

  verifyToken: (token) => {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return null;
    }
  },

  // Session create — both tokens store
  createSession: async (userId, token, refreshToken) => {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    return await prisma.session.create({
      data: { userId, token, refreshToken, expiresAt },
    });
  },

  // ✅ check Session valid
  isSessionValid: async (token) => {
    const session = await prisma.session.findFirst({
      where: { token },
    });

    if (!session) return false;
    if (new Date() > session.expiresAt) {
      await prisma.session.delete({ where: { id: session.id } });
      return false;
    }
    return true;
  },

  // ✅ Logout — session delete
  destroySession: async (token) => {
    try {
      const session = await prisma.session.findFirst({ where: { token } });
      if (session) {
        await prisma.session.delete({ where: { id: session.id } });
      }
      return true;
    } catch (e) {
      return false;
    }
  },

  // ✅ Refresh token-ஓட புது access token generate பண்ணு
  refreshAccessToken: async (refreshToken) => {
    const decoded = AuthService.verifyToken(refreshToken);
    if (!decoded) return null;

    const session = await prisma.session.findFirst({
      where: { refreshToken },
    });

    if (!session) return null;
    if (new Date() > session.expiresAt) {
      await prisma.session.delete({ where: { id: session.id } });
      return null;
    }

    // புது access token generate பண்ணு
    const newAccessToken = AuthService.generateToken({
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    });

    // Session-ல new token update பண்ணு
    await prisma.session.update({
      where: { id: session.id },
      data: { token: newAccessToken },
    });

    return newAccessToken;
  },
};

export default AuthService;