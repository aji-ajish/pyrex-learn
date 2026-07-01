import AuthService from "../core/AuthService.js";

const auth = async (request, next, res) => {
  let token = null;

  // ✅ Header இருந்தா use பண்ணு (API calls)
  const authHeader = request.headers.get("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  // ✅ Cookie இருந்தா use பண்ணு (Browser)
  if (!token) {
    const cookies = request.headers.get("cookie") || "";
    const cookieMap = Object.fromEntries(
      cookies.split(";").map((c) => c.trim().split("=")),
    );
    token = cookieMap["pyrex_token"];
  }

  if (!token) {
    // ✅ API request-ஆ இல்ல browser-ஆன்னு check பண்ணு
    const acceptHeader = request.headers.get("accept") || "";
    if (acceptHeader.includes("text/html")) {
      // Browser — login page-ku redirect பண்ணு
      return res.status(302).redirect("/admin/login");
    }
    return res.status(401).json({ error: "No token provided!" });
  }

  const decoded = AuthService.verifyToken(token);
  if (!decoded) {
    if (request.headers.get("accept")?.includes("text/html")) {
      return res.status(302).redirect("/admin/login");
    }
    return res.status(401).json({ error: "Invalid or expired token!" });
  }

  const sessionValid = await AuthService.isSessionValid(token);
  if (!sessionValid) {
    if (request.headers.get("accept")?.includes("text/html")) {
      return res.status(302).redirect("/admin/login");
    }
    return res.status(401).json({ error: "Session expired or logged out!" });
  }

  request.user = decoded;
  return next();
};

export default auth;
