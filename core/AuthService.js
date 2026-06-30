import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

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
};

export default AuthService;