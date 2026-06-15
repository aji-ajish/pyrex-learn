const logger = (request, next) => {
  const method = request.method;
  const url = new URL(request.url);
  const path = url.pathname;
  const time = new Date().toLocaleTimeString();
  console.log(`[${time}] ${method} ${path}`);
  return next();
};

export default logger;
