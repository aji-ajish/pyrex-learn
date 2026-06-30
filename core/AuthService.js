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

  // JWT token generate 
  generateToken: (payload) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
  },

  // JWT token verify 
  verifyToken: (token) => {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return null;
    }
  },

  // ✅ Session create 
  createSession: async (userId, token) => {
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    return await prisma.session.create({
      data: { userId, token, expiresAt },
    });
  },

  // ✅ Session valid-ஆ check 
  isSessionValid: async (token) => {
    const session = await prisma.session.findUnique({
      where: { token },
    });

    if (!session) return false;
    if (new Date() > session.expiresAt) {
      await prisma.session.delete({ where: { token } });
      return false;
    }
    return true;
  },

  // ✅ Logout — session delete 
  destroySession: async (token) => {
    try {
      await prisma.session.delete({ where: { token } });
      return true;
    } catch (e) {
      return false;
    }
  },
};

export default AuthService;