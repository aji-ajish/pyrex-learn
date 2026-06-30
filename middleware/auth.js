import AuthService from "../core/AuthService.js";

const auth = async (request, next, res) => {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided!" });
  }

  const token = authHeader.split(" ")[1];
  const decoded = AuthService.verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: "Invalid or expired token!" });
  }

  // ✅ check the Session is valide in DB
  const sessionValid = await AuthService.isSessionValid(token);

  if (!sessionValid) {
    return res.status(401).json({ error: "Session expired or logged out!" });
  }

  request.user = decoded;
  return next();
};

export default auth;