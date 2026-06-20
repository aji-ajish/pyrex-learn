import config from "../config/framework.config.js";

const cors = (request, next, res) => {
  const origin = request.headers.get("origin") || "";
  const allowedOrigins = config.cors.origins;
 

  const isAllowed = allowedOrigins.length > 0 &&
    (allowedOrigins.includes(origin) || allowedOrigins.includes("*"));

  const corsHeaders = {
    "Access-Control-Allow-Origin": isAllowed ? origin : "",
    "Access-Control-Allow-Methods": config.cors.methods.join(", "),
    "Access-Control-Allow-Headers": config.cors.headers.join(", "),
    "Access-Control-Allow-Credentials": config.cors.credentials.toString(),
  };
  // Preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Origin not allowed — CORS headers இருந்தாலும் 403!
  if (!isAllowed && origin) {
    return new Response(
      JSON.stringify({ error: "CORS: Origin not allowed!" }),
      {
        status: 403,
        headers: {
          ...corsHeaders,  // ✅ CORS headers add பண்ணு
          "Content-Type": "application/json"
        }
      }
    );
  }

  // Normal request
  const response = next();
  if (response instanceof Promise) {
    return response.then(r => addCorsHeaders(r, corsHeaders));
  }
  return addCorsHeaders(response, corsHeaders);
};

const addCorsHeaders = (response, corsHeaders) => {
  if (!response) return response;
  const newHeaders = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders)) {
    newHeaders.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    headers: newHeaders,
  });
};



export default cors;