import AuthService from "../core/AuthService.js";

const auth = (request, next, res) => {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided!" });
  }

  const token = authHeader.split(" ")[1];
  const decoded = AuthService.verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: "Invalid or expired token!" });
  }

  // attach user info in request
  request.user = decoded;

  return next();
};

export default auth;