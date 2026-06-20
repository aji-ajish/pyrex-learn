const getIP = (request) => {
  return (
    request.headers.get("x-forwarded-for") ||
    request.headers.get("cf-connecting-ip") ||  // Cloudflare
    request.headers.get("x-real-ip") ||          // Nginx
    "127.0.0.1"                                  // default localhost
  );
};

const security = async (request, next, res) => {
  const url = new URL(request.url);
  const body = request.parsedBody || {};

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

  const ip = getIP(request);
  console.log("Request IP:", ip);  // debug

  const response = await fetch("http://localhost:8000/security/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      path: url.pathname,
      method: request.method,
      body: safeBody,
      ip: ip,
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