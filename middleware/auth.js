import AuthService from "../core/AuthService.js";

const auth = async (request, next, res) => {
  const authHeader = request.headers.get("Authorization");
  console.log("Auth header:", authHeader);

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided!" });
  }

  const token = authHeader.split(" ")[1];
  console.log("Token:", token);

  const decoded = AuthService.verifyToken(token);
  console.log("Decoded:", decoded);

  if (!decoded) {
    return res.status(401).json({ error: "Invalid or expired token!" });
  }

  const sessionValid = await AuthService.isSessionValid(token);
  console.log("Session valid:", sessionValid);

  if (!sessionValid) {
    return res.status(401).json({ error: "Session expired or logged out!" });
  }

  request.user = decoded;
  return next();
};

export default auth;