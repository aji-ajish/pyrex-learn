const bodyParser = async (request) => {
  const contentType = request.headers.get("Content-Type") || "";

  // JSON
  if (contentType.includes("application/json")) {
    return await request.json();
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
  // Helper function add
  const serializeValue = (value) => {
    if (value instanceof File) {
      return {
        name: value.name,
        type: value.type,
        size: value.size,
      };
    }
    return value;
  };
  // Multipart form data (file upload)
  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const body = {};

    for (const [key, value] of formData) {
      const serialized = serializeValue(value); // ← இங்க use பண்ணு
      if (body[key] !== undefined) {
        if (!Array.isArray(body[key])) {
          body[key] = [body[key]];
        }
        body[key].push(serialized);
      } else {
        body[key] = serialized;
      }
    }

    return body;
  }

  // Default — text
  return await request.text();
};

export default bodyParser;
