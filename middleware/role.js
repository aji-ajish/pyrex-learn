const role = (allowedRoles) => {
  return (request, next, res) => {
    if (!request.user) {
      return res.status(401).json({ error: "Not authenticated!" });
    }

    if (!allowedRoles.includes(request.user.role)) {
      return res.status(403).json({
        error: `Access denied! Requires role: ${allowedRoles.join(" or ")}`
      });
    }

    return next();
  };
};

export default role;