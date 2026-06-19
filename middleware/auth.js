const auth = (request, next,res) => {
  const token = request.headers.get("Authorization");
  if (!token) {
    return res.status(401).json({ error: "Unauthorized - No token!" });
  }
  if (token !== Bun.env.JWT_SECRET) {
    return res.status(401).json({ error: "Unauthorized - Invalid token!!" });
  }
  return next();
};

export default auth;
