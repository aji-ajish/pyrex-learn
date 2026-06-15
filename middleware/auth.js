const auth = (request, next) => {
  const token = request.headers.get("Authorization");
  if (!token) {
    return new Response("Unauthorized - No token!", { status: 401 });
  }
  if (token !== "pyrex-secret-123") {
    return new Response("Unauthorized - Invalid token!", { status: 401 });
  }
  return next();
};

export default auth;
