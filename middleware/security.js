const security = async (request, next, res) => {
  const url = new URL(request.url);

  // ✅ Already parsed body use பண்ணு — again parse வேண்டாம்!
  const body = request.parsedBody || {};

  // File objects-ஐ string-ஆ convert பண்ணு
  const safeBody = {};
  for (const [key, value] of Object.entries(body)) {
    if (Array.isArray(value)) {
      safeBody[key] = value.map((v) => (v instanceof File ? v.name : v));
    } else if (value instanceof File) {
      safeBody[key] = value.name;
    } else {
      safeBody[key] = value;
    }
  }

  const response = await fetch("http://localhost:8000/security/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      path: url.pathname,
      method: request.method,
      body: safeBody,
      ip: request.headers.get("x-forwarded-for") || "unknown",
    }),
  });

  const result = await response.json();

  if (!result.allowed) {
    return res.status(403).json({
      error: "Request blocked!",
      reason: result.reason,
    });
  }

  return next();
};

export default security;
