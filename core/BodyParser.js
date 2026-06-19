export const bodyParser = async (request) => {
  const contentType = request.headers.get("Content-Type") || "";

  // JSON
  if (contentType.includes("application/json")) {
  try {
    const text = await request.text();
    // console.log lines எல்லாம் remove பண்ணு
    if (typeof text === "string" && text.length > 0) {
      return JSON.parse(text);
    }
    return {};
  } catch(e) {
    return {};
  }
}

  // Form data
  if (contentType.includes("application/x-www-form-urlencoded")) {
    const text = await request.text();
    const params = new URLSearchParams(text);
    const body = {};
    for (const [key, value] of params) {
      body[key] = value;
    }
    return body;
  }

  // Multipart
  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const body = {};
    for (const [key, value] of formData) {
      if (body[key] !== undefined) {
        if (!Array.isArray(body[key])) {
          body[key] = [body[key]];
        }
        body[key].push(value);
      } else {
        body[key] = value;
      }
    }
    return body;
  }

  return await request.text();
};

export const safeParseBody = (body) => {
  const safe = {};
  for (const [key, value] of Object.entries(body)) {
    if (Array.isArray(value)) {
      safe[key] = value.map((v) =>
        v instanceof File ? { name: v.name, type: v.type, size: v.size } : v,
      );
    } else if (value instanceof File) {
      safe[key] = { name: value.name, type: value.type, size: value.size };
    } else {
      safe[key] = value;
    }
  }
  return safe;
};
